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
        { error: "GROQ_API_KEY is not defined in Vercel Environment Variables." },
        { status: 500 }
      );
    }

    // Dynamic model discovery from your active Groq account
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

        const match =
          availableIds.find((id) => id.includes("gpt-oss-20b")) ||
          availableIds.find((id) => id.includes("qwen")) ||
          availableIds.find((id) => id.includes("120b")) ||
          availableIds[0];

        if (match) selectedModel = match;
      }
    } catch {
      // Continue with default
    }

    const systemPrompt = `You are a Principal E-Commerce Retail Catalog Taxonomist and POS receipt abbreviation decoder.
Accurately decode and classify the given retail query according to the real-world catalog hierarchy of "${retailer}".
De-abbreviate store tokens (e.g. HDB = Headband, WEST = Western, SUM = Summer, ASST = Assortment, POU = Pouch, SPKLE = Sparkle, MM = Member's Mark or Minnie Mouse).

Output strictly valid JSON matching this schema:
{
  "expandedProductName": "Fully decoded standard title with brand, style, and pack details",
  "departmentCategory": "Official store department for ${retailer}",
  "subCategory": "Relevant subcategory in ${retailer}",
  "closestLeafNode": "Specific leaf node path in ${retailer}",
  "productTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidenceScore": "94%",
  "reasonForRecommendation": "Clear explanation of how the tokens were decoded and why they map to this leaf node."
}`;

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
      return NextResponse.json(
        { error: `Groq error (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { error: "Groq returned an empty response." },
        { status: 500 }
      );
    }

    return NextResponse.json(JSON.parse(rawContent));
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to classify product" },
      { status: 500 }
    );
  }
}
