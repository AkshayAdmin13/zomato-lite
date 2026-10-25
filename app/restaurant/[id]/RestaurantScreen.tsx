"use client";

// This component runs in the browser. It asks the backend API for
// everything it shows. It computes nothing.
import { use, useEffect, useState } from "react";
import Link from "next/link";

type RestaurantData = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
  } | null;
  reviews: {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
};

function formatDate(iso: string) {
  // Displaying a date in the user's language is presentation, not math.
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RestaurantScreen({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [notFound, setNotFound] = useState(false);

  // The screen receives the API's response and renders it.
  // It adds nothing, divides nothing, sorts nothing.
  useEffect(() => {
    fetch(`/api/restaurants/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => setRestaurant(data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-6 py-16">
        <p className="text-stone-500">That restaurant does not exist.</p>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-6 py-16">
        <p className="text-stone-400">Loading…</p>
      </main>
    );
  }

  const hasReviews = restaurant.totalReviews > 0;

  return (
    <main className="mx-auto w-full max-w-[560px] px-6 py-16">
      {/* 1. Name, cuisine, area */}
      <h1 className="text-3xl font-semibold tracking-tight">
        {restaurant.name}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {restaurant.cuisine} · {restaurant.area}
      </p>

      {/* 2. The average rating, large — the transmission starts here.

          THE LINE: {restaurant.averageRating}
          Prints 4.5. Prints nothing when it is null. Does no arithmetic.
          The backend computed this number when the page asked for it. */}
      <div className="mt-10 flex items-baseline gap-3">
        <span className="text-6xl font-semibold tracking-tight text-amber-600">
          {hasReviews ? restaurant.averageRating : "—"}
        </span>
        <span className="text-sm text-stone-500">
          {hasReviews ? `${restaurant.totalReviews} reviews` : "No reviews yet"}
        </span>
      </div>

      {/* 3. Latest review, set apart from the rest */}
      {restaurant.latestReview && (
        <article className="mt-10 rounded-lg border border-stone-200 border-l-4 border-l-amber-600 bg-white p-5">
          <p className="text-xs font-medium tracking-wide text-stone-400 uppercase">
            Latest review
          </p>
          <p className="mt-3 text-lg">{restaurant.latestReview.comment}</p>
          <p className="mt-3 text-sm text-stone-500">
            {"★".repeat(restaurant.latestReview.rating)}
            <span className="text-stone-300">
              {"★".repeat(5 - restaurant.latestReview.rating)}
            </span>
            {" · "}
            {formatDate(restaurant.latestReview.createdAt)}
          </p>
        </article>
      )}

      {/* 4. Older reviews, newest first, in a plain list */}
      {restaurant.reviews.length > 0 && (
        <ul className="divide-y divide-stone-200">
          {restaurant.reviews.map((review) => (
            <li key={review.id} className="py-5">
              <p className="text-stone-800">{review.comment}</p>
              <p className="mt-2 text-sm text-stone-500">
                {"★".repeat(review.rating)}
                <span className="text-stone-300">
                  {"★".repeat(5 - review.rating)}
                </span>
                {" · "}
                {formatDate(review.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* 5. Empty state, inviting the first reviewer */}
      {!hasReviews && (
        <div className="mt-10 rounded-lg border border-dashed border-stone-300 p-8 text-center">
          <p className="text-stone-600">
            Nobody has reviewed this place yet.
            <br />
            Be the first.
          </p>
        </div>
      )}

      {/* 6. The link to the review form */}
      <Link
        href={`/review/${id}`}
        className="mt-10 block text-center text-sm font-medium text-amber-700 hover:text-amber-800"
      >
        Write a review →
      </Link>
    </main>
  );
}
