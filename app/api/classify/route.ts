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
        { error: "GROQ_API_KEY is not defined in Vercel." },
        { status: 500 }
      );
    }

    // Dynamic model identification from your Groq account
    let selectedModel = "llama-3.1-8b-instant";
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

    const systemPrompt = `You are a Principal Retail Catalog Architect and Enterprise POS receipt de-abbreviation engine.
Analyze the given product string and classify it according to the real-world catalog hierarchy of "${retailer}".

DECODING INSTRUCTIONS:
- Decode store abbreviations (e.g. CM = Central Market, BEL AR RNCH = Bel Air Ranch, BI = Bone-In, PRK CHP = Pork Chop, SS = Seasoned / Single Serve, POU = Pouch, SPKLE = Sparkle).
- Output accurate store categories: Department, Subcategory, and specific Leaf Node.

OUTPUT RULE:
Return ONLY a raw JSON object. Do not include markdown codeblocks (\`\`\`json), explanations, or introduction.
{
  "expandedProductName": "Commercial standardized product title with cut, brand, and type",
  "departmentCategory": "Official store department for ${retailer}",
  "subCategory": "Relevant subcategory in ${retailer}",
  "closestLeafNode": "Specific leaf node path in ${retailer}",
  "productTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidenceScore": "95%",
  "reasonForRecommendation": "Explain the decoded abbreviation tokens and why it belongs in this exact leaf node."
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
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Extract the JSON block safely even if the LLM wraps it in markdown backticks
    const firstBrace = rawContent.indexOf("{");
    const lastBrace = rawContent.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error(`Failed to extract JSON from AI response: ${rawContent}`);
    }

    const cleanJson = rawContent.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to classify product" },
      { status: 500 }
    );
  }
}
