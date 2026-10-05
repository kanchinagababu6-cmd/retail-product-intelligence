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
        { error: "GEMINI_API_KEY is missing in Vercel settings." },
        { status: 500 }
      );
    }

    const prompt = `
You are an expert E-Commerce Retail Taxonomist.
Accurately analyze and classify this product based on the real-world catalog taxonomy of "${retailer}".

Product: "${productName}"

Classify this product into its real category, subcategory, and leaf node. Return ONLY a single raw JSON object (no markdown, no backticks):
{
  "expandedProductName": "Standardized title with brand, pack size, and format",
  "departmentCategory": "Accurate department / category in ${retailer}",
  "subCategory": "Accurate subcategory in ${retailer}",
  "closestLeafNode": "Specific leaf node path in ${retailer}",
  "productTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidenceScore": "95%",
  "reasonForRecommendation": "Explain why this item belongs in this leaf node based on brand, ingredients, vehicle, and retail category."
}
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    let response: Response | null = null;
    let data: any = null;

    // Retry loop (up to 3 attempts with brief backoff for temporary 503 capacity spikes)
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      });

      data = await response.json();

      if (response.ok) {
        break;
      }

      // If overloaded (503), wait 1 second before retrying
      if (response.status === 503 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      } else {
        break;
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Google AI error occurred" },
        { status: response ? response.status : 500 }
      );
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please retry." },
        { status: 500 }
      );
    }

    // Clean JSON wrappers
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Classification failed" },
      { status: 500 }
    );
  }
}
