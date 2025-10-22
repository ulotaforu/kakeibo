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
import { Form, useActionData } from "react-router";
import { useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { FixedExpenseFormSchema } from "~/lib/validation";

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
	const actionData = useActionData();
	const [form, fields] = useForm({
		lastResult: actionData,
		shouldValidate: "onSubmit",
		shouldRevalidate: "onSubmit",
		onValidate({ formData }) {
			return parseWithValibot(formData, { schema: FixedExpenseFormSchema });
		},
	});
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
						<Form method="post" id={form.id} onSubmit={form.onSubmit} noValidate={form.noValidate}>
							<Flex direction="column" gap="3">
								{/* フォームエラー表示 */}
								{form.errors && (
									<Flex direction="column" gap="1">
										{form.errors.map((error) => (
											<Text key={error} color="red" size="2">
												{error}
											</Text>
										))}
									</Flex>
								)}

								{/* カテゴリ */}
								<Flex direction="column" gap="1">
									<Text size="2">カテゴリ</Text>
									<Select.Root
										key={fields.category_id.key}
										name={fields.category_id.name}
										defaultValue={categories.filter(c => c.is_expense)[0]?.id}
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
									{fields.category_id.errors && (
										<Text color="red" size="1">
											{fields.category_id.errors}
										</Text>
									)}
								</Flex>

								{/* 金額 */}
								<Flex direction="column" gap="1">
									<Text size="2">金額</Text>
									<TextField.Root
										key={fields.amount.key}
										name={fields.amount.name}
										type="number"
										inputMode="numeric"
										pattern="[0-9]*"
										placeholder="金額を入力"
									/>
									{fields.amount.errors && (
										<Text color="red" size="1">
											{fields.amount.errors}
										</Text>
									)}
								</Flex>

								{/* タグ */}
								<Flex direction="column" gap="1">
									<Text size="2">タグ</Text>
									<Select.Root
										key={fields.tag_id.key}
										name={fields.tag_id.name}
										defaultValue={tags[0]?.id}
									>
										<Select.Trigger />
										<Select.Content>
											{tags.map((t) => (
												<Select.Item key={t.id} value={t.id}>
													{t.name}
												</Select.Item>
											))}
										</Select.Content>
									</Select.Root>
									{fields.tag_id.errors && (
										<Text color="red" size="1">
											{fields.tag_id.errors}
										</Text>
									)}
								</Flex>

								{/* メモ */}
								<Flex direction="column" gap="1">
									<Text size="2">メモ</Text>
									<TextField.Root
										key={fields.note.key}
										name={fields.note.name}
										placeholder="メモ"
									/>
									{fields.note.errors && (
										<Text color="red" size="1">
											{fields.note.errors}
										</Text>
									)}
								</Flex>

								{/* 支払者 */}
								<Flex direction="column" gap="1">
									<Text size="2">支払者</Text>
									<Select.Root
										key={fields.payer.key}
										name={fields.payer.name}
										defaultValue={members[0]?.id}
									>
										<Select.Trigger />
										<Select.Content>
											{members.map((m) => (
												<Select.Item key={m.id} value={m.id}>
													{m.name}
												</Select.Item>
											))}
										</Select.Content>
									</Select.Root>
									{fields.payer.errors && (
										<Text color="red" size="1">
											{fields.payer.errors}
										</Text>
									)}
								</Flex>

								<Flex justify="end" gap="2" mt="3">
									<Dialog.Close>
										<Button type="button" variant="soft">
											キャンセル
										</Button>
									</Dialog.Close>
									<Button type="submit" variant="solid">
										<PlusIcon /> 登録
									</Button>
								</Flex>
							</Flex>
						</Form>
					</Dialog.Content>
				</Dialog.Root>
			</Flex>
		</>
	);
}
