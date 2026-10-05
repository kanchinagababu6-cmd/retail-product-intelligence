import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { productName, retailer } = await req.json();

    if (!productName || !retailer) {
      return NextResponse.json(
        { error: "Product name and retailer are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in Vercel." },
        { status: 500 }
      );
    }

    const prompt = `
You are a retail catalog taxonomist for "${retailer}".
Classify this specific product: "${productName}"

Return ONLY a single valid JSON object with no markdown formatting or backticks:
{
  "expandedProductName": "Accurate descriptive commercial name with brand, format, and volume/weight",
  "departmentCategory": "Primary department and category for ${retailer}",
  "subCategory": "Accurate subcategory for ${retailer}",
  "closestLeafNode": "The most specific leaf node in ${retailer}'s catalog taxonomy",
  "productTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidenceScore": "94%",
  "reasonForRecommendation": "Clear explanation based on product characteristics, ingredients, format, and ${retailer}'s hierarchy."
}
`;

    // Priority order of models to bypass single-model 503 traffic spikes
    const candidateModels = [
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-3.8-flash",
    ];

    let aiResult = null;
    let lastError = "";

    for (const model of candidateModels) {
      try {
        // Test standard v1 first, then v1beta
        for (const apiVersion of ["v1", "v1beta"]) {
          const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1 },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
              aiResult = JSON.parse(cleaned);
              break;
            }
          } else {
            const errText = await res.text();
            lastError = `[${model}/${apiVersion}] ${errText}`;
          }
        }

        if (aiResult) break;
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!aiResult) {
      return NextResponse.json(
        { error: `All AI models temporarily busy. Last response: ${lastError}` },
        { status: 503 }
      );
    }

    return NextResponse.json(aiResult);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process classification" },
      { status: 500 }
    );
  }
}
