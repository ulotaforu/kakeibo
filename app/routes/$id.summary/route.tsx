import type { Route } from "./+types/route";
import {
	Link,
	useLoaderData,
	useFetcher,
} from "react-router";
import { checkUser } from "~/lib/auth/session";
import { redirect } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import {
	householdsTable,
	householdUsersTable,
	expensesTable,
	usersTable,
} from "server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
	Button,
	Container,
	Flex,
	Text,
	TextField,
	Box,
} from "@radix-ui/themes";
import { HamburgerMenu } from "~/components/HamburgerMenu";
import type React from "react";

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

	const members = await db
		.select({ id: usersTable.id, name: usersTable.name })
		.from(householdUsersTable)
		.innerJoin(usersTable, eq(householdUsersTable.user_id, usersTable.id))
		.where(eq(householdUsersTable.household_id, params.id));

	const ymPrefix = `${ym}%`;

	const expenses = await db
		.select({
			amount: expensesTable.amount,
			payer: expensesTable.payer,
		})
		.from(expensesTable)
		.where(
			and(
				eq(expensesTable.household_id, params.id),
				sql`${expensesTable.paid_at} LIKE ${ymPrefix}`,
			),
		);

	const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

	const perPayerMap: Record<string, number> = {};
	for (const { payer, amount } of expenses) {
		perPayerMap[payer] = (perPayerMap[payer] || 0) + amount;
	}

	const perPayer = members.map((m) => ({
		name: m.name,
		amount: perPayerMap[m.id] || 0,
	}));

	return {
		household,
		isOwner: userHousehold.owner,
		summary: { totalAmount, perPayer, ym },
	};
};

export default function HouseholdSummaryPage() {
	const { household, isOwner, summary } = useLoaderData<typeof loader>();
	const fetcher = useFetcher<typeof loader>();
	const currentSummary = fetcher.data?.summary ?? summary;

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
							{household.name} - サマリー
						</Text>
					</Flex>

					<Flex direction="column" p="4" gap="2">
						<fetcher.Form
							method="get"
							style={{ marginBottom: "var(--space-2)" }}
						>
							<Flex align="center" gap="2">
								<TextField.Root
									type="month"
									name="ym"
									defaultValue={currentSummary.ym}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										e.currentTarget.form?.requestSubmit()
									}
									style={{ width: "140px", padding: "var(--space-1)" }}
									max={new Date().toISOString().slice(0, 7)}
								/>
							</Flex>
						</fetcher.Form>
						<Text size="5" weight="medium">
							合計: {currentSummary.totalAmount.toLocaleString()} 円
						</Text>
						<Flex direction="column" gap="1">
							{currentSummary.perPayer.map((p) => (
								<Text key={p.name} size="3">
									{p.name}: {p.amount.toLocaleString()} 円
								</Text>
							))}
						</Flex>
					</Flex>
				</Container>
			</Box>
		</Flex>
	);
}