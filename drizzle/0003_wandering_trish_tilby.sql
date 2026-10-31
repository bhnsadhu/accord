CREATE TABLE "catalog_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"fragrance" text NOT NULL,
	"brand" text NOT NULL,
	"source_url" text,
	"fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fragrance_research" (
	"product_id" text PRIMARY KEY NOT NULL,
	"concentration" text,
	"perfumers" text[] DEFAULT '{}'::text[] NOT NULL,
	"edition_group" text,
	"aliases_text" text DEFAULT '' NOT NULL,
	"data" jsonb NOT NULL,
	"verified_at" date NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fragrance_research" ADD CONSTRAINT "fragrance_research_product_id_fragrances_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."fragrances"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_requests_fingerprint_idx" ON "catalog_requests" USING btree ("fingerprint","created_at");--> statement-breakpoint
CREATE INDEX "research_edition_idx" ON "fragrance_research" USING btree ("edition_group");--> statement-breakpoint
CREATE INDEX "research_alias_trgm" ON "fragrance_research" USING gin ("aliases_text" gin_trgm_ops);