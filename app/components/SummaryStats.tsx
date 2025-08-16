import { Box, Flex, Text } from "@radix-ui/themes";

interface SummaryStatsProps {
	totalAmount: number;
	perPayer: Array<{ name: string; amount: number }>;
}

export function SummaryStats({ totalAmount, perPayer }: SummaryStatsProps) {
	return (
		<Box>
			<Text
				size="5"
				weight="medium"
				style={{ marginBottom: "var(--space-2)", display: "block" }}
			>
				合計: {totalAmount.toLocaleString()} 円
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