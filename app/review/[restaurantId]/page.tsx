import { Suspense } from "react";
import ReviewForm from "./ReviewForm";

// Server-side wrapper: paints the instant shell, holds a slot for the form.
export default function ReviewPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 text-stone-900">
          <main className="mx-auto w-full max-w-[560px] px-6 py-16">
            <p className="text-stone-400">Loading…</p>
          </main>
        </div>
      }
    >
      <ReviewForm params={params} />
    </Suspense>
  );
}
