import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const genderEnum = pgEnum("gender", ["feminine", "masculine", "unisex"]);
export const shelfEnum = pgEnum("shelf", ["owned", "tried", "wishlist"]);

// ---------------------------------------------------------------------------
// Catalog (read-only, seeded from the ScentLens products.csv export)
// ---------------------------------------------------------------------------

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  fragranceCount: integer("fragrance_count").notNull().default(0),
});

export const fragrances = pgTable(
  "fragrances",
  {
    /** ScentLens stable id, e.g. "p05819". Never reassigned. */
    productId: text("product_id").primaryKey(),
    slug: text("slug").notNull().unique(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id),
    name: text("name").notNull(),
    family: text("family"),
    subfamily: text("subfamily"),
    gender: genderEnum("gender"),
    year: smallint("year"),
    /** Edwards wheel family parsed from the catalog accord phrase. */
    wheel: text("wheel"),
    character: text("character"),
    facets: text("facets").array().notNull().default(sql`'{}'::text[]`),
    /** Source strings, kept verbatim for provenance. */
    accordsRaw: text("accords_raw").notNull(),
    notesRaw: text("notes_raw").notNull(),
    /** Folded "brand name" used for fuzzy search. */
    searchText: text("search_text").notNull(),
  },
  (t) => [
    index("fragrances_search_trgm").using("gin", sql`${t.searchText} gin_trgm_ops`),
    index("fragrances_brand_idx").on(t.brandId),
    index("fragrances_family_idx").on(t.family),
    index("fragrances_wheel_idx").on(t.wheel),
    index("fragrances_facets_gin").using("gin", t.facets),
  ],
);

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  fragranceCount: integer("fragrance_count").notNull().default(0),
});

export const fragranceNotes = pgTable(
  "fragrance_notes",
  {
    productId: text("product_id")
      .notNull()
      .references(() => fragrances.productId, { onDelete: "cascade" }),
    noteId: integer("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    /** Order the note appears in the source list. */
    position: smallint("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.noteId] }), index("fragrance_notes_note_idx").on(t.noteId)],
);

// ---------------------------------------------------------------------------
// User data
// ---------------------------------------------------------------------------

export const tasteProfiles = pgTable("taste_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Validated by tasteProfileSchema in src/lib/profile.ts. */
  profile: jsonb("profile").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collectionItems = pgTable(
  "collection_items",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => fragrances.productId),
    shelf: shelfEnum("shelf").notNull(),
    rating: smallint("rating"),
    favorite: boolean("favorite").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.productId] }),
    index("collection_items_user_shelf_idx").on(t.userId, t.shelf),
    check("collection_items_rating_range", sql`${t.rating} is null or ${t.rating} between 1 and 5`),
  ],
);
