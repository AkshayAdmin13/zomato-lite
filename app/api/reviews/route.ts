import { neon } from "@neondatabase/serverless";
import type { NextRequest } from "next/server";

// This module only ever runs on the server, so it can hold the database
// password. Next.js injects .env.local into process.env. The browser
// never sees this file — it is not part of the client bundle.
const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  // 1. Body must be valid JSON at all
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const { restaurantId, rating, comment } = (body ?? {}) as {
    restaurantId?: unknown;
    rating?: unknown;
    comment?: unknown;
  };

  // 2. rating: a whole number between 1 and 5.
  //    Frontend validation stops honest mistakes; this one stops attackers.
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return Response.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 },
    );
  }

  // 3. comment: non-empty after trimming whitespace.
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return Response.json(
      { error: "Comment must be a non-empty piece of text." },
      { status: 400 },
    );
  }

  // 4. restaurantId must refer to a restaurant that exists.
  //    This is a database lookup — the only check the frontend cannot fake.
  if (typeof restaurantId !== "number" || !Number.isInteger(restaurantId)) {
    return Response.json(
      { error: "Restaurant not found." },
      { status: 400 },
    );
  }
  const found = await sql`SELECT id FROM restaurants WHERE id = ${restaurantId}`;
  if (found.length === 0) {
    return Response.json(
      { error: "Restaurant not found." },
      { status: 400 },
    );
  }

  // 5. Insert exactly one fact-row. The database's own CHECK constraint
  //    (rating BETWEEN 1 AND 5, in db/schema.sql) backs this up again.
  try {
    const rows = await sql`
      INSERT INTO reviews (restaurant_id, rating, comment)
      VALUES (${restaurantId}, ${rating}, ${comment.trim()})
      RETURNING id
    `;
    return Response.json({ success: true, reviewId: rows[0].id }, { status: 201 });
  } catch (err) {
    // Belt: our checks. Braces: the database constraint. Never trust one alone.
    return Response.json(
      { error: err instanceof Error ? err.message : "Could not save review." },
      { status: 400 },
    );
  }
}
