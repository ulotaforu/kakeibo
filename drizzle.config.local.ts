import type { Config } from "drizzle-kit";
import { readdirSync } from "node:fs";

const fileNames = readdirSync(
	".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
);

const fileName = fileNames.find((fileName) => {
	return fileName.endsWith(".sqlite");
});

if (fileName === undefined) {
	throw new Error("No sqlite file found");
}

export default {
	out: "./server/drizzle",
	schema: "./server/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${fileName}`,
	},
} satisfies Config;
