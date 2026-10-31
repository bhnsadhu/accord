import { sql } from "drizzle-orm";
import {
  boolean,
  date,
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
import type { FragranceResearch } from "../lib/catalog/research-schema";

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

/** Reviewed enrichment is separate from the original catalog and survives re-seeding. */
export const fragranceResearch = pgTable("fragrance_research", {
  productId: text("product_id").primaryKey().references(() => fragrances.productId, { onDelete: "cascade" }),
  concentration: text("concentration"),
  perfumers: text("perfumers").array().notNull().default(sql`'{}'::text[]`),
  editionGroup: text("edition_group"),
  aliasesText: text("aliases_text").notNull().default(""),
  data: jsonb("data").$type<FragranceResearch>().notNull(),
  verifiedAt: date("verified_at").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("research_edition_idx").on(t.editionGroup), index("research_alias_trgm").using("gin", sql`${t.aliasesText} gin_trgm_ops`)]);

/** A private catalog suggestion inbox. No public submission endpoint reads it. */
export const catalogRequests = pgTable("catalog_requests", {
  id: serial("id").primaryKey(),
  fragrance: text("fragrance").notNull(),
  brand: text("brand").notNull(),
  sourceUrl: text("source_url"),
  fingerprint: text("fingerprint").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("catalog_requests_fingerprint_idx").on(t.fingerprint, t.createdAt)]);

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

// ---------------------------------------------------------------------------
// Scanner protection. No photos are stored: only counters, short leases, and
// recent results keyed by a SHA-256 of the uploaded bytes.
// ---------------------------------------------------------------------------

/** Daily counters per scope ("global", "user:<id>", "guest:<hashed ip>"). */
export const scanQuota = pgTable(
  "scan_quota",
  {
    scope: text("scope").notNull(),
    day: date("day").notNull(),
    used: integer("used").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.scope, t.day] })],
);

/** A fixed number of upstream call slots; a lease expires on its own if a function dies. */
export const scanSlots = pgTable("scan_slots", {
  slot: smallint("slot").primaryKey(),
  leaseId: text("lease_id"),
  leasedUntil: timestamp("leased_until", { withTimezone: true }).notNull().defaultNow(),
});

/** Recent recognition results by image hash, so a resubmitted photo never reaches ScentLens twice. */
export const scanCache = pgTable(
  "scan_cache",
  {
    imageHash: text("image_hash").primaryKey(),
    result: jsonb("result").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scan_cache_created_idx").on(t.createdAt)],
);
