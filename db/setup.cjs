// db:setup — connects to Neon, creates the two tables, seeds Ludhiana Burrito.
// Standalone Node does not auto-load .env.local the way Next.js does,
// so we open the file and read DATABASE_URL ourselves.
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("No .env.local found. Create it with DATABASE_URL=... first.");
  process.exit(1);
}
const envFile = fs.readFileSync(envPath, "utf8");
const match = envFile.match(/^DATABASE_URL=(.*)$/m);
if (!match) {
  console.error("DATABASE_URL is missing inside .env.local");
  process.exit(1);
}
const sql = neon(match[1].trim());

async function main() {
  // 1. Wipe any previous state so re-runs are predictable
  console.log("Dropping tables if they already exist (wipes data, on purpose)...");
  await sql`DROP TABLE IF EXISTS reviews`;
  await sql`DROP TABLE IF EXISTS restaurants`;

  // 2. Apply the schema file, exactly as written in db/schema.sql
  //    (this one is a plain string, so it uses sql.query instead of a tagged template)
  console.log("Creating tables from db/schema.sql...");
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  // The driver accepts one statement per call, so split the file at semicolons.
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    await sql.query(statement);
  }

  // 3. Seed: one restaurant, three reviews with spaced-out created_at,
  //    so "latest review" is meaningful. Dates are computed by Postgres,
  //    e.g. NOW() - INTERVAL '8 days' = 8 days ago at the moment of seeding.
  console.log("Seeding Ludhiana Burrito and three reviews...");
  const restaurants = await sql`
    INSERT INTO restaurants (name, cuisine, area)
    VALUES ('Ludhiana Burrito', 'Indian', 'Sector 32')
    RETURNING id, name, cuisine, area
  `;
  const id = restaurants[0].id;

  const reviews = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment, created_at)
    VALUES
      (${id}, 5, 'Paneer burrito is unreal',   NOW() - INTERVAL '8 days'),
      (${id}, 4, 'Good, but slow service',     NOW() - INTERVAL '6 days'),
      (${id}, 4, 'Solid. Would repeat.',       NOW() - INTERVAL '2 days')
    RETURNING id, restaurant_id, rating, comment, created_at
  `;

  // 4. Read back what the database actually stored — facts, in black and white
  console.log("\nrestaurants table:");
  console.table(restaurants);
  console.log("reviews table:");
  console.table(
    reviews.map((r) => ({
      id: r.id,
      restaurant_id: r.restaurant_id,
      rating: r.rating,
      comment: r.comment,
      created_at: new Date(r.created_at).toLocaleString(),
    }))
  );
  console.log("Setup complete.");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
