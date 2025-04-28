// server/index.ts
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { usersTable } from "./db/schema";

const app = new Hono<{
	Bindings: {
		MY_VAR: string;
		DB: D1Database;
	};
	Variables: {
		MY_VAR_IN_VARIABLES: string;
	};
}>();

app.use(async (c, next) => {
	c.set("MY_VAR_IN_VARIABLES", "My variable set in c.set");
	await next();
	c.header("X-Powered-By", "React Router and Hono");
});

app.get("/api", async (c) => {
	const db = drizzle(c.env.DB);
	const insertResult = await db.insert(usersTable).values({
		name: "test-user",
		email: "test@test.com",
	});
	console.log(insertResult);
	const selectResult = await db.select().from(usersTable);
	console.log(selectResult);
	return c.json({
		message: "Hello",
		var: c.env.MY_VAR,
		users: selectResult,
	});
});

export default app;
