CREATE TABLE "scan_cache" (
	"image_hash" text PRIMARY KEY NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_quota" (
	"scope" text NOT NULL,
	"day" date NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "scan_quota_scope_day_pk" PRIMARY KEY("scope","day")
);
--> statement-breakpoint
CREATE TABLE "scan_slots" (
	"slot" smallint PRIMARY KEY NOT NULL,
	"lease_id" text,
	"leased_until" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "scan_cache_created_idx" ON "scan_cache" USING btree ("created_at");--> statement-breakpoint
-- Two concurrent upstream calls at most; ScentLens runs one container with four input slots.
INSERT INTO "scan_slots" ("slot") VALUES (1), (2) ON CONFLICT DO NOTHING;
