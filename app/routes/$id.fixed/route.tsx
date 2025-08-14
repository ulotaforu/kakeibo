import type { Route } from "./+types/route";
import {
	Link,
	useLoaderData,
} from "react-router";
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
	Flex,
	Text,
} from "@radix-ui/themes";
import FixedExpenseSection from "app/components/FixedExpenseSection";

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
			categoryId: expensesTable.category_id,
		})
		.from(expensesTable)
		.where(
			and(
				eq(expensesTable.household_id, params.id),
				sql`${expensesTable.paid_at} LIKE ${ymPrefix}`,
			),
		);

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
		categories,
		tags,
		members,
		fixedList,
	};
};

export default function HouseholdFixedPage() {
	const { household, categories, tags, members, fixedList } = useLoaderData<typeof loader>();

	return (
		<Container size="3" pt="4" style={{ maxWidth: "100%" }}>
			<Flex
				justify="center"
				align="center"
				mb="4"
				style={{ position: "relative" }}
			>
				<Button
					asChild
					variant="ghost"
					style={{ position: "absolute", left: 0 }}
				>
					<Link to={`/${household.id}`}>戻る</Link>
				</Button>
				<Text size="6" weight="bold">
					{household.name} - 固定費管理
				</Text>
			</Flex>

			<Flex direction="column" p="4">
				<FixedExpenseSection
					fixedList={fixedList}
					categories={categories}
					tags={tags}
					members={members}
				/>
			</Flex>
		</Container>
	);
}