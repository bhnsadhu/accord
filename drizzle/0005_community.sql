CREATE TYPE "public"."review_status" AS ENUM('published', 'hidden');--> statement-breakpoint
CREATE TABLE "reminds_of" (
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"other_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminds_of_user_id_product_id_other_id_pk" PRIMARY KEY("user_id","product_id","other_id"),
	CONSTRAINT "reminds_of_distinct" CHECK ("reminds_of"."product_id" <> "reminds_of"."other_id")
);
--> statement-breakpoint
CREATE TABLE "review_helpful" (
	"review_id" integer NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "review_helpful_review_id_user_id_pk" PRIMARY KEY("review_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "review_reports" (
	"review_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_reports_review_id_user_id_pk" PRIMARY KEY("review_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"body" text NOT NULL,
	"status" "review_status" DEFAULT 'published' NOT NULL,
	"helpful" integer DEFAULT 0 NOT NULL,
	"reports" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wear_votes" (
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"longevity" smallint,
	"sillage" smallint,
	"reads" smallint,
	"value" smallint,
	"seasons" text[] DEFAULT '{}'::text[] NOT NULL,
	"occasions" text[] DEFAULT '{}'::text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wear_votes_user_id_product_id_pk" PRIMARY KEY("user_id","product_id"),
	CONSTRAINT "wear_votes_longevity_range" CHECK ("wear_votes"."longevity" is null or "wear_votes"."longevity" between 1 and 5),
	CONSTRAINT "wear_votes_sillage_range" CHECK ("wear_votes"."sillage" is null or "wear_votes"."sillage" between 1 and 4),
	CONSTRAINT "wear_votes_reads_range" CHECK ("wear_votes"."reads" is null or "wear_votes"."reads" between 1 and 5),
	CONSTRAINT "wear_votes_value_range" CHECK ("wear_votes"."value" is null or "wear_votes"."value" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "reminds_of" ADD CONSTRAINT "reminds_of_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminds_of" ADD CONSTRAINT "reminds_of_product_id_fragrances_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."fragrances"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminds_of" ADD CONSTRAINT "reminds_of_other_id_fragrances_product_id_fk" FOREIGN KEY ("other_id") REFERENCES "public"."fragrances"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful" ADD CONSTRAINT "review_helpful_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful" ADD CONSTRAINT "review_helpful_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fragrances_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."fragrances"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_votes" ADD CONSTRAINT "wear_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_votes" ADD CONSTRAINT "wear_votes_product_id_fragrances_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."fragrances"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reminds_of_product_idx" ON "reminds_of" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_user_product_idx" ON "reviews" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id","status","created_at");--> statement-breakpoint
CREATE INDEX "reviews_recent_idx" ON "reviews" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "wear_votes_product_idx" ON "wear_votes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "collection_items_product_idx" ON "collection_items" USING btree ("product_id","shelf");