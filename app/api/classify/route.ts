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
        { error: "GEMINI_API_KEY is missing in Vercel environment variables." },
        { status: 500 }
      );
    }

    const prompt = `
You are an expert E-Commerce Catalog Taxonomist.
Classify the following product specifically according to the real-world taxonomy conventions of "${retailer}".

Product query: "${productName}"

Return ONLY valid JSON matching this exact structure:
{
  "expandedProductName": "Commercial standard full title with format and pack size",
  "departmentCategory": "Department / Category name for ${retailer}",
  "subCategory": "Subcategory for ${retailer}",
  "closestLeafNode": "The most specific leaf node in the hierarchy",
  "productTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidenceScore": "94%",
  "reasonForRecommendation": "Clear explanation of why this product belongs in this leaf node based on brand, vehicle, compatibility, and format."
}
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI API failed: ${errBody}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("No text content returned from AI API.");
    }

    const result = JSON.parse(rawText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to classify product" },
      { status: 500 }
    );
  }
}
