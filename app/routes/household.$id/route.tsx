import type { Route } from "./+types/route";
import { Link, useLoaderData, Form, useActionData, useFetcher } from "react-router";
import { checkUser } from "~/lib/auth/session";
import { redirect } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import {
	householdsTable,
	householdUsersTable,
	categoriesTable,
	tagsTable,
	usersTable,
	expensesTable,
	fixedExpensesTable,
} from "server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
	Button,
	Container,
	Dialog,
	Flex,
	Text,
	TextField,
	Tabs,
} from "@radix-ui/themes";
import ExpenseForm from "app/components/ExpenseForm";
import IncomeForm from "app/components/IncomeForm";
import FixedExpenseSection from "app/components/FixedExpenseSection";
import type React from "react";
import { useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { ExpenseFormSchema } from "app/lib/validation";

export const loader = async ({
	request,
	params,
	context,
}: Route.LoaderArgs) => {
	const url = new URL(request.url);
	const ymParam = url.searchParams.get("ym");

	// デフォルトは当日年月
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

	const categories = await db
		.select({
			id: categoriesTable.id,
			name: categoriesTable.name,
			is_expense: categoriesTable.is_expense,
		})
		.from(categoriesTable)
		.where(eq(categoriesTable.household_id, params.id));

	const tags = await db
		.select({ id: tagsTable.id, name: tagsTable.name })
		.from(tagsTable)
		.where(eq(tagsTable.household_id, params.id));

	const members = await db
		.select({ id: usersTable.id, name: usersTable.name })
		.from(householdUsersTable)
		.innerJoin(usersTable, eq(householdUsersTable.user_id, usersTable.id))
		.where(eq(householdUsersTable.household_id, params.id));

	const ymPrefix = `${ym}%`;

	const expenses = await db
		.select({
			amount: expensesTable.amount,
			payer: expensesTable.payer,
			categoryId: expensesTable.category_id,
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

	// 固定費取得
	const fixedExpenses = await db
		.select({
			id: fixedExpensesTable.id,
			amount: fixedExpensesTable.amount,
			note: fixedExpensesTable.note,
			categoryId: fixedExpensesTable.category_id,
			tagId: fixedExpensesTable.tag_id,
			payerId: fixedExpensesTable.payer,
			categoryName: categoriesTable.name,
			tagName: tagsTable.name,
			payerName: usersTable.name,
		})
		.from(fixedExpensesTable)
		.innerJoin(
			categoriesTable,
			eq(fixedExpensesTable.category_id, categoriesTable.id),
		)
		.innerJoin(tagsTable, eq(fixedExpensesTable.tag_id, tagsTable.id))
		.innerJoin(usersTable, eq(fixedExpensesTable.payer, usersTable.id))
		.where(eq(fixedExpensesTable.household_id, params.id));

	const paidCategoryIds = new Set(expenses.map((e) => e.categoryId));

	const fixedList = fixedExpenses.map((f) => ({
		...f,
		paid: paidCategoryIds.has(f.categoryId),
	}));

	return {
		household,
		isOwner: userHousehold?.owner ?? false,
		categories,
		tags,
		members,
		summary: { totalAmount, perPayer, ym },
		fixedList,
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
	const submission = parseWithValibot(formData, { schema: ExpenseFormSchema });

	if (submission.status !== "success") {
		return submission.reply();
	}

	const { amount, category, tags, note, payer, paidAt } = submission.value;

	const tagId = String(tags).split(",").filter(Boolean)[0] ?? "";
	const categoryId = String(category);

	const db = drizzle(context.cloudflare.env.DB);
	await db.insert(expensesTable).values({
		amount,
		household_id: params.id,
		category_id: categoryId,
		tag_id: tagId,
		note,
		payer,
		paid_at: paidAt,
	});

	return redirect(`/household/${params.id}`);
};

export default function HouseholdPage() {
	const { household, isOwner, categories, tags, members, summary, fixedList } =
		useLoaderData<typeof loader>();
	const actionData = useActionData();
	const [form, fields] = useForm({
		lastResult: actionData,
		shouldValidate: "onSubmit",
		shouldRevalidate: "onSubmit",
		onValidate({ formData }) {
			return parseWithValibot(formData, { schema: ExpenseFormSchema });
		},
	});

	const fetcher = useFetcher<typeof loader>();
	const currentSummary = fetcher.data?.summary ?? summary;

	return (
		<Container size="3" pt="4" style={{ maxWidth: "100%" }}>
			<Flex justify="between" align="center" mb="4">
				<Button asChild variant="ghost">
					<Link to="/home">戻る</Link>
				</Button>
				<Text size="6" weight="bold">
					{household.name}
				</Text>
				{isOwner && (
					<Dialog.Root>
						<Dialog.Trigger>
							<Button variant="surface">メンバー招待</Button>
						</Dialog.Trigger>
						<Dialog.Content style={{ padding: "var(--space-4)" }}>
							<Dialog.Title mb="3">メールで招待</Dialog.Title>
							<TextField.Root
								placeholder="email@example.com"
								style={{ width: "100%" }}
							/>
							<Flex mt="4" justify="end" gap="2">
								<Dialog.Close>
									<Button variant="soft">キャンセル</Button>
								</Dialog.Close>
								<Button variant="solid">送信</Button>
							</Flex>
						</Dialog.Content>
					</Dialog.Root>
				)}
			</Flex>

			<Tabs.Root defaultValue="expense" style={{ width: "100%" }}>
				<Tabs.List mb="3">
					<Tabs.Trigger value="summary">サマリー</Tabs.Trigger>
					<Tabs.Trigger value="expense">支出登録</Tabs.Trigger>
					<Tabs.Trigger value="income">収入登録</Tabs.Trigger>
					<Tabs.Trigger value="fixed">固定費管理</Tabs.Trigger>
				</Tabs.List>

				{/* サマリー */}
				<Tabs.Content value="summary">
					<Flex direction="column" p="4" gap="2">
						<fetcher.Form method="get" style={{ marginBottom: "var(--space-2)" }}>
							<Flex align="center" gap="2">
								<TextField.Root
									type="month"
									name="ym"
									defaultValue={currentSummary.ym}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										e.currentTarget.form?.requestSubmit()}
									style={{ width: "140px", padding: "var(--space-1)" }}
									max={new Date().toISOString().slice(0, 7)}
								/>
							</Flex>
						</fetcher.Form>
						<Text size="5" weight="medium">
							合計: {currentSummary.totalAmount.toLocaleString()} 円
						</Text>
						<Flex direction="column" gap="1">
							{currentSummary.perPayer.map((p) => (
								<Text key={p.name} size="3">
									{p.name}: {p.amount.toLocaleString()} 円
								</Text>
							))}
						</Flex>
					</Flex>
				</Tabs.Content>

				{/* 支出登録 */}
				<Tabs.Content value="expense">
					<Flex direction="column" p="4" gap="3">
						<Form
							method="post"
							id={form.id}
							onSubmit={form.onSubmit}
							noValidate
							style={{ display: "contents" }}
						>
							<ExpenseForm
								categories={categories}
								tags={tags}
								members={members}
								fields={fields}
							/>
						</Form>
					</Flex>
				</Tabs.Content>

				{/* 収入登録 */}
				<Tabs.Content value="income">
					<Flex direction="column" p="4">
						<IncomeForm categories={categories} members={members} />
					</Flex>
				</Tabs.Content>

				{/* 固定費管理 */}
				<Tabs.Content value="fixed">
					<Flex direction="column" p="4">
						<FixedExpenseSection
							fixedList={fixedList}
							categories={categories}
							tags={tags}
							members={members}
						/>
					</Flex>
				</Tabs.Content>
			</Tabs.Root>
		</Container>
	);
}
