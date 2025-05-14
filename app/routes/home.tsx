import { Container } from "@radix-ui/themes";
import { checkUser } from "~/lib/auth/session";
import { redirect } from "react-router";
import type { Route } from "./+types/home";

export const loader = async ({ context }: Route.LoaderArgs) => {
	const user = await checkUser(context.hono.context);
	if (user.state !== "authenticated") {
		return redirect("/signup");
	}
	return { name: user.name };
};

export default function Index({ loaderData }: Route.ComponentProps) {
	return (
		<Container size={"3"} pt={"4"}>
			<h1>home</h1>
		</Container>
	);
}
