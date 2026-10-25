import { Suspense } from "react";
import RestaurantScreen from "./RestaurantScreen";

// Server-side wrapper: its only job is to paint the instant shell and
// hold a slot open (Suspense) for the data-dependent screen.
export default function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
      <RestaurantScreen params={params} />
    </Suspense>
  );
}
