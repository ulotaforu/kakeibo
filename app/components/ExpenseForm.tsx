import React from "react";
import { Flex, Text, TextField, Select, Button, Box } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";

type Category = { id: string; name: string; is_expense: number | boolean };
type Tag = { id: string; name: string };
type Member = { id: string; name: string };

type InputField = {
	name: string;
	/**
	 * `@conform-to/react` の `FieldMetadata.key` はフォームの再レンダーを
	 * 強制するために内部で利用される一時的な値で、初期レンダー時には
	 * `undefined` になることがあります。
	 * そのため `string | undefined` を許容するようにキーを optional に
	 * 変更して `FieldMetadata` と互換にします。
	 */
	key?: string;
	initialValue?: string | number;
	errors?: string | string[];
};

interface ExpenseFormProps {
	categories: Category[];
	tags: Tag[];
	members: Member[];

	fields: {
		amount: InputField;
		category: InputField;
		tags: InputField;
		note: InputField;
		payer: InputField;
		paidAt: InputField;
	};
}

export default function ExpenseForm({
	categories,
	tags,
	members,
	fields,
}: ExpenseFormProps) {
	const { amount, category, tags: tagsField, note, payer, paidAt } = fields;

	const [selectedTags, setSelectedTags] = React.useState<string[]>(() => {
		if (typeof tagsField.initialValue === "string") {
			return tagsField.initialValue.split(",").filter(Boolean);
		}
		return [];
	});

	React.useEffect(() => {
		if (typeof tagsField.initialValue === "string") {
			setSelectedTags(tagsField.initialValue.split(",").filter(Boolean));
		} else {
			setSelectedTags([]);
		}
	}, [tagsField.initialValue]);

	const toggleTag = (id: string) =>
		setSelectedTags((prev) =>
			prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
		);

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
					name={amount.name}
					key={amount.key}
					defaultValue={amount.initialValue}
					style={{ maxWidth: 200 }}
				/>
				{amount.errors && (
					<Text size="1" color="red">
						{amount.errors}
					</Text>
				)}
			</Flex>

			{/* カテゴリ */}
			<Flex direction="column" gap="1">
				<Text size="2">カテゴリ</Text>
				<Box style={{ maxWidth: 200 }}>
					<Select.Root
						name={category.name}
						key={category.key}
						defaultValue={category.initialValue as string | undefined}
					>
						<Select.Trigger
							placeholder="カテゴリを選択"
							style={{ width: "100%" }}
						/>
						<Select.Content position="popper">
							{categories
								.filter((c) => c.is_expense)
								.map((c) => (
									<Select.Item key={c.id} value={c.id}>
										{c.name}
									</Select.Item>
								))}
						</Select.Content>
					</Select.Root>
				</Box>
				{category.errors && (
					<Text size="1" color="red">
						{category.errors}
					</Text>
				)}
			</Flex>

			{/* タグ選択 */}
			<Flex direction="column" gap="1">
				<Text size="2">タグ</Text>
				<Flex
					direction="row"
					gap="2"
					wrap="wrap"
					style={{ maxHeight: 120, overflowY: "auto" }}
				>
					{tags.map((t) => (
						<label
							key={t.id}
							style={{ display: "flex", alignItems: "center", gap: 4 }}
						>
							<input
								type="checkbox"
								checked={selectedTags.includes(t.id)}
								onChange={() => toggleTag(t.id)}
							/>
							{t.name}
						</label>
					))}
				</Flex>
				{tagsField.errors && (
					<Text size="1" color="red">
						{tagsField.errors}
					</Text>
				)}
			</Flex>

			{/* メモ */}
			<Flex direction="column" gap="1">
				<Text size="2">メモ</Text>
				<TextField.Root
					placeholder="メモを入力(任意)"
					name={note.name}
					key={note.key}
					defaultValue={note.initialValue}
					style={{ maxWidth: 200 }}
				/>
				{note.errors && (
					<Text size="1" color="red">
						{note.errors}
					</Text>
				)}
			</Flex>

			{/* 支払った人 */}
			<Flex direction="column" gap="1">
				<Text size="2">支払った人</Text>
				<Box style={{ maxWidth: 200 }}>
					<Select.Root
						name={payer.name}
						key={payer.key}
						defaultValue={payer.initialValue as string | undefined}
					>
						<Select.Trigger
							placeholder="支払った人を選択"
							style={{ width: "100%" }}
						/>
						<Select.Content position="popper">
							{members.map((m) => (
								<Select.Item key={m.id} value={m.id}>
									{m.name}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Box>
				{payer.errors && (
					<Text size="1" color="red">
						{payer.errors}
					</Text>
				)}
			</Flex>

			{/* 支払日 */}
			<Flex direction="column" gap="1">
				<Text size="2">支払日</Text>
				<TextField.Root
					type="date"
					name={paidAt.name}
					key={paidAt.key}
					defaultValue={paidAt.initialValue}
					style={{ maxWidth: 200 }}
				/>
				{paidAt.errors && (
					<Text size="1" color="red">
						{paidAt.errors}
					</Text>
				)}
			</Flex>

			<Flex justify="end" gap="2" mt="3">
				<input
					type="hidden"
					name={tagsField.name}
					key={tagsField.key}
					value={selectedTags.join(",")}
				/>

				<Button type="submit" variant="solid">
					<PlusIcon /> 登録
				</Button>
			</Flex>
		</Flex>
	);
}
