import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	created_at: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updated_at: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
});

export const householdsTable = sqliteTable("households", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
});

export const householdUsersTable = sqliteTable("household_users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text("user_id")
		.notNull()
		.references(() => usersTable.id),
	household_id: text("household_id")
		.notNull()
		.references(() => householdsTable.id),
	owner: integer("owner", { mode: "boolean" }).notNull().default(false),
});

export const categoriesTable = sqliteTable("categories", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	household_id: text("household_id")
		.notNull()
		.references(() => householdsTable.id),
	is_expense: integer("is_expense", { mode: "boolean" })
		.notNull()
		.default(true),
});

export const tagsTable = sqliteTable("tags", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	household_id: text("household_id")
		.notNull()
		.references(() => householdsTable.id),
});

export const expensesTable = sqliteTable("expense", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	household_id: text("household_id")
		.notNull()
		.references(() => householdsTable.id),
	amount: integer("amount").notNull(),
	category_id: text("category_id")
		.notNull()
		.references(() => categoriesTable.id),
	tag_id: text("tag_id")
		.notNull()
		.references(() => tagsTable.id),
	note: text("note"),
	payer: text("payer")
		.notNull()
		.references(() => usersTable.id),
	paid_at: text("paid_at").notNull(),
	created_at: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updated_at: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
});

export const fixedExpensesTable = sqliteTable("fixed_expenses", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	household_id: text("household_id")
		.notNull()
		.references(() => householdsTable.id),
	amount: integer("amount").notNull(),
	category_id: text("category_id")
		.notNull()
		.references(() => categoriesTable.id),
	tag_id: text("tag_id")
		.notNull()
		.references(() => tagsTable.id),
	note: text("note"),
	payer: text("payer")
		.notNull()
		.references(() => usersTable.id),
	created_at: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updated_at: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
});

export const incomesTable = sqliteTable("incomes", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	household_id: text("household_id")
		.notNull()
		.references(() => householdsTable.id),
	amount: integer("amount").notNull(),
	category_id: text("category_id")
		.notNull()
		.references(() => categoriesTable.id),
	note: text("note"),
	payee: text("payee")
		.notNull()
		.references(() => usersTable.id),
	received_at: text("received_at").notNull(),
	created_at: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updated_at: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
});

export const settlementsTable = sqliteTable("settlements", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	household_id: text("household_id")
		.notNull()
		.references(() => householdsTable.id),
	amount: integer("amount").notNull(),
	payer: text("payer")
		.notNull()
		.references(() => usersTable.id),
	status: integer("is_expense", { mode: "boolean" }).notNull().default(true),
	paid_at: text("paid_at").notNull(),
});
