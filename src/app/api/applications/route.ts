import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadProofToCloudinary } from "@/lib/cloudinary";
import { saveApplicationToFirebase, getApplicationsFromFirestore } from "@/lib/firebase";
import { MedicalLeaveApplication } from "@/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const semester = searchParams.get("semester");
    const query = searchParams.get("q");

    // Fetch from Firestore and Local DB
    const firestoreApps = await getApplicationsFromFirestore();
    let localApps = studentId
      ? db.getApplicationsByStudentId(studentId)
      : db.getApplications();

    // Merge Firestore documents with local records
    const map = new Map<string, MedicalLeaveApplication>();
    for (const app of localApps) {
      const key = app.applicationId || app.id;
      map.set(key, {
        ...app,
        medicalProofUrl: app.medicalProofUrl || app.cloudinaryUrl || app.medicalCertificateUrl,
      });
    }

    for (const fApp of firestoreApps) {
      const key = fApp.applicationId || fApp.id;
      const existing = map.get(key);
      map.set(key, {
        ...(existing || {}),
        ...fApp,
        medicalProofUrl: fApp.medicalProofUrl || fApp.cloudinaryUrl || fApp.medicalCertificateUrl,
      });
    }

    let apps = Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    if (studentId) {
      apps = apps.filter(
        (a) =>
          a.studentId.toLowerCase() === studentId.toLowerCase() ||
          a.studentDbId === studentId
      );
    }

    if (status && status !== "All") {
      apps = apps.filter(
        (a) => a.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (department && department !== "All") {
      apps = apps.filter(
        (a) => a.department.toLowerCase() === department.toLowerCase()
      );
    }

    if (semester && semester !== "All") {
      apps = apps.filter(
        (a) => a.semester.toLowerCase() === semester.toLowerCase()
      );
    }

    if (query) {
      const q = query.toLowerCase();
      apps = apps.filter(
        (a) =>
          (a.applicationId && a.applicationId.toLowerCase().includes(q)) ||
          (a.studentName && a.studentName.toLowerCase().includes(q)) ||
          (a.studentId && a.studentId.toLowerCase().includes(q)) ||
          (a.reason && a.reason.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, applications: apps });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Field Validations
    if (!body.studentName?.trim()) {
      return NextResponse.json({ error: "Please enter your Full Name." }, { status: 400 });
    }
    if (!body.studentId?.trim()) {
      return NextResponse.json({ error: "Please enter your Student ID." }, { status: 400 });
    }
    if (!body.email?.trim() || !body.email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid university email address." }, { status: 400 });
    }
    if (!body.phone?.trim() || body.phone.length < 10) {
      return NextResponse.json({ error: "Please enter a valid mobile contact number." }, { status: 400 });
    }
    if (!body.parentName?.trim()) {
      return NextResponse.json({ error: "Please enter your Father's Name as per university records." }, { status: 400 });
    }
    if (!body.startDate) {
      return NextResponse.json({ error: "Please select leave start date." }, { status: 400 });
    }
    if (!body.endDate) {
      return NextResponse.json({ error: "Please select leave end date." }, { status: 400 });
    }

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format provided." }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json(
        { error: "End date cannot be earlier than start date." },
        { status: 400 }
      );
    }

    // Calculate number of inclusive days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (!body.reason?.trim() || body.reason.length < 5) {
      return NextResponse.json(
        { error: "Please provide a detailed medical reason for leave." },
        { status: 400 }
      );
    }
    if (!body.doctorName?.trim()) {
      return NextResponse.json(
        { error: "Please enter the consulting Doctor or Hospital name." },
        { status: 400 }
      );
    }
    if (!body.consultationDate) {
      return NextResponse.json(
        { error: "Please provide the medical consultation date." },
        { status: 400 }
      );
    }
    if (!body.medicalCertificateUrl) {
      return NextResponse.json(
        { error: "Please upload your medical certificate document (PDF, JPG, PNG)." },
        { status: 400 }
      );
    }
    if (!body.declarationAccepted) {
      return NextResponse.json(
        { error: "You must accept the truthfulness declaration before submitting." },
        { status: 400 }
      );
    }

    // Upload medical proof file to Cloudinary (Temporary Storage)
    let cloudinaryDetails: {
      publicId?: string;
      url?: string;
      resourceType?: string;
      originalName?: string;
      uploadedAt?: string;
    } = {};

    const tempAppId = `DAV-MED-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    if (body.medicalCertificateUrl) {
      try {
        const uploadRes = await uploadProofToCloudinary(
          body.medicalCertificateUrl,
          body.medicalCertificateName || "Medical_Certificate.pdf",
          tempAppId
        );
        cloudinaryDetails = {
          publicId: uploadRes.publicId,
          url: uploadRes.secureUrl || uploadRes.url,
          resourceType: uploadRes.resourceType,
          originalName: uploadRes.originalName,
          uploadedAt: uploadRes.uploadedAt,
        };
      } catch (uploadErr) {
        console.warn("Cloudinary upload failed, keeping original document reference:", uploadErr);
      }
    }

    // Save to database
    const application = db.createApplication({
      studentDbId: body.studentDbId || "std-external",
      studentId: body.studentId.trim(),
      studentName: body.studentName.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      program: body.program || "Bachelor of Technology",
      department: body.department || "School of Engineering & Technology",
      semester: body.semester || "1st Semester",
      section: body.section || "A",
      academicSession: body.academicSession || "2026-2027",
      parentName: body.parentName?.trim() || "",
      leaveType: "Medical Leave",
      startDate: body.startDate,
      endDate: body.endDate,
      numberOfDays,
      reason: body.reason.trim(),
      applicationDate: body.applicationDate || new Date().toISOString().split("T")[0],
      doctorName: body.doctorName.trim(),
      consultationDate: body.consultationDate,
      treatmentDetails: body.treatmentDetails?.trim() || "",
      medicalCertificateName: body.medicalCertificateName || "Medical_Certificate.pdf",
      medicalCertificateUrl: cloudinaryDetails.url || body.medicalCertificateUrl,
      medicalProofUrl: cloudinaryDetails.url || body.medicalCertificateUrl,
      medicalCertificateSize: body.medicalCertificateSize || "300 KB",
      declarationAccepted: true,
      status: "Submitted",
      adminRemarks: "",

      // Firebase & Faculty PC Synchronization Fields
      syncStatus: "PENDING_SYNC",
      cloudinaryPublicId: cloudinaryDetails.publicId,
      cloudinaryUrl: cloudinaryDetails.url,
      cloudinaryResourceType: cloudinaryDetails.resourceType,
      cloudinaryOriginalName: cloudinaryDetails.originalName,
      cloudinaryUploadedAt: cloudinaryDetails.uploadedAt,
      cloudinaryDeleted: false,

      submittedAt: new Date().toISOString(),
    });

    // Permanently record in Firebase Firestore (Source of Truth)
    await saveApplicationToFirebase(application);

    return NextResponse.json({
      success: true,
      application,
      message: "Medical leave application submitted successfully!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit medical leave application" },
      { status: 500 }
    );
  }
}
