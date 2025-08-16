import type React from "react";
import { useState, useEffect } from "react";
import { useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { ExpenseFormSchema } from "~/lib/validation";
import {
	Box,
	Button,
	Dialog,
	Flex,
	Select,
	Text,
	TextField,
} from "@radix-ui/themes";

interface EditExpenseDialogProps {
	expense: {
		id: string;
		amount: number;
		category_id: string;
		tag_id: string | null;
		note: string | null;
		payer: string;
		paid_at: string;
	};
	categories: Array<{ id: string; name: string }>;
	tags: Array<{ id: string; name: string }>;
	members: Array<{ id: string; name: string }>;
	isOpen: boolean;
	onClose: () => void;
	fetcher: any;
}

export function EditExpenseDialog({
	expense,
	categories,
	tags,
	members,
	isOpen,
	onClose,
	fetcher,
}: EditExpenseDialogProps) {
	// タグの状態管理（チェックボックス形式用）
	const [selectedTags, setSelectedTags] = useState<string[]>(() => {
		if (expense.tag_id) {
			return [expense.tag_id];
		}
		return [];
	});

	// expense が変更されたらタグを更新
	useEffect(() => {
		if (expense.tag_id) {
			setSelectedTags([expense.tag_id]);
		} else {
			setSelectedTags([]);
		}
	}, [expense.tag_id]);

	// 成功処理の実行フラグ
	const [hasProcessedSuccess, setHasProcessedSuccess] = useState(false);

	// ダイアログが開かれた時にフラグをリセット
	useEffect(() => {
		if (isOpen) {
			setHasProcessedSuccess(false);
			setHasSubmitted(false);
		}
	}, [isOpen]);

	const toggleTag = (id: string) => {
		setSelectedTags((prev) =>
			prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
		);
	};

	const [form, fields] = useForm({
		defaultValue: {
			amount: expense.amount,
			category: expense.category_id,
			tags: expense.tag_id || "",
			note: expense.note || "",
			payer: expense.payer,
			paidAt: expense.paid_at,
		},
		lastResult: fetcher.data,
		onValidate({ formData }) {
			return parseWithValibot(formData, { schema: ExpenseFormSchema });
		},
	});

	// submitが実行されたかどうかを追跡するフラグ
	const [hasSubmitted, setHasSubmitted] = useState(false);

	// fetcherの状態を監視してダイアログの制御を行う
	useEffect(() => {
		if (
			fetcher.state === "idle" && 
			fetcher.data && 
			"success" in fetcher.data && 
			hasSubmitted &&
			!hasProcessedSuccess
		) {
			// 成功した場合のみダイアログを閉じる
			setHasProcessedSuccess(true);
			onClose();
		}
		// エラーの場合はダイアログを開いたまま
	}, [fetcher.state, fetcher.data, hasSubmitted, hasProcessedSuccess, onClose]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		formData.set("intent", "update");
		formData.set("expenseId", expense.id);
		// タグの値を設定
		formData.set(fields.tags.name, selectedTags.join(","));
		setHasSubmitted(true);
		fetcher.submit(formData, { method: "post" });
		// ダイアログを閉じるのはuseEffectで成功時のみ行う
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={onClose}>
			<Dialog.Content style={{ maxWidth: "500px", padding: "var(--space-4)" }}>
				<Dialog.Title style={{ marginBottom: "var(--space-3)" }}>
					支出を編集
				</Dialog.Title>

				<fetcher.Form
					onSubmit={handleSubmit}
					id={form.id}
					noValidate
					style={{ width: "100%" }}
				>
					<Flex direction="column" gap="3">
						{/* 支払日 */}
						<Box>
							<Text size="2" weight="medium" style={{ display: "block", marginBottom: "var(--space-1)" }}>
								支払日
							</Text>
							<TextField.Root
								name={fields.paidAt.name}
								key={fields.paidAt.key}
								type="date"
								defaultValue={expense.paid_at}
								style={{ width: "100%" }}
							/>
							{fields.paidAt.errors && (
								<Text size="1" color="red" style={{ marginTop: "var(--space-1)" }}>
									{fields.paidAt.errors}
								</Text>
							)}
						</Box>

						{/* 金額 */}
						<Box>
							<Text size="2" weight="medium" style={{ display: "block", marginBottom: "var(--space-1)" }}>
								金額
							</Text>
							<TextField.Root
								name={fields.amount.name}
								key={fields.amount.key}
								type="number"
								defaultValue={String(expense.amount)}
								placeholder="金額を入力"
								style={{ width: "100%" }}
							/>
							{fields.amount.errors && (
								<Text size="1" color="red" style={{ marginTop: "var(--space-1)" }}>
									{fields.amount.errors}
								</Text>
							)}
						</Box>

						{/* カテゴリ */}
						<Box>
							<Text size="2" weight="medium" style={{ display: "block", marginBottom: "var(--space-1)" }}>
								カテゴリ
							</Text>
							<Select.Root
								name={fields.category.name}
								key={fields.category.key}
								defaultValue={expense.category_id}
							>
								<Select.Trigger
									placeholder="カテゴリを選択"
									style={{ width: "100%" }}
								/>
								<Select.Content position="popper">
									{categories.map((category) => (
										<Select.Item key={category.id} value={category.id}>
											{category.name}
										</Select.Item>
									))}
								</Select.Content>
							</Select.Root>
							{fields.category.errors && (
								<Text size="1" color="red" style={{ marginTop: "var(--space-1)" }}>
									{fields.category.errors}
								</Text>
							)}
						</Box>

						{/* タグ選択 */}
						<Box>
							<Text size="2" weight="medium" style={{ display: "block", marginBottom: "var(--space-1)" }}>
								タグ
							</Text>
							<Flex
								direction="row"
								gap="2"
								wrap="wrap"
								style={{ maxHeight: 120, overflowY: "auto" }}
							>
								{tags.map((tag) => (
									<label
										key={tag.id}
										style={{ display: "flex", alignItems: "center", gap: 4 }}
									>
										<input
											type="checkbox"
											checked={selectedTags.includes(tag.id)}
											onChange={() => toggleTag(tag.id)}
										/>
										{tag.name}
									</label>
								))}
							</Flex>
							{/* 隠しフィールドでタグの値を送信 */}
							<input
								type="hidden"
								name={fields.tags.name}
								value={selectedTags.join(",")}
							/>
							{fields.tags.errors && (
								<Text size="1" color="red" style={{ marginTop: "var(--space-1)" }}>
									{fields.tags.errors}
								</Text>
							)}
						</Box>

						{/* 支払った人 */}
						<Box>
							<Text size="2" weight="medium" style={{ display: "block", marginBottom: "var(--space-1)" }}>
								支払った人
							</Text>
							<Select.Root
								name={fields.payer.name}
								key={fields.payer.key}
								defaultValue={expense.payer}
							>
								<Select.Trigger
									placeholder="支払った人を選択"
									style={{ width: "100%" }}
								/>
								<Select.Content position="popper">
									{members.map((member) => (
										<Select.Item key={member.id} value={member.id}>
											{member.name}
										</Select.Item>
									))}
								</Select.Content>
							</Select.Root>
							{fields.payer.errors && (
								<Text size="1" color="red" style={{ marginTop: "var(--space-1)" }}>
									{fields.payer.errors}
								</Text>
							)}
						</Box>

						{/* メモ */}
						<Box>
							<Text size="2" weight="medium" style={{ display: "block", marginBottom: "var(--space-1)" }}>
								メモ
							</Text>
							<TextField.Root
								name={fields.note.name}
								key={fields.note.key}
								defaultValue={expense.note || ""}
								placeholder="メモを入力（任意）"
								style={{ width: "100%" }}
							/>
							{fields.note.errors && (
								<Text size="1" color="red" style={{ marginTop: "var(--space-1)" }}>
									{fields.note.errors}
								</Text>
							)}
						</Box>

						{/* ボタン */}
						<Flex justify="end" gap="2" style={{ marginTop: "var(--space-3)" }}>
							<Dialog.Close>
								<Button variant="soft" type="button">
									キャンセル
								</Button>
							</Dialog.Close>
							<Button type="submit" variant="solid">
								更新
							</Button>
						</Flex>
					</Flex>
				</fetcher.Form>
			</Dialog.Content>
		</Dialog.Root>
	);
}