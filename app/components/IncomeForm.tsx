import React from "react";
import { Flex, Text, TextField, Select, Button, Box } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";

type Category = { id: string; name: string; is_expense: number | boolean };
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

interface IncomeFormProps {
	categories: Category[];
	members: Member[];
	fields: {
		amount: InputField;
		category: InputField;
		payee: InputField;
		receivedAt: InputField;
	};
}

export default function IncomeForm({
	categories,
	members,
	fields,
}: IncomeFormProps) {
	const { amount, category, payee, receivedAt } = fields;

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
								.filter((c) => !c.is_expense)
								.map((c) => (
									<Select.Item key={c.id} value={c.id}>
										{c.name}
									</Select.Item>
								))}
						</Select.Content>
					</Select.Root>
				</Box>
			</Flex>

			{/* 収入があった人 */}
			<Flex direction="column" gap="1">
				<Text size="2">収入があった人</Text>
				<Box style={{ maxWidth: 200 }}>
					<Select.Root
						name={payee.name}
						key={payee.key}
						defaultValue={payee.initialValue as string | undefined}
					>
						<Select.Trigger
							placeholder="収入があった人を選択"
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
			</Flex>

			{/* 収入日 */}
			<Flex direction="column" gap="1">
				<Text size="2">収入日</Text>
				<TextField.Root
					type="date"
					name={receivedAt.name}
					key={receivedAt.key}
					defaultValue={receivedAt.initialValue}
					style={{ maxWidth: 200 }}
				/>
			</Flex>

			<Flex justify="end" gap="2" mt="3">
				<Button type="submit" variant="solid">
					<PlusIcon /> 登録
				</Button>
			</Flex>
		</Flex>
	);
}
