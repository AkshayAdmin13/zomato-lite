// One-off, non-destructive migration: adds image_url to restaurants and
// fills in Ludhiana Burrito's photo — WITHOUT wiping the reviews table.
// Fresh installs don't need this (db/schema.sql + db:setup already include
// the column and the seed); running it twice is harmless either way.
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const envFile = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const dbUrl = envFile.match(/^DATABASE_URL=(.*)$/m)[1].trim();
const sql = neon(dbUrl);

const BURRITO_PHOTO =
  "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=1200&auto=format&fit=crop";

async function main() {
  console.log("Adding image_url column to restaurants (keeps all rows)...");
  await sql`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url TEXT`;

  console.log("Filling in Ludhiana Burrito's photo URL...");
  const rows = await sql`
    UPDATE restaurants
    SET image_url = ${BURRITO_PHOTO}
    WHERE id = 1
    RETURNING id, name, image_url
  `;
  console.table(rows);
  console.log("Migration complete. Reviews were untouched.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
