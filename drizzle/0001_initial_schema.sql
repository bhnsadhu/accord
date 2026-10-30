CREATE TYPE "public"."gender" AS ENUM('feminine', 'masculine', 'unisex');--> statement-breakpoint
CREATE TYPE "public"."shelf" AS ENUM('owned', 'tried', 'wishlist');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"fragrance_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name"),
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collection_items" (
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"shelf" "shelf" NOT NULL,
	"rating" smallint,
	"favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_items_user_id_product_id_pk" PRIMARY KEY("user_id","product_id"),
	CONSTRAINT "collection_items_rating_range" CHECK ("collection_items"."rating" is null or "collection_items"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "fragrance_notes" (
	"product_id" text NOT NULL,
	"note_id" integer NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "fragrance_notes_product_id_note_id_pk" PRIMARY KEY("product_id","note_id")
);
--> statement-breakpoint
CREATE TABLE "fragrances" (
	"product_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"brand_id" integer NOT NULL,
	"name" text NOT NULL,
	"family" text,
	"subfamily" text,
	"gender" "gender",
	"year" smallint,
	"wheel" text,
	"character" text,
	"facets" text[] DEFAULT '{}'::text[] NOT NULL,
	"accords_raw" text NOT NULL,
	"notes_raw" text NOT NULL,
	"search_text" text NOT NULL,
	CONSTRAINT "fragrances_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"fragrance_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "notes_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "taste_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"profile" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_product_id_fragrances_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."fragrances"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fragrance_notes" ADD CONSTRAINT "fragrance_notes_product_id_fragrances_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."fragrances"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fragrance_notes" ADD CONSTRAINT "fragrance_notes_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fragrances" ADD CONSTRAINT "fragrances_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taste_profiles" ADD CONSTRAINT "taste_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_items_user_shelf_idx" ON "collection_items" USING btree ("user_id","shelf");--> statement-breakpoint
CREATE INDEX "fragrance_notes_note_idx" ON "fragrance_notes" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "fragrances_search_trgm" ON "fragrances" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "fragrances_brand_idx" ON "fragrances" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "fragrances_family_idx" ON "fragrances" USING btree ("family");--> statement-breakpoint
CREATE INDEX "fragrances_wheel_idx" ON "fragrances" USING btree ("wheel");--> statement-breakpoint
CREATE INDEX "fragrances_facets_gin" ON "fragrances" USING gin ("facets");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");