import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { identifier, password, role } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Please enter your University Email or ID and Password." },
        { status: 400 }
      );
    }

    if (role === "admin") {
      const admin = db.getAdminByEmail(identifier);
      if (!admin) {
        return NextResponse.json(
          { error: "No administrator account found with this email." },
          { status: 401 }
        );
      }
      // Demo password check: accepts demo password or any non-empty password for mock auth
      return NextResponse.json({
        success: true,
        user: admin,
        role: "admin",
      });
    } else {
      // Student login
      const student = db.getStudentById(identifier);
      if (!student) {
        return NextResponse.json(
          { error: "No student found with this University Email or Student ID." },
          { status: 401 }
        );
      }
      return NextResponse.json({
        success: true,
        user: student,
        role: "student",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
