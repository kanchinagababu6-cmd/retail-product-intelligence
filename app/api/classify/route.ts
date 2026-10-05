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

    // Direct fetch to Gemini REST API (no extra dependencies required)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
You are an expert E-Commerce Catalog Taxonomist.
Classify the following product specifically according to the taxonomy conventions of the retailer "${retailer}".

Product query: "${productName}"

Return ONLY valid JSON matching this exact structure:
{
  "expandedProductName": "Commercial standard full title with format/pack size",
  "departmentCategory": "Department / Category name for ${retailer}",
  "subCategory": "Subcategory for ${retailer}",
  "closestLeafNode": "The most specific leaf node in the hierarchy",
  "productTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidenceScore": "e.g. 94%",
  "reasonForRecommendation": "Detailed sentence explaining why this product belongs in this leaf node based on brand, vehicle, compatibility, and format."
}
`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API failed: ${errText}`);
    }

    const data = await response.json();
    const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const result = JSON.parse(parsedText);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to classify product" },
      { status: 500 }
    );
  }
}
  
