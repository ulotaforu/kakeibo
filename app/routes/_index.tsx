import type { Route } from "./+types/_index";
import { Button, Container, Flex, Heading } from "@radix-ui/themes";
import { signIn } from "@hono/auth-js/react";

export const loader = (args: Route.LoaderArgs) => {
	const extra = args.context.extra;
	const cloudflare = args.context.cloudflare;
	const myVarInVariables = args.context.hono.context.get("MY_VAR_IN_VARIABLES");
	const isWaitUntilDefined = !!cloudflare.ctx.waitUntil;
	return { cloudflare, extra, myVarInVariables, isWaitUntilDefined };
};

export default function Index({ loaderData }: Route.ComponentProps) {
	const { cloudflare, extra, myVarInVariables, isWaitUntilDefined } =
		loaderData;
	return (
		<Container size={"3"} pt={"4"}>
			<Heading size={"8"} align="center">
				Kakeibo
			</Heading>
			<Flex align={"center"} justify={"center"} pt={"4"}>
				<Button
					variant="surface"
					onClick={() => signIn("google", { callbackUrl: "/home" })}
				>
					Googleアカウントでサインイン
				</Button>
			</Flex>
		</Container>
		// <div>
		//   <h1>Kakeibo</h1>
		//   <h2>Var is {cloudflare.env.MY_VAR}</h2>
		//   <h3>
		//     {cloudflare.cf ? 'cf,' : ''}
		//     {cloudflare.ctx ? 'ctx,' : ''}
		//     {cloudflare.caches ? 'caches are available' : ''}
		//   </h3>
		//   <h4>Extra is {extra}</h4>
		//   <h5>Var in Variables is {myVarInVariables}</h5>
		//   <h6>waitUntil is {isWaitUntilDefined ? 'defined' : 'not defined'}</h6>
		// </div>
	);
}
