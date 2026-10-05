import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApplicationStatus } from "@/types";
import { getApplicationsFromFirestore } from "@/lib/firebase";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    let application = db.getApplicationById(id);

    if (!application) {
      const fsApps = await getApplicationsFromFirestore();
      application = fsApps.find(
        (a) =>
          a.id === id || a.applicationId.toLowerCase() === id.toLowerCase()
      );
    }

    if (!application) {
      return NextResponse.json(
        { error: `Application not found for ID: ${id}` },
        { status: 404 }
      );
    }

    // Ensure medicalProofUrl is set
    application = {
      ...application,
      medicalProofUrl:
        application.medicalProofUrl ||
        application.cloudinaryUrl ||
        application.medicalCertificateUrl,
    };

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve application" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { status, adminRemarks, reviewedBy } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "New status is required." },
        { status: 400 }
      );
    }

    // Require remarks when rejecting or returning for correction as per requirement #16
    if (
      (status === "Reject" ||
        status === "Rejected" ||
        status === "Returned for Correction") &&
      (!adminRemarks || !adminRemarks.trim())
    ) {
      return NextResponse.json(
        {
          error:
            "University policy requires official remarks/reason when rejecting or returning an application.",
        },
        { status: 400 }
      );
    }

    const normalizedStatus: ApplicationStatus =
      status === "Approve" ? "Approved" : status === "Reject" ? "Rejected" : status;

    const updated = db.updateApplicationStatus(
      id,
      normalizedStatus,
      adminRemarks?.trim() || "",
      reviewedBy || "Authorized University Faculty/Admin"
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Application not found to update." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: updated,
      message: `Application status updated to ${normalizedStatus}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update application" },
      { status: 500 }
    );
  }
}
