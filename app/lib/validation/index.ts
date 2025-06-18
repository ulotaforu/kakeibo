import {
	email,
	minLength,
	nonEmpty,
	number,
	object,
	pipe,
	string,
	optional,
} from "valibot";

export const SignUpMessages = {
	name: "名前は1文字以上で入力してください",
	email: {
		format: "メールアドレスの形式が正しくありません",
		empty: "メールアドレスは必須です",
	},
};
export const SignUpSchema = object({
	name: pipe(string(), minLength(1, SignUpMessages.name)),
	email: pipe(
		string(),
		email(SignUpMessages.email.format),
		nonEmpty(SignUpMessages.email.empty),
	),
});

export const NewHouseholdMessages = {
	name: "家計簿名を入力してください",
};
export const NewHouseholdSchema = object({
	name: string(NewHouseholdMessages.name),
});

export const ExpenseFormMessages = {
	amount: "金額を入力してください",
	category: "カテゴリを選択してください",
	tags: "タグを選択してください",
	payer: "支払った人を選択してください",
	paidAt: "支払日を選択してください",
};
export const ExpenseFormSchema = object({
	amount: pipe(number(ExpenseFormMessages.amount)),
	category: pipe(string(ExpenseFormMessages.category)),
	tags: pipe(string(ExpenseFormMessages.tags)),
	note: optional(string()),
	payer: pipe(string(ExpenseFormMessages.payer)),
	paidAt: pipe(string(ExpenseFormMessages.paidAt)),
});

export const InviteFormMessages = {
	invitee_email: {
		format: "メールアドレスの形式が正しくありません",
		empty: "メールアドレスは必須です",
	},
};
export const InviteFormSchema = object({
	invitee_email: pipe(
		string(),
		email(InviteFormMessages.invitee_email.format),
		nonEmpty(InviteFormMessages.invitee_email.empty),
	),
});
