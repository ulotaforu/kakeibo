import { Box, IconButton, Table, Text } from "@radix-ui/themes";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router";

interface SummaryTableProps {
	expenses: Array<{
		id: string;
		amount: number;
		note: string | null;
		date: string;
		categoryName: string;
		tagName: string | null;
		userName: string;
		isExpense: boolean;
	}>;
	incomes: Array<{
		id: string;
		amount: number;
		note: string | null;
		date: string;
		categoryName: string;
		userName: string;
		isExpense: boolean;
	}>;
	householdId: string;
}

export function SummaryTable({
	expenses,
	incomes,
	householdId,
}: SummaryTableProps) {
	const summary = [...expenses, ...incomes].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);
	const navigate = useNavigate();

	return (
		<Box style={{ overflowX: "auto" }}>
			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>日付</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>金額</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>カテゴリ</Table.ColumnHeaderCell>
						{/* <Table.ColumnHeaderCell>タグ</Table.ColumnHeaderCell> */}
						<Table.ColumnHeaderCell>ユーザー</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>メモ</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>編集</Table.ColumnHeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{summary.map((item) => (
						<Table.Row key={item.id}>
							<Table.Cell>
								<Text size="2">
									{new Date(item.date).toLocaleDateString("ja-JP", {
										month: "numeric",
										day: "numeric",
									})}
								</Text>
							</Table.Cell>
							<Table.Cell>
								<Text size="2" weight="medium">
									¥{item.amount.toLocaleString()}
								</Text>
							</Table.Cell>
							<Table.Cell>
								<Text size="2">{item.categoryName}</Text>
							</Table.Cell>
							{/* <Table.Cell>
								<Text size="2">{item.tagName || "-"}</Text>
							</Table.Cell> */}
							<Table.Cell>
								<Text size="2">{item.userName}</Text>
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
									{item.note || "-"}
								</Text>
							</Table.Cell>
							<Table.Cell>
								<IconButton
									variant="ghost"
									size="1"
									onClick={() =>
										navigate(
											`/${householdId}/edit/${
												item.isExpense ? "expenses" : "incomes"
											}/${item.id}`,
										)
									}
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
