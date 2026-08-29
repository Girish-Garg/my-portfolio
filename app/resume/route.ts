import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const resumeUrl = process.env.RESUME_URL;

  if (!resumeUrl) {
    return NextResponse.json(
      { error: "Resume link is not configured." },
      { status: 503 },
    );
  }

  try {
    const destination = new URL(resumeUrl);
    if (destination.protocol !== "https:") throw new Error("Invalid protocol");
    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.json(
      { error: "Resume link is not configured correctly." },
      { status: 503 },
    );
  }
}