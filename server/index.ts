// server/index.ts
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { usersTable } from "./db/schema";
import { authHandler, initAuthConfig, verifyAuth } from "@hono/auth-js";
import Google from "@auth/core/providers/google";
import { HTTPException } from "hono/http-exception";
import "dotenv/config";

const app = new Hono<{
	Bindings: {
		MY_VAR: string;
		DB: D1Database;
	};
	Variables: {
		MY_VAR_IN_VARIABLES: string;
	};
}>();

app.use(
	"*",
	initAuthConfig((c) => ({
		secret: c.env.AUTH_SECRET,
		providers: [Google],
	})),
);
app.onError((err, c) => {
	console.error(err)
	if (err instanceof HTTPException && err.status === 401) {
		return c.redirect("/api/auth/signin");
	}
	return c.text("Error", 500);
});

app.use("/api/auth/*", authHandler());

// 全てのページで認証を必須にする
app.use("*", verifyAuth());

app.use(async (c, next) => {
	c.set("MY_VAR_IN_VARIABLES", "My variable set in c.set");
	await next();
	c.header("X-Powered-By", "React Router and Hono");
});

app.get("/api/test", async (c) => {
	const db = drizzle(c.env.DB);
	const selectResult = await db.select().from(usersTable);
	console.log(selectResult);
	return c.json({
		user: selectResult[0].name,
	});
});

export default app;
