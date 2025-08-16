import type { Route } from "./+types/route";
import { useLoaderData, useFetcher } from "react-router";
import { checkUser } from "~/lib/auth/session";
import { redirect } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import {
	householdsTable,
	householdUsersTable,
	expensesTable,
	usersTable,
	categoriesTable,
	tagsTable,
} from "server/db/schema";
import { eq, and, sql, count, desc } from "drizzle-orm";
import {
	Container,
	Flex,
	Text,
	TextField,
	Box,
} from "@radix-ui/themes";
import { HamburgerMenu } from "~/components/HamburgerMenu";
import { EditExpenseDialog } from "~/components/EditExpenseDialog";
import { ExpenseTable } from "~/components/ExpenseTable";
import { SummaryStats } from "~/components/SummaryStats";
import { PaginationControls } from "~/components/PaginationControls";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { parseWithValibot } from "@conform-to/valibot";
import { ExpenseFormSchema } from "~/lib/validation";

export const loader = async ({
	request,
	params,
	context,
}: Route.LoaderArgs) => {
	const url = new URL(request.url);
	const ymParam = url.searchParams.get("ym");
	const pageParam = url.searchParams.get("page");

	const now = new Date();
	const defaultYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	const ym = ymParam ?? defaultYm;
	const page = Number(pageParam) || 1;
	const pageSize = 20;
	const offset = (page - 1) * pageSize;

	const user = await checkUser(context.hono.context);
	if (user.state !== "authenticated") {
		return redirect("/signin");
	}

	const db = drizzle(context.cloudflare.env.DB);

	const household = await db
		.select()
		.from(householdsTable)
		.where(eq(householdsTable.id, params.id))
		.get();

	if (!household) throw new Response("Not Found", { status: 404 });

	const userHousehold = await db
		.select({ owner: householdUsersTable.owner })
		.from(householdUsersTable)
		.where(
			and(
				eq(householdUsersTable.user_id, user.userId),
				eq(householdUsersTable.household_id, params.id),
			),
		)
		.get();

	if (!userHousehold) throw new Response("Forbidden", { status: 403 });

	const members = await db
		.select({ id: usersTable.id, name: usersTable.name })
		.from(householdUsersTable)
		.innerJoin(usersTable, eq(householdUsersTable.user_id, usersTable.id))
		.where(eq(householdUsersTable.household_id, params.id));

	const ymPrefix = `${ym}%`;

	// サマリー用の簡単な集計
	const expenses = await db
		.select({
			amount: expensesTable.amount,
			payer: expensesTable.payer,
		})
		.from(expensesTable)
		.where(
			and(
				eq(expensesTable.household_id, params.id),
				sql`${expensesTable.paid_at} LIKE ${ymPrefix}`,
			),
		);

	const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

	const perPayerMap: Record<string, number> = {};
	for (const { payer, amount } of expenses) {
		perPayerMap[payer] = (perPayerMap[payer] || 0) + amount;
	}

	const perPayer = members.map((m) => ({
		name: m.name,
		amount: perPayerMap[m.id] || 0,
	}));

	// 詳細データのページング取得
	const [detailExpenses] = await Promise.all([
		db
			.select({
				id: expensesTable.id,
				amount: expensesTable.amount,
				note: expensesTable.note,
				paid_at: expensesTable.paid_at,
				category_id: expensesTable.category_id,
				tag_id: expensesTable.tag_id,
				payer: expensesTable.payer,
				categoryName: categoriesTable.name,
				tagName: tagsTable.name,
				payerName: usersTable.name,
			})
			.from(expensesTable)
			.innerJoin(
				categoriesTable,
				eq(expensesTable.category_id, categoriesTable.id),
			)
			.leftJoin(tagsTable, eq(expensesTable.tag_id, tagsTable.id))
			.innerJoin(usersTable, eq(expensesTable.payer, usersTable.id))
			.where(
				and(
					eq(expensesTable.household_id, params.id),
					sql`${expensesTable.paid_at} LIKE ${ymPrefix}`,
				),
			)
			.orderBy(desc(expensesTable.paid_at), desc(expensesTable.id))
			.limit(pageSize)
			.offset(offset),
	]);

	// 編集用のデータを取得
	const categories = await db
		.select({ id: categoriesTable.id, name: categoriesTable.name })
		.from(categoriesTable)
		.where(
			and(
				eq(categoriesTable.household_id, params.id),
				eq(categoriesTable.is_expense, true),
			),
		);

	const tags = await db
		.select({ id: tagsTable.id, name: tagsTable.name })
		.from(tagsTable)
		.where(eq(tagsTable.household_id, params.id));

	// 総件数を取得
	const [totalCountResult] = await db
		.select({ count: count() })
		.from(expensesTable)
		.where(
			and(
				eq(expensesTable.household_id, params.id),
				sql`${expensesTable.paid_at} LIKE ${ymPrefix}`,
			),
		);

	const totalCount = totalCountResult?.count || 0;
	const totalPages = Math.ceil(totalCount / pageSize);

	return {
		household,
		isOwner: userHousehold.owner,
		summary: { totalAmount, perPayer, ym },
		detailExpenses,
		pagination: {
			currentPage: page,
			totalPages,
			totalCount,
			pageSize,
		},
		categories,
		tags,
		members,
	};
};

