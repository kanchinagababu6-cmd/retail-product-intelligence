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

    // 1. Fetch available models from Groq account
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

        if (match) {
          selectedModel = match;
        }
      }
    } catch {
      // Fallback to default
    }

    // Specialized retail taxonomy & POS abbreviation decoding instructions
    const systemPrompt = `You are a Principal Retail Catalog Architect and Enterprise POS (Point of Sale) Data Specialist.

Your task is to decipher raw, abbreviated retail item descriptions (receipt strings, warehouse abbreviations, truncated SKU titles) and map them to the official taxonomy of "${retailer}".

DECODING INSTRUCTIONS:
1. De-abbreviate retail tokens carefully:
   - "POU" = Pouch / Pour
   - "SPKLE" = Sparkle / Sparkling
   - "COS" = Cosmetic / Cosmetics / Costume
   - "SMG" = Smiggle / Small Goods / Shimmer
   - "RHOLG" / abbreviations = check for brand, variant, or packaging codes.
2. NEVER guess unrelated terms (do not turn "MM" into sports drinks or random books).
3. If an abbreviation is ambiguous, deduce the most statistically probable consumer product in "${retailer}".
4. Output realistic catalog categories: Top Department, Subcategory, and a clean hierarchical Leaf Node.

Respond ONLY with valid JSON (no markdown formatting, no code blocks):
{
  "expandedProductName": "Accurately deciphered and spelled-out commercial title with format/type",
  "departmentCategory": "Official store department for ${retailer}",
  "subCategory": "Relevant subcategory in ${retailer}",
  "closestLeafNode": "Specific leaf node path (e.g. Beauty > Makeup Bags & Cases > Sparkle Pouches)",
  "productTags": ["brand-or-type", "category", "material-or-flavor", "feature", "retailer"],
  "confidenceScore": "92%",
  "reasonForRecommendation": "Explain the token-by-token de-abbreviation logic and why it belongs in this exact leaf node."
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
          { role: "user", content: `Product Query: "${productName}"\nRetailer: "${retailer}"` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.0, // Zero temperature prevents random creative hallucinations
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
