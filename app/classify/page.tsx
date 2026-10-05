 "use client";

import { useState } from "react";

export default function ClassifyPage() {
  const [productName, setProductName] = useState("");
  const [retailer, setRetailer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClassify() {
    if (!productName.trim() || !retailer) {
      alert("Please enter a product name and select a retailer.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, retailer })
      });

      const data = await response.json();
      console.log(data);
      alert("Classification API connected. Check the browser console.");
    } catch (error) {
      console.error(error);
      alert("Classification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Product Classification</h1>
          <p className="mt-2 text-slate-500">
            Enter a product and choose the retailer.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block font-medium">Product Name</label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Example: Surf Excel Matic"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Retailer</label>
              <select
                value={retailer}
                onChange={(e) => setRetailer(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
              >
                <option value="">Select retailer</option>
                <option value="Walmart">Walmart</option>
                <option value="Tesco">Tesco</option>
                <option value="Carrefour">Carrefour</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              onClick={handleClassify}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Classifying..." : "Classify Product"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}