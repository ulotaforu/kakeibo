import React from "react";
import {
	Flex,
	Box,
	Text,
	Button,
	Dialog,
	Select,
	TextField,
} from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";

type FixedItem = {
	id: string;
	categoryName: string;
	amount: number;
	payerName: string;
	paid: boolean;
};

interface FixedExpenseSectionProps {
	fixedList: FixedItem[];
	categories: { id: string; name: string; is_expense: boolean | number }[];
	tags: { id: string; name: string }[];
	members: { id: string; name: string }[];
}

export default function FixedExpenseSection({
	fixedList,
	categories,
	tags,
	members,
}: FixedExpenseSectionProps) {
	return (
		<>
			<Flex direction="column" gap="4">
				{/* 未払い */}
				<Box>
					<Text weight="medium" mb="2">
						未払い
					</Text>
					<Flex direction="column" gap="2">
						{fixedList
							.filter((f) => !f.paid)
							.map((f) => (
								<Flex
									key={f.id}
									justify="between"
									align="center"
									px="2"
									py="1"
									style={{ background: "var(--gray-2)", borderRadius: 4 }}
								>
									<Text>{f.categoryName}</Text>
									<Text>{f.amount.toLocaleString()} 円</Text>
									<Text size="1">{f.payerName}</Text>
									<Button size="1" variant="surface">
										支払
									</Button>
								</Flex>
							))}
						{fixedList.filter((f) => !f.paid).length === 0 && (
							<Text size="2" color="gray">
								未払いの固定費はありません
							</Text>
						)}
					</Flex>
				</Box>

				{/* 支払い済み */}
				<Box>
					<Text weight="medium" mb="2">
						支払い済み
					</Text>
					<Flex direction="column" gap="2">
						{fixedList
							.filter((f) => f.paid)
							.map((f) => (
								<Flex
									key={f.id}
									justify="between"
									align="center"
									px="2"
									py="1"
									style={{ background: "var(--green-2)", borderRadius: 4 }}
								>
									<Text>{f.categoryName}</Text>
									<Text>{f.amount.toLocaleString()} 円</Text>
									<Text size="1">{f.payerName}</Text>
								</Flex>
							))}
						{fixedList.filter((f) => f.paid).length === 0 && (
							<Text size="2" color="gray">
								今月支払い済みの固定費はありません
							</Text>
						)}
					</Flex>
				</Box>
			</Flex>

			{/* 追加ボタン */}
			<Flex justify="end" gap="2" mt="3">
				<Dialog.Root>
					<Dialog.Trigger>
						<Button variant="solid" size="2">
							<PlusIcon /> 登録
						</Button>
					</Dialog.Trigger>
					<Dialog.Content style={{ padding: "var(--space-4)", width: 400 }}>
						<Dialog.Title mb="3">固定費を登録</Dialog.Title>
						<Flex direction="column" gap="3">
							{/* カテゴリ */}
							<Flex direction="column" gap="1">
								<Text size="2">カテゴリ</Text>
								<Select.Root
									name="category_id"
									defaultValue={categories[0]?.id}
								>
									<Select.Trigger />
									<Select.Content>
										{categories
											.filter((c) => c.is_expense)
											.map((c) => (
												<Select.Item key={c.id} value={c.id}>
													{c.name}
												</Select.Item>
											))}
									</Select.Content>
								</Select.Root>
							</Flex>

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

							{/* タグ */}
							<Flex direction="column" gap="1">
								<Text size="2">タグ</Text>
								<Select.Root name="tag_id" defaultValue={tags[0]?.id}>
									<Select.Trigger />
									<Select.Content>
										{tags.map((t) => (
											<Select.Item key={t.id} value={t.id}>
												{t.name}
											</Select.Item>
										))}
									</Select.Content>
								</Select.Root>
							</Flex>

							{/* メモ */}
							<Flex direction="column" gap="1">
								<Text size="2">メモ</Text>
								<TextField.Root name="note" placeholder="メモ" />
							</Flex>

							{/* 支払者 */}
							<Flex direction="column" gap="1">
								<Text size="2">支払者</Text>
								<Select.Root name="payer" defaultValue={members[0]?.id}>
									<Select.Trigger />
									<Select.Content>
										{members.map((m) => (
											<Select.Item key={m.id} value={m.id}>
												{m.name}
											</Select.Item>
										))}
									</Select.Content>
								</Select.Root>
							</Flex>

							<Flex justify="end" gap="2" mt="3">
								<Button type="submit" variant="solid">
									<PlusIcon /> 登録
								</Button>
							</Flex>
						</Flex>
					</Dialog.Content>
				</Dialog.Root>
			</Flex>
		</>
	);
}
