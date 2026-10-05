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

    const systemInstruction = `You are a real-world enterprise retail catalog taxonomy engine.
Analyze the given product and classify it accurately according to the active catalog taxonomy structure of "${retailer}".
Never invent generic placeholders like "Commercial Pack" or "General Goods". Always identify the real-world brand, category, subcategory, and leaf node.

Output strictly valid JSON with this exact schema:
{
  "expandedProductName": "Full descriptive title with brand, model/flavor/scent, format and quantity/size",
  "departmentCategory": "Realistic department / top category for ${retailer}",
  "subCategory": "Realistic subcategory for ${retailer}",
  "closestLeafNode": "The most specific leaf node in the hierarchy",
  "productTags": ["brand-tag", "category-tag", "attribute-tag", "retailer-tag", "form-tag"],
  "confidenceScore": "96%",
  "reasonForRecommendation": "Detailed sentence explaining the semantic classification logic and retail catalog mapping."
}`;

    const promptText = `Product to classify: "${productName}"\nTarget Retailer: "${retailer}"`;

    // Attempt 1: Modern Interactions API
    let jsonResult = null;
    let apiErrorMessage = "";

    try {
      const interactionRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gemini-3.8-flash",
            input: `${systemInstruction}\n\n${promptText}`,
          }),
        }
      );

      if (interactionRes.ok) {
        const iData = await interactionRes.json();
        const text = iData.output_text || iData.text || iData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          jsonResult = JSON.parse(clean);
        }
      } else {
        const errText = await interactionRes.text();
        apiErrorMessage = `Interactions error (${interactionRes.status}): ${errText}`;
      }
    } catch (e: any) {
      apiErrorMessage = e.message;
    }

    // Attempt 2: Direct generateContent endpoint with gemini-3.8-flash
    if (!jsonResult) {
      try {
        const genRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemInstruction}\n\n${promptText}` }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
              },
            }),
          }
        );

        if (genRes.ok) {
          const gData = await genRes.json();
          const raw = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
            jsonResult = JSON.parse(clean);
          }
        } else {
          const errText = await genRes.text();
          apiErrorMessage = `generateContent error (${genRes.status}): ${errText}`;
        }
      } catch (e: any) {
        apiErrorMessage = e.message;
      }
    }

    // If AI fails, report the direct API reason instead of disguising it as a generic product
    if (!jsonResult) {
      return NextResponse.json(
        { error: `AI Classification failed: ${apiErrorMessage}` },
        { status: 502 }
      );
    }

    return NextResponse.json(jsonResult);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process classification" },
      { status: 500 }
    );
  }
}
