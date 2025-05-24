import {
	Button,
	Container,
	Flex,
	Heading,
	Text,
	TextField,
} from "@radix-ui/themes";
import { signOut } from "@hono/auth-js/react";
import type { Route } from "./+types/signup";
import { checkUser } from "~/lib/auth/session";
import { Form, redirect, useActionData } from "react-router";
import { SignUpSchema } from "~/lib/validation";
import { useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { drizzle } from "drizzle-orm/d1";
import { usersTable } from "server/db/schema";

export const action = async ({ request, context }: Route.ActionArgs) => {
	const formData = await request.formData();
	const submission = parseWithValibot(formData, { schema: SignUpSchema });
	if (submission.status !== "success") {
		return submission.reply();
	}
	const db = drizzle(context.cloudflare.env.DB);
	// ユーザー登録
	await db.insert(usersTable).values({
		email: submission.value.email,
		name: submission.value.name,
	});
	return redirect("/home");
};

export const loader = async ({ context }: Route.LoaderArgs) => {
	const user = await checkUser(context.hono.context);
	if (user.state === "unauthorized") {
		return redirect("/");
	}
	if (user.state === "authenticated") {
		return redirect("/home");
	}
	return { email: user.email };
};

export default function Index({ loaderData }: Route.ComponentProps) {
	const lastResult = useActionData();
	const { email } = loaderData;
	const [form, fields] = useForm({
		lastResult,
		shouldValidate: "onSubmit",
		shouldRevalidate: "onSubmit",
		onValidate({ formData }) {
			return parseWithValibot(formData, { schema: SignUpSchema });
		},
	});

	return (
		<Container size={"3"} pt={"4"}>
			<Heading size={"4"} align={"center"}>
				Sign Up
			</Heading>
			<Form method="post" id={form.id} onSubmit={form.onSubmit} noValidate>
				<Flex
					direction="column"
					gap="4"
					style={{ maxWidth: "200px", width: "100%", margin: "0 auto" }}
				>
					<Flex direction="column" gap="1" mt="2">
						<Text as="label" size="2" weight="bold">
							サインイン中のメールアドレス
						</Text>
						<TextField.Root
							variant="surface"
							key={fields.email.key}
							name={fields.email.name}
							value={email}
							readOnly
						/>
						{fields.email.errors && (
							<Text size="1" color="red">
								{fields.email.errors}
							</Text>
						)}
					</Flex>
					<Flex direction="column" gap="1">
						<Text as="label" size="2" weight="bold">
							あなたの名前を教えてください
						</Text>
						<TextField.Root
							variant="surface"
							name={fields.name.name}
							key={fields.name.key}
						/>
						{fields.name.errors && (
							<Text size="1" color="red">
								{fields.name.errors}
							</Text>
						)}
					</Flex>
					<Flex direction="column" gap="2">
						<Button variant="surface" type="submit">
							登録
						</Button>
						<Button
							variant="soft"
							onClick={(e) => {
								e.preventDefault();
								signOut({ callbackUrl: "/" });
							}}
						>
							登録をやめる
						</Button>
					</Flex>
				</Flex>
			</Form>
		</Container>
	);
}
