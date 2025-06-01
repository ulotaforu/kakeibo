import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { HonoContext } from "server";
import { usersTable } from "server/db/schema";
import { type InferInput, literal, object, string, union } from "valibot";

const Unauthorized = object({
	state: literal("unauthorized"),
});
const Registering = object({
	state: literal("registering"),
	email: string(),
});
const Authenticated = object({
	state: literal("authenticated"),
	email: string(),
	name: string(),
	userId: string(),
});
const AuthStatesSchema = union([Unauthorized, Registering, Authenticated]);
export type AuthStatesType = InferInput<typeof AuthStatesSchema>;

export const checkUser = async (
	context: HonoContext,
): Promise<AuthStatesType> => {
	try {
		const authUser = context.get("authUser");
		const email = authUser.session.user?.email;

		if (!email) {
			return { state: "unauthorized" };
		}

		const db = drizzle(context.env.DB);

		const result = await db
			.select({ 
				id: usersTable.id,
				name: usersTable.name 
			})
			.from(usersTable)
			.where(eq(usersTable.email, email));

		// emailはユニークであるためこの実装でOK
		const user = result[0];

		if (user === undefined) {
			return {
				state: "registering",
				email,
			};
		}

		return {
			state: "authenticated" as const,
			email,
			name: user.name,
			userId: user.id,
		};
	} catch (error) {
		return { state: "unauthorized" };
	}
};
