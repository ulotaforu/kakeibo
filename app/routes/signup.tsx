import {
	Button,
	Container,
	Flex,
	Grid,
	Heading,
	Text,
	TextField,
} from "@radix-ui/themes";
import { signIn, signOut } from "@hono/auth-js/react";
import type { Route } from "./+types/signup";
import { checkUser } from "~/lib/auth/session";
import { Form, redirect, useActionData } from "react-router";
import type React from "react";
import { SignUpMessages, SignUpSchema } from "~/lib/validation";
import { useState } from "react";
import { parse } from "valibot";

export const action = async ({ request }: { request: Request }) => {
	const formData = await request.formData();
	const data = Object.fromEntries(formData.entries());
	try {
		const result = parse(SignUpSchema, data);
		console.log(result);
		console.log(data);
		// TODO: DBにユーザーを登録する
		return { sucess: true };
	} catch (error) {
		const errors: Record<string, string> = {};
		for (const [field, issues] of Object.entries(error.issues)) {
			errors[field] = issues[0].message;
		}
		return { sucess: false, errors, values: data };
	}
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
	const actionData = useActionData();
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { email } = loaderData;

	const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
		const form = e.currentTarget;
		const formData = new FormData(form);
		const name = (formData.get("name") || "").toString().trim();
		const email = (formData.get("email") || "").toString().trim();
		const errors: Record<string, string> = {};
		if (name.length < 1) {
			errors.name = SignUpMessages.name;
		}
		if (email.length === 0) {
			errors.email = SignUpMessages.email.empty;
		}
		if (Object.keys(errors).length > 0) {
			e.preventDefault();
			setErrors(errors);
		}
	};

	return (
		<Container size={"3"} pt={"4"}>
			<Heading size={"4"} align={"center"}>
				ユーザー登録
			</Heading>
			<Flex align={"center"} justify={"center"} direction={"column"}>
				<Grid gap={"1"}>
					<Form method="post" onSubmit={submitHandler}>
						<Text>サインイン中のメールアドレス</Text>
						<TextField.Root
							variant="surface"
							name="email"
							value={email}
							readOnly
						/>
						{errors.email && <Text color="red">{errors.email}</Text>}
						{actionData?.error?.email && (
							<Text color="red">{actionData.error.email}</Text>
						)}
						<br />
						<Text>あなたの名前を教えてください</Text>
						<TextField.Root variant="surface" name="name" />
						{errors.name && <Text color="red">{errors.name}</Text>}
						{actionData?.error?.name && (
							<Text color="red">{actionData.error.name}</Text>
						)}
						<Button variant="surface" type="submit">
							送信
						</Button>
						<Button
							variant="surface"
							onClick={() => signOut({ callbackUrl: "/" })}
						>
							登録をやめる
						</Button>
					</Form>
				</Grid>
			</Flex>
		</Container>
	);
}
