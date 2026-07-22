import { NextRequest, NextResponse } from "next/server";
import { processGenerationSteps } from "@/lib/generation/runner";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  return NextResponse.json(await processGenerationSteps(Number(process.env.GENERATION_STEPS_PER_RUN ?? 3)), { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) { return POST(request); }

