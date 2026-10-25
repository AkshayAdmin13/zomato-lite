"use client";

// This component runs in the browser. Interactive by need: the star picker,
// the comment box, the disabled submit. Logic and validation live in the
// backend; the only checks here are kind ones (enable the button etc.).
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ReviewForm({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = use(params);
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The restaurant's name comes from the backend, like everything else
  // this screen shows. The dining room does not look in the pantry.
  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        setRestaurantName(data.name);
        setImageUrl(data.imageUrl);
      })
      .catch(() => setLoadError("That restaurant does not exist."));
  }, [restaurantId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === null || comment.trim().length === 0 || submitting) return;

    setSubmitting(true);
    setError(null);

    // Hand three things to the backend, then step back (per the contract).
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: Number(restaurantId),
        rating,
        comment,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      // Success: go see the page that recomputes the average.
      router.push(`/restaurant/${restaurantId}`);
    } else {
      // 400: display exactly what the backend said. We do not invent.
      setError(data.error);
    }
  }

  const canSubmit = rating !== null && comment.trim().length > 0;

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-6 py-16">
        <p className="text-stone-500">{loadError}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[560px] px-6 py-16">
      <div className="flex items-center gap-3">
        {imageUrl && (
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-stone-200">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            {restaurantName ?? "Loading…"}
          </h1>
          <p className="mt-2 text-stone-600">What did you think of it?</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-10">
        <fieldset>
          <legend className="text-sm font-medium text-stone-700">
            Your rating
          </legend>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                onClick={() => setRating(star)}
                className={`cursor-pointer text-2xl transition-colors ${
                  rating !== null && star <= rating
                    ? "text-amber-600"
                    : "text-stone-300 hover:text-amber-400"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>

        <label
          htmlFor="comment"
          className="mt-8 block text-sm font-medium text-stone-700"
        >
          Your comment
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="How was it?"
          className="mt-3 block w-full resize-none rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none focus:border-amber-600"
        />

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="mt-8 w-full rounded-lg bg-stone-900 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </main>
  );
}
