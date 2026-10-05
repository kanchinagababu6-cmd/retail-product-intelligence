import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  productName: z.string().min(1),
  retailer: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid product or retailer." },
        { status: 400 }
      );
    }

    const { productName, retailer } = parsed.data;

    return NextResponse.json({
      success: true,
      message: "Classification endpoint is ready.",
      input: {
        productName,
        retailer
      },
      result: {
        expandedProductName: productName,
        department: "Pending AI classification",
        category: "Pending",
        subCategory: "Pending",
        closestLeafNode: {
          id: "",
          name: "Pending taxonomy match",
          path: ""
        },
        tags: [],
        confidenceScore: 0,
        reason: "AI classification will be connected after Firebase and AI configuration.",
        alternatives: [],
        requiresHumanReview: true
      }
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 500 }
    );
  }
}