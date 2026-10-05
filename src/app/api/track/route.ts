import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Mode 1: Student Identity Verification (Registration No, Student Name, Father's Name)
    if (body.registrationNumber || body.studentName || body.fatherName) {
      const regNo = (body.registrationNumber || body.studentId || "").trim();
      const sName = (body.studentName || "").trim();
      const fName = (body.fatherName || "").trim();

      if (!regNo) {
        return NextResponse.json(
          { error: "Please enter your Student Registration Number / Roll No." },
          { status: 400 }
        );
      }
      if (!sName) {
        return NextResponse.json(
          { error: "Please enter your Full Student Name." },
          { status: 400 }
        );
      }
      if (!fName) {
        return NextResponse.json(
          { error: "Please enter your Father's Name as per university records." },
          { status: 400 }
        );
      }

      const result = db.getApplicationsByStudentVerification(regNo, sName, fName);

      if (!result.applications || result.applications.length === 0) {
        return NextResponse.json(
          {
            error: `No medical leave applications found for Registration No "${regNo}" under student "${sName}" and Father's Name "${fName}". Please check your details or submit a new application.`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        mode: "student",
        student: result.student,
        applications: result.applications,
      });
    }

    // Mode 2: Direct Application ID Lookup
    const { applicationId, studentId } = body;

    if (!applicationId?.trim()) {
      return NextResponse.json(
        { error: "Please provide either your Registration Number, Name and Father's Name, or an Application ID." },
        { status: 400 }
      );
    }

    const app = db.getApplicationById(applicationId.trim());

    if (!app) {
      return NextResponse.json(
        {
          error: `No medical leave record found matching "${applicationId}". Please verify your Application ID.`,
        },
        { status: 404 }
      );
    }

    if (
      studentId &&
      studentId.trim() &&
      app.studentId.toLowerCase() !== studentId.trim().toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            "Student ID does not match the record on file for this Application ID.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: "application",
      application: app,
      applications: [app],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to track application" },
      { status: 500 }
    );
  }
}
