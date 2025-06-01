import { email, minLength, nonEmpty, object, pipe, string } from "valibot";

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
