import type { Route } from "./+types/route";
import {
	useLoaderData,
	useFetcher,
	useActionData,
	useLocation,
	useNavigate,
} from "react-router";
import { checkUser } from "~/lib/auth/session";
import { redirect } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import {
	expensesTable,
	incomesTable,
	categoriesTable,
	tagsTable,
	householdsTable,
	householdUsersTable,
	usersTable,
} from "server/db/schema";
import { eq, and } from "drizzle-orm";
import {
	Container,
	Flex,
	Text,
	TextField,
	Box,
	Button,
} from "@radix-ui/themes";
import { HamburgerMenu } from "~/components/HamburgerMenu";
import { parseWithValibot } from "@conform-to/valibot";
import { ExpenseFormSchema, IncomeFormSchema } from "~/lib/validation";
import { useForm } from "@conform-to/react";
import ExpenseForm from "~/components/ExpenseForm";
import { Form } from "react-router";
import IncomeForm from "~/components/IncomeForm";

export const loader = async ({
	request,
	params,
	context,
}: Route.LoaderArgs) => {
	const url = new URL(request.url);

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

	const item = await db
		.select()
		.from(incomesTable)
		.where(eq(incomesTable.id, params.item))
		.get();
	if (!item) throw new Response("Not Found", { status: 404 });

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
		categories,
		tags,
		members,
		item,
	};
};

export const action = async ({
	request,
	params,
	context,
}: Route.LoaderArgs) => {
	const user = await checkUser(context.hono.context);
	if (user.state !== "authenticated") {
		return redirect("/signin");
	}

	const formData = await request.formData();
	const submission = parseWithValibot(formData, { schema: IncomeFormSchema });
	if (submission.status !== "success") {
		return submission.reply();
	}

	const db = drizzle(context.cloudflare.env.DB);
	await db
		.update(incomesTable)
		.set({
			amount: submission.value.amount,
			category_id: String(submission.value.category),
			payee: submission.value.payee,
			received_at: submission.value.receivedAt,
		})
		.where(eq(incomesTable.id, params.item));

	const ym = submission.value.receivedAt.split("-").slice(0, 2).join("-");
	return redirect(`/${params.id}/summary?ym=${ym}`);
};

export default function HouseholdSummaryPage() {
	const { household, isOwner, categories, tags, members, item } =
		useLoaderData<typeof loader>();
	const fetcher = useFetcher<typeof loader>();
	const location = useLocation();
	const actionData = useActionData();
	const [form, fields] = useForm({
		defaultValue: {
			amount: item?.amount,
			category: item.category_id,
			payee: item.payee,
			receivedAt: item.received_at,
		},
		lastResult: actionData,
		shouldValidate: "onSubmit",
		shouldRevalidate: "onSubmit",
		onValidate({ formData }) {
			return parseWithValibot(formData, { schema: IncomeFormSchema });
		},
	});
	const navigate = useNavigate();

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
							{household.name} - 収入編集
						</Text>
					</Flex>

					<Button
						type="button"
						onClick={() => {
							navigate(
								`/${household.id}/summary?ym=${item.received_at.split("-").slice(0, 2).join("-")}`,
							);
						}}
					>
						サマリーに戻る
					</Button>
					<Flex direction="column" p="4" gap="3">
						<Form
							method="post"
							id={form.id}
							onSubmit={form.onSubmit}
							noValidate
							style={{ display: "contents" }}
						>
							<IncomeForm
								key={location.key}
								categories={categories}
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