export const action = async ({
	request,
	params,
	context,
}: Route.ActionArgs) => {
	const user = await checkUser(context.hono.context);
	if (user.state !== "authenticated") {
		return redirect("/signin");
	}

	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "update") {
		const submission = parseWithValibot(formData, {
			schema: ExpenseFormSchema,
		});
		if (submission.status !== "success") {
			return submission.reply();
		}

		const { amount, category, tags, note, payer, paidAt } = submission.value;
		const expenseId = formData.get("expenseId");

		if (!expenseId) {
			return { error: "支出IDが必要です" };
		}

		const db = drizzle(context.cloudflare.env.DB);

		// 支出の更新
		const tagIds = String(tags).split(",").filter(Boolean);
		const tagId = tagIds.length > 0 ? tagIds[0] : undefined;
		await db
			.update(expensesTable)
			.set({
				amount,
				category_id: String(category),
				tag_id: tagId,
				note,
				payer: String(payer),
				paid_at: paidAt,
			})
			.where(
				and(
					eq(expensesTable.id, String(expenseId)),
					eq(expensesTable.household_id, params.id as string),
				),
			);

		return { success: "支出を更新しました" };
	}

	return null;
};


export default function HouseholdSummaryPage() {
	const {
		household,
		isOwner,
		summary,
		detailExpenses,
		pagination,
		categories,
		tags,
		members,
	} = useLoaderData<typeof loader>();
	const fetcher = useFetcher<typeof loader>();
	const editFetcher = useFetcher<typeof action>();
	const currentSummary = fetcher.data?.summary ?? summary;
	const currentDetailExpenses = fetcher.data?.detailExpenses ?? detailExpenses;
	const currentPagination = fetcher.data?.pagination ?? pagination;
	const currentCategories = fetcher.data?.categories ?? categories;
	const currentTags = fetcher.data?.tags ?? tags;
	const currentMembers = fetcher.data?.members ?? members;

	const [editingExpense, setEditingExpense] = useState<any | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

	const handleCloseEditDialog = useCallback(() => {
		setIsEditDialogOpen(false);
		setEditingExpense(null);
		// データをリフレッシュ
		fetcher.load(window.location.pathname + window.location.search);
	}, [fetcher.load]);

	return (
		<Flex style={{ minHeight: "100vh", backgroundColor: "#F8F6F1" }}>
			{/* サイドバー（ハンバーガーメニュー） */}
			<Box style={{ position: "fixed", left: 0, top: 0, zIndex: 10 }}>
				<HamburgerMenu householdId={household.id} isOwner={isOwner} />
			</Box>

			{/* メインコンテンツ */}
			<Box
				style={{
					marginLeft: "var(--sidebar-width, 45px)",
					width: "calc(100% - var(--sidebar-width, 45px))",
					padding: "var(--space-4)",
					transition: "margin-left 0.2s ease, width 0.2s ease",
					backgroundColor: "#F8F6F1",
					color: "#383838",
				}}
			>
				<Container size="3" pt="4" style={{ maxWidth: "100%" }}>
					<Flex
						justify="center"
						align="center"
						mb="4"
						style={{ position: "relative" }}
					>
						<Text size="6" weight="bold">
							{household.name} - サマリー
						</Text>
					</Flex>

					<Flex direction="column" p="4" gap="4">
						{/* 月選択 */}
						<fetcher.Form
							method="get"
							style={{ marginBottom: "var(--space-2)" }}
						>
							<Flex align="center" gap="2">
								<TextField.Root
									type="month"
									name="ym"
									defaultValue={currentSummary.ym}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const form = e.currentTarget.form;
										if (form) {
											// ページをリセット
											const pageInput = form.querySelector(
												'input[name="page"]',
											) as HTMLInputElement;
											if (pageInput) pageInput.value = "1";
											form.requestSubmit();
										}
									}}
									style={{ width: "140px", padding: "var(--space-1)" }}
									max={new Date().toISOString().slice(0, 7)}
								/>
								<input type="hidden" name="page" value="1" />
							</Flex>
						</fetcher.Form>

						{/* サマリー */}
						<SummaryStats
							totalAmount={currentSummary.totalAmount}
							perPayer={currentSummary.perPayer}
						/>

						{/* 詳細テーブル */}
						<Box>
							<Text
								size="4"
								weight="medium"
								style={{ marginBottom: "var(--space-3)", display: "block" }}
							>
								明細 ({currentPagination?.totalCount ?? 0} 件)
							</Text>

							{/* テーブル */}
							<ExpenseTable
								expenses={currentDetailExpenses ?? []}
								onEditExpense={(expense) => {
									setEditingExpense(expense);
									setIsEditDialogOpen(true);
								}}
							/>

							{/* ページング */}
							<PaginationControls
								currentPage={currentPagination?.currentPage ?? 1}
								totalPages={currentPagination?.totalPages ?? 1}
								currentMonth={currentSummary.ym}
								fetcher={fetcher}
							/>
						</Box>
					</Flex>
				</Container>
			</Box>

			{/* 編集ダイアログ */}
			{editingExpense && (
				<EditExpenseDialog
					expense={editingExpense}
					categories={currentCategories}
					tags={currentTags}
					members={currentMembers}
					isOpen={isEditDialogOpen}
					onClose={handleCloseEditDialog}
					fetcher={editFetcher}
				/>
			)}
		</Flex>
	);
}
