import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const students = db.getStudents();
    const apps = db.getApplications();

    // Augment students with their application count and latest leave status
    const studentData = students.map((s) => {
      const studentApps = apps.filter(
        (a) => a.studentId.toLowerCase() === s.studentId.toLowerCase() || a.studentDbId === s.id
      );
      const totalLeaves = studentApps.reduce((acc, a) => acc + (a.status === "Approved" ? a.numberOfDays : 0), 0);
      return {
        ...s,
        totalApplications: studentApps.length,
        approvedApplications: studentApps.filter((a) => a.status === "Approved").length,
        totalApprovedDays: totalLeaves,
        latestStatus: studentApps[0]?.status || "None",
      };
    });

    return NextResponse.json({ success: true, students: studentData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load students" },
      { status: 500 }
    );
  }
}
