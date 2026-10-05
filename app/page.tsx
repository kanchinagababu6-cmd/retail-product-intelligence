import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl text-center">
        <div className="mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
            RP
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Retail Product Intelligence
        </h1>

        <p className="mt-3 text-slate-600">
          AI-powered product classification and retailer taxonomy search.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}