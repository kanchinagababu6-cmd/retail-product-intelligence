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

    // 1. Fetch available models directly from your Groq account
    let selectedModel = "openai/gpt-oss-20b";
    try {
      const modelListRes = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${groqKey}` },
      });

      if (modelListRes.ok) {
        const modelData = await modelListRes.json();
        const availableIds: string[] = (modelData.data || [])
          .map((m: any) => m.id)
          .filter((id: string) => !id.includes("whisper") && !id.includes("guard"));

        // Prefer fast chat models that are active right now
        const match =
          availableIds.find((id) => id.includes("gpt-oss-20b")) ||
          availableIds.find((id) => id.includes("qwen")) ||
          availableIds.find((id) => id.includes("120b")) ||
          availableIds[0];

        if (match) {
          selectedModel = match;
        }
      }
    } catch {
      // If listing fails, proceed with default candidate
    }

    const systemPrompt = `You are an expert E-Commerce Catalog Taxonomist.
Classify the product string according to the real-world catalog taxonomy of "${retailer}".
Never invent generic placeholders. Determine the real commercial product name, department, subcategory, leaf node, tags, and reason.

Respond ONLY with a valid JSON object matching this schema:
{
  "expandedProductName": "Standardized title with brand, pack size, and volume/format",
  "departmentCategory": "Realistic department / top category for ${retailer}",
  "subCategory": "Realistic subcategory for ${retailer}",
  "closestLeafNode": "The most specific leaf node in the hierarchy",
  "productTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidenceScore": "96%",
  "reasonForRecommendation": "Detailed sentence explaining the semantic classification logic and retail catalog mapping."
}`;

    // 2. Query Groq Chat Completions
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
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
      throw new Error(`Groq API (${selectedModel}) returned ${res.status}: ${errText}`);
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
