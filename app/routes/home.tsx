import {
	Box,
	Button,
	Card,
	Container,
	Dialog,
	Flex,
	Grid,
	IconButton,
	Text,
	TextField,
} from "@radix-ui/themes";
import InvitationNotification from "~/components/InvitationNotification";
import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";
import { checkUser } from "~/lib/auth/session";
import { Form, redirect, useActionData, Link } from "react-router";
import type { Route } from "./+types/home";
import { drizzle } from "drizzle-orm/d1";
import {
	householdsTable,
	householdUsersTable,
	categoriesTable,
	tagsTable,
	usersTable,
	householdInvitationsTable,
} from "server/db/schema";
import { useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { NewHouseholdSchema } from "~/lib/validation";
import { eq, and } from "drizzle-orm";

export const action = async ({ request, context }: Route.ActionArgs) => {
	const formData = await request.formData();
	const intent = formData.get("intent");
	if (intent === "accept" || intent === "decline") {
		const invitationId = String(formData.get("invitation_id"));
		if (!invitationId) return redirect("/home");
		const db = drizzle(context.cloudflare.env.DB);
		if (intent === "accept") {
			// update invitation status
			let householdIdToRedirect: string | undefined;
			const [inv] = await db
				.update(householdInvitationsTable)
				.set({ status: 1, responded_at: new Date().toISOString() })
				.where(eq(householdInvitationsTable.id, invitationId))
				.returning();

			if (inv) {
				householdIdToRedirect = inv.household_id;
				await db.insert(householdUsersTable).values({
					household_id: inv.household_id,
					user_id:
						inv.invitee_id ??
						(await (async () => {
							const user = await checkUser(context.hono.context);
							if (user.state !== "authenticated")
								throw new Error("unauthenticated");
							return user.userId;
						})()),
					owner: false,
				});
			}
			if (householdIdToRedirect) {
				return redirect(`/household/${householdIdToRedirect}`);
			}
		} else {
			await db
				.update(householdInvitationsTable)
				.set({ status: 2, responded_at: new Date().toISOString() })
				.where(eq(householdInvitationsTable.id, invitationId));
		}
		return redirect("/home");
	}

	// household creation

	// moved above
	const submission = parseWithValibot(formData, { schema: NewHouseholdSchema });
	if (submission.status !== "success") {
		return submission.reply();
	}
	const db = drizzle(context.cloudflare.env.DB);
	const [household] = await db
		.insert(householdsTable)
		.values({
			name: submission.value.name,
		})
		.returning();
	const householdId = household.id;

	// デフォルトカテゴリを挿入
	const defaultCategories = [
		// 支出
		"食費",
		"外食",
		"日用品",
		"交通費",
		"住居費",
		"電気",
		"ガス",
		"水道",
		"通信",
		"医療",
		"保険",
		"教育",
		"娯楽",
		"衣服",
		"美容",
		"交際費",
		"税金",
		"旅行",
		"その他",
	]
		.map((name) => ({ name, household_id: householdId, is_expense: true }))
		.concat(
			["給与", "賞与", "副収入", "その他"].map((name) => ({
				name,
				household_id: householdId,
				is_expense: false,
			})),
		);

	await db.insert(categoriesTable).values(defaultCategories);

	// デフォルトタグを挿入
	const defaultTags = ["必要", "不必要"].map((name) => ({
		name,
		household_id: householdId,
	}));
	await db.insert(tagsTable).values(defaultTags);

	const user = await checkUser(context.hono.context);
	if (user.state !== "authenticated") {
		return redirect("/signup");
	}
	await db.insert(householdUsersTable).values({
		user_id: user.userId,
		household_id: householdId,
		owner: true,
	});
	return redirect(`/household/${householdId}`);
};

export const loader = async ({ context }: Route.LoaderArgs) => {
	const user = await checkUser(context.hono.context);
	if (user.state !== "authenticated") {
		return redirect("/signup");
	}

	const db = drizzle(context.cloudflare.env.DB);
	const households = await db
		.select({
			id: householdsTable.id,
			name: householdsTable.name,
		})
		.from(householdUsersTable)
		.innerJoin(
			householdsTable,
			eq(householdUsersTable.household_id, householdsTable.id),
		)
		.where(eq(householdUsersTable.user_id, user.userId));
	const invitations = await db
		.select({
			id: householdInvitationsTable.id,
			inviterName: usersTable.name,
			householdName: householdsTable.name,
		})
		.from(householdInvitationsTable)
		.innerJoin(
			usersTable,
			eq(householdInvitationsTable.inviter_id, usersTable.id),
		)
		.innerJoin(
			householdsTable,
			eq(householdInvitationsTable.household_id, householdsTable.id),
		)
		.where(
			and(
				eq(householdInvitationsTable.invitee_email, user.email),
				eq(householdInvitationsTable.status, 0),
			),
		);
	return { name: user.name, households, invitations };
};

export default function Index({ loaderData }: Route.ComponentProps) {
	const { name, households, invitations } = loaderData;
	const lastResult = useActionData();
	const [form, fields] = useForm({
		lastResult,
		shouldValidate: "onSubmit",
		shouldRevalidate: "onSubmit",
		onValidate({ formData }) {
			return parseWithValibot(formData, { schema: NewHouseholdSchema });
		},
	});
	return (
		<Container
			size={"3"}
			pt={"4"}
			style={{ maxWidth: "100%", overflow: "hidden" }}
		>
			<Flex align="center" justify="between" mb="3">
				<h1>home</h1>
				<InvitationNotification invitations={invitations} />
			</Flex>
			<h2>Welcome {name}</h2>
			<Grid
				columns={{ initial: "1", sm: "2", md: "3" }}
				gap="3"
				width="100%"
				style={{
					maxWidth: "1200px",
					margin: "0 auto",
					padding: "0 1rem",
					boxSizing: "border-box",
				}}
			>
				{households.map((household) => (
					<Link
						to={`/${household.id}`}
						key={household.id}
						style={{
							textDecoration: "none",
							color: "inherit",
						}}
					>
						<Box style={{ height: "100%" }}>
							<Card
								style={{
									height: "100%",
									display: "flex",
									flexDirection: "column",
									gap: "1rem",
									textDecoration: "none",
									alignItems: "center",
									justifyContent: "center",
									cursor: "pointer",
									transition: "all 0.2s ease",
									borderRadius: "8px",
									minHeight: "100px",
								}}
								onMouseOver={(e) => {
									e.currentTarget.style.backgroundColor = "var(--gray-2)";
									e.currentTarget.style.color = "var(--gray-12)";
								}}
								onMouseOut={(e) => {
									e.currentTarget.style.backgroundColor = "";
									e.currentTarget.style.color = "";
								}}
							>
								<Text size="4" weight="bold">
									{household.name}
								</Text>
							</Card>
						</Box>
					</Link>
				))}
				<Dialog.Root>
					<Dialog.Trigger>
						<Box style={{ height: "100%" }}>
							<Card
								style={{
									height: "100%",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									cursor: "pointer",
									transition: "all 0.2s ease",
									border: "2px dashed var(--accent-6)",
									borderRadius: "8px",
									minHeight: "100px",
									backgroundColor: "var(--accent-3)",
									color: "var(--accent-11)",
								}}
								onMouseOver={(e) => {
									e.currentTarget.style.borderColor = "var(--accent-8)";
								}}
								onMouseOut={(e) => {
									e.currentTarget.style.borderColor = "var(--accent-6)";
								}}
							>
								<Flex direction="column" align="center" gap="2">
									<PlusIcon width={24} height={24} />
									<Text size="3" weight="medium">
										新しい家計簿を追加
									</Text>
								</Flex>
							</Card>
						</Box>
					</Dialog.Trigger>
					<Dialog.Content
						style={{ position: "relative", padding: "var(--space-4)" }}
					>
						<Dialog.Close>
							<IconButton
								variant="ghost"
								size="1"
								style={{
									position: "absolute",
									top: "var(--space-3)",
									right: "var(--space-3)",
								}}
							>
								<Cross2Icon width="16" height="16" />
							</IconButton>
						</Dialog.Close>

						<Dialog.Title style={{ marginBottom: "var(--space-3)" }}>
							家計簿の名前は？
						</Dialog.Title>

						<Form
							method="post"
							id={form.id}
							onSubmit={form.onSubmit}
							noValidate
						>
							<Flex direction="column" gap="3">
								<TextField.Root
									variant="surface"
									name={fields.name.name}
									key={fields.name.key}
									placeholder="家計簿の名前を入力"
									autoFocus
								/>
								{fields.name.errors && (
									<Text size="1" color="red">
										{fields.name.errors}
									</Text>
								)}
								<Button variant="surface" type="submit">
									登録
								</Button>
							</Flex>
						</Form>
					</Dialog.Content>
				</Dialog.Root>
			</Grid>
		</Container>
	);
}
