import { Card, Flex, Text, Box, Grid } from "@radix-ui/themes";

interface MonthlySummaryProps {
	totalExpenses: number;
	totalIncome: number;
	currentMonth: string;
}

export function MonthlySummary({ 
	totalExpenses, 
	totalIncome, 
	currentMonth 
}: MonthlySummaryProps) {
	const balance = totalIncome - totalExpenses;
	const isPositive = balance >= 0;

	return (
		<Box mb="4">
			<Text size="4" weight="medium" mb="3" style={{ display: "block" }}>
				{currentMonth}の家計サマリー
			</Text>
			
			<Grid columns="3" gap="4">
				{/* 総収入カード */}
				<Card style={{ padding: "var(--space-4)" }}>
					<Text size="2" color="gray" mb="2" style={{ display: "block" }}>
						総収入
					</Text>
					<Text size="5" weight="bold">
						{totalIncome.toLocaleString()}円
					</Text>
				</Card>
				
				{/* 総支出カード */}
				<Card style={{ padding: "var(--space-4)" }}>
					<Text size="2" color="gray" mb="2" style={{ display: "block" }}>
						総支出
					</Text>
					<Text size="5" weight="bold">
						{totalExpenses.toLocaleString()}円
					</Text>
				</Card>
				
				{/* 差し引きカード */}
				<Card style={{ padding: "var(--space-4)" }}>
					<Text size="2" color="gray" mb="2" style={{ display: "block" }}>
						差し引き
					</Text>
					<Text 
						size="5" 
						weight="bold" 
						color={isPositive ? "green" : "red"}
					>
						{isPositive ? "+" : ""}{balance.toLocaleString()}円
					</Text>
				</Card>
			</Grid>
		</Box>
	);
}