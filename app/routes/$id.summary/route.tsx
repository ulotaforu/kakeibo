import type { Route } from "./+types/route";
import { Link, useLoaderData, useFetcher } from "react-router";
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
	Button,
	Container,
	Flex,
	Text,
	TextField,
	Box,
	Table,
	IconButton,
} from "@radix-ui/themes";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { HamburgerMenu } from "~/components/HamburgerMenu";
import type React from "react";

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
	};
};

export default function HouseholdSummaryPage() {
	const { household, isOwner, summary, detailExpenses, pagination } =
		useLoaderData<typeof loader>();
	const fetcher = useFetcher<typeof loader>();
	const currentSummary = fetcher.data?.summary ?? summary;
	const currentDetailExpenses = fetcher.data?.detailExpenses ?? detailExpenses;
	const currentPagination = fetcher.data?.pagination ?? pagination;

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
						<Box>
							<Text
								size="5"
								weight="medium"
								style={{ marginBottom: "var(--space-2)", display: "block" }}
							>
								合計: {currentSummary.totalAmount.toLocaleString()} 円
							</Text>
							<Flex direction="column" gap="1">
								{currentSummary.perPayer.map((p) => (
									<Text key={p.name} size="3">
										{p.name}: {p.amount.toLocaleString()} 円
									</Text>
								))}
							</Flex>
						</Box>

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
							<Box style={{ overflowX: "auto" }}>
								<Table.Root variant="surface">
									<Table.Header>
										<Table.Row>
											<Table.ColumnHeaderCell>日付</Table.ColumnHeaderCell>
											<Table.ColumnHeaderCell>金額</Table.ColumnHeaderCell>
											<Table.ColumnHeaderCell>カテゴリ</Table.ColumnHeaderCell>
											<Table.ColumnHeaderCell>タグ</Table.ColumnHeaderCell>
											<Table.ColumnHeaderCell>支払者</Table.ColumnHeaderCell>
											<Table.ColumnHeaderCell>メモ</Table.ColumnHeaderCell>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{(currentDetailExpenses ?? []).map((expense) => (
											<Table.Row key={expense.id}>
												<Table.Cell>
													<Text size="2">
														{new Date(expense.paid_at).toLocaleDateString(
															"ja-JP",
															{
																month: "numeric",
																day: "numeric",
															},
														)}
													</Text>
												</Table.Cell>
												<Table.Cell>
													<Text size="2" weight="medium">
														¥{expense.amount.toLocaleString()}
													</Text>
												</Table.Cell>
												<Table.Cell>
													<Text size="2">{expense.categoryName}</Text>
												</Table.Cell>
												<Table.Cell>
													<Text size="2">{expense.tagName || "-"}</Text>
												</Table.Cell>
												<Table.Cell>
													<Text size="2">{expense.payerName}</Text>
												</Table.Cell>
												<Table.Cell>
													<Text
														size="2"
														style={{
															maxWidth: "150px",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{expense.note || "-"}
													</Text>
												</Table.Cell>
											</Table.Row>
										))}
									</Table.Body>
								</Table.Root>
							</Box>

							{/* ページング */}
							<Flex
								justify="center"
								align="center"
								gap="2"
								style={{ marginTop: "var(--space-4)" }}
							>
								<fetcher.Form method="get" style={{ display: "contents" }}>
									<input type="hidden" name="ym" value={currentSummary.ym} />
									<input
										type="hidden"
										name="page"
										value={String(
											Math.max(1, (currentPagination?.currentPage ?? 1) - 1),
										)}
									/>
									<IconButton
										type="submit"
										variant="soft"
										disabled={(currentPagination?.currentPage ?? 1) <= 1}
									>
										<ChevronLeftIcon />
									</IconButton>
								</fetcher.Form>

								<Text size="2">
									{currentPagination?.currentPage ?? 1} /{" "}
									{currentPagination?.totalPages ?? 1}
								</Text>

								<fetcher.Form method="get" style={{ display: "contents" }}>
									<input type="hidden" name="ym" value={currentSummary.ym} />
									<input
										type="hidden"
										name="page"
										value={String(
											Math.min(
												currentPagination?.totalPages ?? 1,
												(currentPagination?.currentPage ?? 1) + 1,
											),
										)}
									/>
									<IconButton
										type="submit"
										variant="soft"
										disabled={
											(currentPagination?.currentPage ?? 1) >=
											(currentPagination?.totalPages ?? 1)
										}
									>
										<ChevronRightIcon />
									</IconButton>
								</fetcher.Form>
							</Flex>
						</Box>
					</Flex>
				</Container>
			</Box>
		</Flex>
	);
}
