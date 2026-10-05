import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const template = db.getTemplate();
    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load template" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = db.updateTemplate(body);
    return NextResponse.json({
      success: true,
      template: updated,
      message: "University medical leave template successfully updated.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update template" },
      { status: 500 }
    );
  }
}
