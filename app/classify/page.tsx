"use client";

import { useState } from "react";

interface ClassificationResult {
  expandedProductName: string;
  departmentCategory: string;
  subCategory: string;
  closestLeafNode: string;
  productTags: string[];
  confidenceScore: string;
  reasonForRecommendation: string;
}

export default function ClassifyPage() {
  const [productName, setProductName] = useState("Surf Excel Matic");
  const [retailer, setRetailer] = useState("Walmart");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const handleClassify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, retailer }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze product");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-6">
        <header className="border-b border-slate-800 pb-3">
          <h1 className="text-xl font-bold tracking-wide text-white">
            Retail Product Classification
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time AI taxonomy resolution across retailers
          </p>
        </header>

        {/* Input Form */}
        <form
          onSubmit={handleClassify}
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg"
        >
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Sony WH-1000XM5, Surf Excel Matic, Nutella 750g..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Retailer
            </label>
            <select
              value={retailer}
              onChange={(e) => setRetailer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
            >
              <option value="Walmart">Walmart</option>
              <option value="Target">Target</option>
              <option value="Amazon">Amazon</option>
              <option value="Carrefour">Carrefour</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? "AI is analyzing taxonomy..." : "Classify Product"}
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Output */}
        {result && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
              Product Classification
            </h2>

            <div>
              <span className="text-xs uppercase text-slate-400 font-semibold block mb-1">
                Expanded Product Name
              </span>
              <p className="text-base font-bold text-white">
                {result.expandedProductName}
              </p>
            </div>

            <div>
              <span className="text-xs uppercase text-slate-400 font-semibold block mb-1">
                Department / Category
              </span>
              <p className="text-sm text-slate-200">
                {result.departmentCategory}
              </p>
            </div>

            <div>
              <span className="text-xs uppercase text-slate-400 font-semibold block mb-1">
                Sub Category
              </span>
              <p className="text-sm text-slate-200">{result.subCategory}</p>
            </div>

            <div>
              <span className="text-xs uppercase text-slate-400 font-semibold block mb-1">
                Closest Leaf Node
              </span>
              <p className="text-sm font-mono font-semibold text-indigo-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {result.closestLeafNode}
              </p>
            </div>

            <div>
              <span className="text-xs uppercase text-slate-400 font-semibold block mb-1.5">
                Product Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.productTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase text-slate-400 font-semibold block mb-1">
                Confidence Score
              </span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {result.confidenceScore}
              </span>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <span className="text-xs uppercase text-slate-400 font-semibold block mb-1">
                Reason for Recommendation
              </span>
              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {result.reasonForRecommendation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
