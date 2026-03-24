import { generateImage } from "ai";
import { fal } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, { status: string; message?: string }> = {};

  // Test fal.ai connectivity
  try {
    const result = await generateImage({
      model: fal.image("fal-ai/flux/schnell"),
      prompt: "a simple blue square",
      size: "256x256",
    });
    results.fal = { status: "ok" };
  } catch (error) {
    results.fal = {
      status: "error",
      message: (error as Error).message,
    };
  }

  // Test Replicate connectivity (just verify the provider initializes — don't generate to save cost)
  try {
    // Import replicate to verify it initializes without error
    const { replicate } = await import("@/lib/ai");
    results.replicate = {
      status: "ok",
      message: "Provider initialized (no generation test to save cost)",
    };
  } catch (error) {
    results.replicate = {
      status: "error",
      message: (error as Error).message,
    };
  }

  const allOk = Object.values(results).every((r) => r.status === "ok");
  return NextResponse.json(
    { status: allOk ? "ok" : "partial", providers: results },
    { status: allOk ? 200 : 207 },
  );
}
