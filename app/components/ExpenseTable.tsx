import { Box, IconButton, Table, Text } from "@radix-ui/themes";
import { Pencil1Icon } from "@radix-ui/react-icons";

interface ExpenseTableProps {
	expenses: Array<{
		id: string;
		amount: number;
		note: string | null;
		paid_at: string;
		categoryName: string;
		tagName: string | null;
		payerName: string;
	}>;
	onEditExpense: (expense: any) => void;
}

export function ExpenseTable({ expenses, onEditExpense }: ExpenseTableProps) {
	return (
		<Box style={{ overflowX: "auto" }}>
			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>日付</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>金額</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>カテゴリ</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>タグ</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>支払者</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>メモ</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>編集</Table.ColumnHeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{expenses.map((expense) => (
						<Table.Row key={expense.id}>
							<Table.Cell>
								<Text size="2">
									{new Date(expense.paid_at).toLocaleDateString(
										"ja-JP",
										{
											month: "numeric",
											day: "numeric",
										},
									)}
								</Text>
							</Table.Cell>
							<Table.Cell>
								<Text size="2" weight="medium">
									¥{expense.amount.toLocaleString()}
								</Text>
							</Table.Cell>
							<Table.Cell>
								<Text size="2">{expense.categoryName}</Text>
							</Table.Cell>
							<Table.Cell>
								<Text size="2">{expense.tagName || "-"}</Text>
							</Table.Cell>
							<Table.Cell>
								<Text size="2">{expense.payerName}</Text>
							</Table.Cell>
							<Table.Cell>
								<Text
									size="2"
									style={{
										maxWidth: "150px",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{expense.note || "-"}
								</Text>
							</Table.Cell>
							<Table.Cell>
								<IconButton
									variant="ghost"
									size="1"
									onClick={() => onEditExpense(expense)}
								>
									<Pencil1Icon />
								</IconButton>
							</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table.Root>
		</Box>
	);
}