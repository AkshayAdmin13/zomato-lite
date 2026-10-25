import { neon } from "@neondatabase/serverless";
import type { NextRequest } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

type ReviewRecord = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string; // ISO 8601, e.g. "2026-10-23T09:30:00.000Z"
};

// The three answers this endpoint exists to compute, from stored facts only:
//   averageRating -> AVG(rating)      computed fresh on every page load
//   totalReviews  -> COUNT(*)         computed fresh on every page load
//   latestReview  -> newest by created_at, take one
// There is no average_rating column and no latest_review column — those are
// answers, not facts, and answers must never be stored. Facts never age;
// stored answers go stale the moment the next review arrives.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Dynamic route: [id] is whatever the URL had, as a string. Await the promise.
  const { id: rawId } = await params;
  const restaurantId = Number(rawId);
  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return Response.json(
      { error: "Restaurant not found." },
      { status: 404 },
    );
  }

  // 1. The restaurant itself
  const restaurant = await sql`
    SELECT id, name, cuisine, area, image_url
    FROM restaurants
    WHERE id = ${restaurantId}
  `;
  if (restaurant.length === 0) {
    return Response.json(
      { error: "Restaurant not found." },
      { status: 404 },
    );
  }

  // 2. The two computed numbers — see them with your own eyes
  const stats = await sql`
    SELECT COUNT(*)::int AS total, AVG(rating) AS average
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
  `;
  const totalReviews = stats[0].total as number; // COUNT(*), 0 when no rows
  const averageRaw = stats[0].average; // AVG returns null when no rows
  // Round to one decimal place, in the backend — e.g. 4.333... -> 4.3
  const averageRating =
    averageRaw == null ? null : Math.round(Number(averageRaw) * 10) / 10;

  // 3. Every review, newest first. Row 1 is the latest review; the rest
  //    are the older list — the page shows the latest one separately,
  //    so we hand it over once rather than printing it twice.
  const rows = await sql`
    SELECT id, rating, comment, created_at
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC
  `;
  const reviews: ReviewRecord[] = rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
  }));

  // Response shape mirrors the screen: name, big number, latest card, list.
  return Response.json({
    name: restaurant[0].name,
    cuisine: restaurant[0].cuisine,
    area: restaurant[0].area,
    imageUrl: restaurant[0].image_url ?? null,
    averageRating,
    totalReviews,
    latestReview: reviews.length > 0 ? reviews[0] : null,
    reviews: reviews.slice(1),
  });
}
