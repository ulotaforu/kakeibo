import type { Route } from "./+types/route";
import {
	useLoaderData,
	Form,
	useActionData,
	useLocation,
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
} from "server/db/schema";
import { eq, and } from "drizzle-orm";
import {
	Container,
	Flex,
	Text,
	Box,
} from "@radix-ui/themes";
import ExpenseForm from "app/components/ExpenseForm";
import { HamburgerMenu } from "~/components/HamburgerMenu";
import { useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { ExpenseFormSchema } from "app/lib/validation";

export const loader = async ({
	request,
	params,
	context,
}: Route.LoaderArgs) => {
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

	return {
		household,
		isOwner: userHousehold.owner,
		categories: categories.filter(c => c.is_expense),
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

	return redirect(`/${params.id}/expenses`);
};

export default function HouseholdExpensesPage() {
	const location = useLocation();
	const { household, isOwner, categories, tags, members } = useLoaderData<typeof loader>();
	const actionData = useActionData();
	const [form, fields] = useForm({
		lastResult: actionData,
		shouldValidate: "onSubmit",
		shouldRevalidate: "onSubmit",
		onValidate({ formData }) {
			return parseWithValibot(formData, { schema: ExpenseFormSchema });
		},
	});

	return (
		<Flex style={{ minHeight: "100vh", backgroundColor: "#F8F6F1" }}>
			{/* サイドバー（ハンバーガーメニュー） */}
			<Box style={{ position: "fixed", left: 0, top: 0, zIndex: 10 }}>
				<HamburgerMenu
					householdId={household.id}
					isOwner={isOwner}
				/>
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
							{household.name} - 支出登録
						</Text>
					</Flex>

					<Flex direction="column" p="4" gap="3">
						<Form
							method="post"
							id={form.id}
							onSubmit={form.onSubmit}
							noValidate
							style={{ display: "contents" }}
						>
							<ExpenseForm
								key={location.key}
								categories={categories}
								tags={tags}
								members={members}
								fields={fields}
							/>
						</Form>
					</Flex>
				</Container>
			</Box>
		</Flex>
	);
}