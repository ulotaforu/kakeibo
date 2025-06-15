import React from "react";
import { Flex, Text, TextField, Select, Button } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";

type Category = { id: string; name: string; is_expense: number | boolean };
type Member = { id: string; name: string };

interface IncomeFormProps {
	categories: Category[];
	members: Member[];
}

export default function IncomeForm({ categories, members }: IncomeFormProps) {
	return (
		<Flex direction="column" gap="3">
			{/* 金額 */}
			<Flex direction="column" gap="1">
				<Text size="2">金額</Text>
				<TextField.Root
					type="number"
					inputMode="numeric"
					pattern="[0-9]*"
					placeholder="金額を入力"
					name="amount"
				/>
			</Flex>

			{/* カテゴリ */}
			<Flex direction="column" gap="1">
				<Text size="2">カテゴリ</Text>
				<Select.Root name="category_id">
					<Select.Trigger placeholder="カテゴリを選択" />
					<Select.Content>
						{categories
							.filter((c) => !c.is_expense)
							.map((c) => (
								<Select.Item key={c.id} value={c.id}>
									{c.name}
								</Select.Item>
							))}
					</Select.Content>
				</Select.Root>
			</Flex>

			{/* 受取者 */}
			<Flex direction="column" gap="1">
				<Text size="2">受取者</Text>
				<Select.Root name="payee">
					<Select.Trigger placeholder="受取者を選択" />
					<Select.Content>
						{members.map((m) => (
							<Select.Item key={m.id} value={m.id}>
								{m.name}
							</Select.Item>
						))}
					</Select.Content>
				</Select.Root>
			</Flex>

			{/* 受取日 */}
			<Flex direction="column" gap="1">
				<Text size="2">受取日</Text>
				<TextField.Root type="date" name="received_at" />
			</Flex>

			<Flex justify="end" gap="2" mt="3">
				<Button type="submit" variant="solid">
					<PlusIcon /> 登録
				</Button>
			</Flex>
		</Flex>
	);
}
