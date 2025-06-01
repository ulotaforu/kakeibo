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
import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";
import { checkUser } from "~/lib/auth/session";
import { Form, redirect, useActionData, Link } from "react-router";
import type { Route } from "./+types/home";
import { drizzle } from "drizzle-orm/d1";
import { householdsTable, householdUsersTable } from "server/db/schema";
import { useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { NewHouseholdSchema } from "~/lib/validation";
import { eq } from "drizzle-orm";

export const action = async ({ request, context }: Route.ActionArgs) => {
	const formData = await request.formData();
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
	return { name: user.name, households };
};

export default function Index({ loaderData }: Route.ComponentProps) {
	const { name, households } = loaderData;
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
			<h1>home</h1>
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
						key={household.id}
						to={`/household/${household.id}`}
						style={{ textDecoration: "none" }}
					>
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
									border: "2px dashed var(--gray-6)",
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
