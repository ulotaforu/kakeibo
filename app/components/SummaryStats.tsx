import { Box, Flex, Text } from "@radix-ui/themes";

interface SummaryStatsProps {
	expenseTotal: number;
	incomeTotal: number;
	perPayer: Array<{ name: string; amount: number }>;
	perPayee: Array<{ name: string; amount: number }>;
}

export function SummaryStats({
	expenseTotal,
	incomeTotal,
	perPayer,
	perPayee,
}: SummaryStatsProps) {
	return (
		<Box>
			<Text
				size="5"
				weight="medium"
				style={{ marginBottom: "var(--space-2)", display: "block" }}
			>
				総収入: {incomeTotal.toLocaleString()} 円
			</Text>
			<Flex direction="column" gap="1">
				{perPayee.map((p) => (
					<Text key={p.name} size="3">
						{p.name}: {p.amount.toLocaleString()} 円
					</Text>
				))}
			</Flex>
			<Text
				size="5"
				weight="medium"
				style={{ marginBottom: "var(--space-2)", display: "block" }}
			>
				総支出: {expenseTotal.toLocaleString()} 円
			</Text>
			<Flex direction="column" gap="1">
				{perPayer.map((p) => (
					<Text key={p.name} size="3">
						{p.name}: {p.amount.toLocaleString()} 円
					</Text>
				))}
			</Flex>
		</Box>
	);
}
