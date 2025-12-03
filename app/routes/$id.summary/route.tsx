import type { Route } from "./+types/route";
import { useLoaderData, useFetcher } from "react-router";
import { checkUser } from "~/lib/auth/session";
import { redirect } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import {
	householdsTable,
	householdUsersTable,
	expensesTable,
	incomesTable,
	usersTable,
	categoriesTable,
	tagsTable,
} from "server/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { Container, Flex, Text, TextField, Box } from "@radix-ui/themes";
import { HamburgerMenu } from "~/components/HamburgerMenu";
import { SummaryStats } from "~/components/SummaryStats";
import type React from "react";
import { SummaryTable } from "~/components/SummaryTable";

export const loader = async ({
	request,
	params,
	context,
}: Route.LoaderArgs) => {
	const url = new URL(request.url);
	const ymParam = url.searchParams.get("ym");

	const now = new Date();
	const defaultYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	const ym = ymParam ?? defaultYm;

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

	// 支出と収入の明細を取得
	const [expenses, incomes] = await Promise.all([
		db
			.select({
				id: expensesTable.id,
				amount: expensesTable.amount,
				note: expensesTable.note,
				date: expensesTable.paid_at,
				categoryName: categoriesTable.name,
				tagName: tagsTable.name,
				userName: usersTable.name,
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
			.orderBy(desc(expensesTable.paid_at), desc(expensesTable.id)),
		db
			.select({
				id: incomesTable.id,
				amount: incomesTable.amount,
				note: incomesTable.note,
				date: incomesTable.received_at,
				categoryName: categoriesTable.name,
				userName: usersTable.name,
			})
			.from(incomesTable)
			.innerJoin(
				categoriesTable,
				eq(incomesTable.category_id, categoriesTable.id),
			)
			.innerJoin(usersTable, eq(incomesTable.payee, usersTable.id))
			.where(
				and(
					eq(incomesTable.household_id, params.id),
					sql`${incomesTable.received_at} LIKE ${ymPrefix}`,
				),
			)
			.orderBy(desc(incomesTable.received_at), desc(incomesTable.id)),
	]);
	const detailExpenses = expenses.map((e) => ({
		id: e.id,
		amount: e.amount,
		note: e.note,
		date: e.date,
		categoryName: e.categoryName,
		tagName: e.tagName,
		userName: e.userName,
		isExpense: true,
	}));
	const detailIncomes = incomes.map((e) => ({
		id: e.id,
		amount: e.amount,
		note: e.note,
		date: e.date,
		categoryName: e.categoryName,
		userName: e.userName,
		isExpense: false,
	}));

	// 総支出を計算
	const expenseTotal = detailExpenses.reduce((sum, e) => sum + e.amount, 0);
	// ユーザー毎の総支出を計算
	const perPayerMap: Record<string, number> = {};
	for (const { userName, amount } of detailExpenses) {
		perPayerMap[userName] = (perPayerMap[userName] || 0) + amount;
	}
	const perPayer = members.map((m) => ({
		name: m.name,
		amount: perPayerMap[m.name] || 0,
	}));

	// 総収入を計算
	const incomeTotal = detailIncomes.reduce((sum, e) => sum + e.amount, 0);
	// ユーザー毎の総収入を計算
	const perPayeeMap: Record<string, number> = {};
	for (const { userName, amount } of detailIncomes) {
		perPayeeMap[userName] = (perPayeeMap[userName] || 0) + amount;
	}
	const perPayee = members.map((m) => ({
		name: m.name,
		amount: perPayeeMap[m.name] || 0,
	}));

	return {
		household,
		isOwner: userHousehold.owner,
		summary: { expenseTotal, incomeTotal, perPayer, perPayee, ym },
		detailExpenses,
		detailIncomes,
	};
};

export default function HouseholdSummaryPage() {
	const { household, isOwner, summary, detailExpenses, detailIncomes } =
		useLoaderData<typeof loader>();
	const fetcher = useFetcher<typeof loader>();
	const currentSummary = fetcher.data?.summary ?? summary;
	const currentDetailExpenses = fetcher.data?.detailExpenses ?? detailExpenses;
	const currentDetailIncomes = fetcher.data?.detailIncomes ?? detailIncomes;

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
										history.replaceState(
											null,
											"",
											`/${household.id}/summary?ym=${e.currentTarget.value}`,
										);
									}}
									style={{ width: "140px", padding: "var(--space-1)" }}
									max={new Date().toISOString().slice(0, 7)}
								/>
								<input type="hidden" name="page" value="1" />
							</Flex>
						</fetcher.Form>

						{/* サマリー */}
						<SummaryStats
							expenseTotal={currentSummary.expenseTotal}
							incomeTotal={currentSummary.incomeTotal}
							perPayer={currentSummary.perPayer}
							perPayee={currentSummary.perPayee}
						/>

						{/* 詳細テーブル */}
						<Box>
							<Text
								size="4"
								weight="medium"
								style={{ marginBottom: "var(--space-3)", display: "block" }}
							>
								明細 (
								{currentDetailExpenses?.length + currentDetailIncomes?.length}
								件)
							</Text>

							{/* テーブル */}
							<SummaryTable
								expenses={currentDetailExpenses ?? []}
								incomes={currentDetailIncomes ?? []}
								householdId={household.id}
							/>
						</Box>
					</Flex>
				</Container>
			</Box>
		</Flex>
	);
}
