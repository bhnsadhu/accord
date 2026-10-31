CREATE TABLE "request_budgets" (
	"scope" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "request_budgets_scope_window_start_pk" PRIMARY KEY("scope","window_start")
);
--> statement-breakpoint
CREATE INDEX "request_budgets_expiry_idx" ON "request_budgets" USING btree ("expires_at");