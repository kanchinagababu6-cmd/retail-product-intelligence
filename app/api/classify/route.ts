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

    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in Vercel." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert E-Commerce Catalog Taxonomist.
Your job is to analyze any product string and classify it according to the real-world catalog taxonomy of "${retailer}".
Never invent generic placeholders. Determine the real commercial product name, department, subcategory, leaf node, and tags.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "expandedProductName": "Standardized title with brand, pack size, and volume/format",
  "departmentCategory": "Realistic department / top category for ${retailer}",
  "subCategory": "Realistic subcategory for ${retailer}",
  "closestLeafNode": "The most specific leaf node in the hierarchy",
  "productTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidenceScore": "96%",
  "reasonForRecommendation": "Detailed sentence explaining the semantic classification logic and retail catalog mapping."
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Product: "${productName}"\nRetailer: "${retailer}"` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Classification failed" },
      { status: 500 }
    );
  }
}
