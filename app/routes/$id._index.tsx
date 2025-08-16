import type { Route } from "./+types/_index";
import { useLoaderData, useFetcher } from "react-router";
import { useEffect, useState } from "react";
import { checkUser } from "~/lib/auth/session";
import { redirect } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import {
	householdsTable,
	householdUsersTable,
	householdInvitationsTable,
	expensesTable,
	incomesTable,
} from "server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
	Button,
	Container,
	Dialog,
	Flex,
	Text,
	TextField,
	Box,
} from "@radix-ui/themes";
import { useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { InviteFormSchema } from "app/lib/validation";
import { HamburgerMenu } from "~/components/HamburgerMenu";
import { MonthlySummary } from "~/components/MonthlySummary";

export const loader = async ({ params, context }: Route.LoaderArgs) => {
	const user = await checkUser(context.hono.context);
	if (user.state !== "authenticated") {
		return redirect("/signin");
	}

	if (!params.id) {
		throw new Response("Not Found", { status: 404 });
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

	// 今月のサマリー
	const now = new Date();
	const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	const ymPrefix = `${currentYm}%`;

	const expenses = await db
		.select({ amount: expensesTable.amount })
		.from(expensesTable)
		.where(
			and(
				eq(expensesTable.household_id, params.id),
				sql`${expensesTable.paid_at} LIKE ${ymPrefix}`,
			),
		);

	const incomes = await db
		.select({ amount: incomesTable.amount })
		.from(incomesTable)
		.where(
			and(
				eq(incomesTable.household_id, params.id),
				sql`${incomesTable.received_at} LIKE ${ymPrefix}`,
			),
		);

	const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
	const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

	return {
		household,
		isOwner: userHousehold.owner,
		totalExpenses,
		totalIncome,
		currentMonth: `${now.getFullYear()}年${now.getMonth() + 1}月`,
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

	if (!params.id) {
		throw new Response("Not Found", { status: 404 });
	}

	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "invite") {
		const inviteSubmission = parseWithValibot(formData, {
			schema: InviteFormSchema,
		});
		if (inviteSubmission.status !== "success") {
			return inviteSubmission.reply();
		}
		const { invitee_email: email } = inviteSubmission.value;
		const db = drizzle(context.cloudflare.env.DB);
		await db.insert(householdInvitationsTable).values({
			household_id: params.id,
			inviter_id: user.userId,
			invitee_email: email,
			token: crypto.randomUUID(),
		});
		return redirect(`/${params.id}`);
	}

	return null;
};

export default function HouseholdDashboard() {
	const { household, isOwner, totalExpenses, totalIncome, currentMonth } =
		useLoaderData<typeof loader>();
	const inviteFetcher = useFetcher<typeof action>();
	const [inviteForm, inviteFields] = useForm({
		lastResult: inviteFetcher.data,
		shouldValidate: "onSubmit",
		shouldRevalidate: "onSubmit",
		onValidate({ formData }) {
			return parseWithValibot(formData, { schema: InviteFormSchema });
		},
	});

	const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

	// ページタイトルを家計簿名に設定
	useEffect(() => {
		document.title = `${household.name} - Kakeibo`;
	}, [household.name]);

	return (
		<Flex style={{ minHeight: "100vh", backgroundColor: "#F8F6F1" }}>
			{/* サイドバー（ハンバーガーメニュー） */}
			<Box style={{ position: "fixed", left: 0, top: 0, zIndex: 10 }}>
				<HamburgerMenu
					householdId={household.id}
					isOwner={isOwner}
					onInviteClick={() => setIsInviteDialogOpen(true)}
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
				{/* ヘッダー */}
				<Flex
					justify="center"
					align="center"
					mb="4"
				>
					<Text size="6" weight="bold">
						{household.name}
					</Text>
				</Flex>

				{/* 月次サマリー */}
				<Container size="3" style={{ maxWidth: "100%" }}>
					<MonthlySummary
						totalExpenses={totalExpenses}
						totalIncome={totalIncome}
						currentMonth={currentMonth}
					/>
				</Container>

				{/* 招待ダイアログ */}
				<Dialog.Root open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
					<Dialog.Content style={{ padding: "var(--space-4)" }}>
						<Dialog.Title mb="3">メールで招待</Dialog.Title>
						<inviteFetcher.Form
							onSubmit={inviteForm.onSubmit}
							method="post"
							style={{ width: "100%" }}
						>
							<input type="hidden" name="intent" value="invite" />
							<TextField.Root
								variant="surface"
								placeholder="email@example.com"
								name={inviteFields.invitee_email.name}
								key={inviteFields.invitee_email.key}
								style={{ width: "100%" }}
							/>
							{inviteFields.invitee_email.errors && (
								<Text color="red" size="1">
									{inviteFields.invitee_email.errors}
								</Text>
							)}
							<Flex mt="4" justify="end" gap="2">
								<Dialog.Close>
									<Button variant="soft" type="button">
										キャンセル
									</Button>
								</Dialog.Close>
								<Button variant="solid" type="submit">
									送信
								</Button>
							</Flex>
						</inviteFetcher.Form>
					</Dialog.Content>
				</Dialog.Root>
			</Box>
		</Flex>
	);
}
