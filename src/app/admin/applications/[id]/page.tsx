"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MedicalLeaveApplication, AdminUser, ApplicationStatus } from "@/types";
import { ApplicationLetter } from "@/components/application/ApplicationLetter";
import { ApplicationTimeline } from "@/components/application/ApplicationTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/templateEngine";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Download,
  Printer,
  FileText,
  User,
  Calendar,
  Stethoscope,
  AlertCircle,
  ShieldCheck,
  HardDrive,
} from "lucide-react";

export default function AdminApplicationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, role } = useAuth();
  const admin = role === "admin" ? (user as AdminUser) : null;

  const [application, setApplication] = useState<MedicalLeaveApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"review" | "letter" | "certificate" | "timeline">("review");

  // Decision Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    targetStatus: ApplicationStatus | null;
    title: string;
    description: string;
    remarks: string;
    isMandatoryRemarks: boolean;
    error?: string;
  }>({
    isOpen: false,
    targetStatus: null,
    title: "",
    description: "",
    remarks: "",
    isMandatoryRemarks: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (data.success) {
        setApplication(data.application);
      }
    } catch (err) {
      console.error("Failed to load application:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferLocally = async () => {
    if (!application || !admin) return;
    setIsTransferring(true);
    setTransferError(null);
    try {
      const res = await fetch("/api/admin/sync-medical-proofs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-uid": admin.id,
        },
        body: JSON.stringify({ applicationId: application.applicationId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to transfer proof to local PC");
      }
      await loadApplication();
    } catch (err: any) {
      setTransferError(err?.message || "Failed to transfer proof locally");
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (id) loadApplication();
  }, [id]);

  const handleOpenAction = (targetStatus: ApplicationStatus) => {
    let title = `Update Status to ${targetStatus}`;
    let description = "Please review before updating application status.";
    let isMandatory = false;

    if (targetStatus === "Approved") {
      title = "Sanction & Approve Medical Leave";
      description =
        "This will approve the student's leave for the requested duration and issue an official university condonation record.";
      isMandatory = false;
    } else if (targetStatus === "Rejected") {
      title = "Reject Medical Leave Application";
      description =
        "University regulations require providing clear official grounds and reasons for rejecting this application.";
      isMandatory = true;
    } else if (targetStatus === "Returned for Correction") {
      title = "Return to Student for Correction";
      description =
        "Specify what documentation or clarification the student must supply (e.g., missing doctor seal, OPD slip, lab report).";
      isMandatory = true;
    } else if (targetStatus === "Under Review") {
      title = "Mark Under Clinical / HOD Review";
      description =
        "Forward this application for secondary verification by the University Medical Center or Dean's Committee.";
      isMandatory = false;
    }

    setActionModal({
      isOpen: true,
      targetStatus,
      title,
      description,
      remarks: "",
      isMandatoryRemarks: isMandatory,
    });
  };

  const handleConfirmDecision = async () => {
    if (!actionModal.targetStatus) return;

    if (actionModal.isMandatoryRemarks && !actionModal.remarks.trim()) {
      setActionModal((prev) => ({
        ...prev,
        error: "Remarks/grounds are required for this action as per university policy.",
      }));
      return;
    }

    try {
      setIsProcessing(true);
      const reviewerName = admin ? `${admin.name} (${admin.role})` : "Dean / Head of Department";

      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionModal.targetStatus,
          adminRemarks: actionModal.remarks.trim(),
          reviewedBy: reviewerName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      setApplication(data.application);
      setActionModal({
        isOpen: false,
        targetStatus: null,
        title: "",
        description: "",
        remarks: "",
        isMandatoryRemarks: false,
      });
    } catch (err: any) {
      setActionModal((prev) => ({ ...prev, error: err.message }));
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Loading application details for review...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900">Application Not Found</h2>
        <Link
          href="/admin/applications"
          className="mt-4 inline-block px-4 py-2 text-xs font-bold text-white bg-davu-navy-800 rounded-lg"
        >
          Back to Applications List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to All Applications
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Current Status:</span>
          <StatusBadge status={application.status} size="md" />
        </div>
      </div>

      {/* Main Review Card Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-davu-red-600 uppercase tracking-wider">
                Official Review Desk
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-400">
                Submitted: {formatDate(application.submittedAt)}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {application.applicationId}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Student:{" "}
              <strong className="text-slate-900">{application.studentName}</strong> (
              {application.studentId}) • {application.program}
            </p>
          </div>

          {/* Administrative Decision Buttons (Requirement #17) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenAction("Approved")}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Leave
            </button>

            <button
              type="button"
              onClick={() => handleOpenAction("Returned for Correction")}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Return for Correction
            </button>

            <button
              type="button"
              onClick={() => handleOpenAction("Rejected")}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>

            <button
              type="button"
              onClick={() => handleOpenAction("Under Review")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              Under Review
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
          {[
            { id: "review", label: "Application & Medical Details" },
            { id: "letter", label: "Formal University Letter (PDF)" },
            { id: "certificate", label: "Doctor Certificate Attachment" },
            { id: "timeline", label: "Audit Timeline" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? "bg-davu-navy-800 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Structured Review View */}
      {activeTab === "review" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1 & 2: Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Student Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
                <User className="w-4 h-4 text-davu-red-600" />
                <span>Student Academic Profile</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Full Name</span>
                  <span className="font-bold text-slate-900 block">{application.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Student ID</span>
                  <span className="font-bold text-slate-900 block">{application.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Program</span>
                  <span className="font-semibold text-slate-800 block">{application.program}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Department</span>
                  <span className="font-semibold text-slate-800 block">{application.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Semester & Section</span>
                  <span className="font-semibold text-slate-800 block">
                    {application.semester} • Section {application.section}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Academic Session</span>
                  <span className="font-semibold text-slate-800 block">{application.academicSession}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email Address</span>
                  <span className="font-semibold text-slate-800 block">{application.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Mobile Contact</span>
                  <span className="font-semibold text-slate-800 block">{application.phone}</span>
                </div>
                {application.parentName && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Parent / Guardian</span>
                    <span className="font-semibold text-slate-800 block">{application.parentName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Leave Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
                <Calendar className="w-4 h-4 text-davu-navy-700" />
                <span>Leave Duration & Details</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs mb-4">
                <div>
                  <span className="text-slate-400 block font-medium">Start Date</span>
                  <span className="font-bold text-slate-900 block">
                    {formatDate(application.startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">End Date</span>
                  <span className="font-bold text-slate-900 block">
                    {formatDate(application.endDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Total Duration</span>
                  <span className="text-base font-black text-davu-red-600 block">
                    {application.numberOfDays} Days
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400 block font-medium mb-1">
                  Reason for Medical Absence:
                </span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium leading-relaxed">
                  {application.reason}
                </p>
              </div>
            </div>

            {/* Medical Consultation Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Clinical & Doctor Information</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div>
                  <span className="text-slate-400 block font-medium">Consulting Doctor / Hospital</span>
                  <span className="font-bold text-slate-900 block">{application.doctorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Consultation Date</span>
                  <span className="font-bold text-slate-900 block">
                    {formatDate(application.consultationDate)}
                  </span>
                </div>
              </div>

              {application.treatmentDetails && (
                <div className="text-xs">
                  <span className="text-slate-400 block font-medium mb-1">
                    Treatment Notes / Advice:
                  </span>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                    {application.treatmentDetails}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Col 3: Side Panel (Certificate preview & remarks) */}
          <div className="space-y-6">
            {/* Quick Certificate Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">
                  Medical Certificate
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("certificate")}
                  className="text-xs font-semibold text-davu-red-600 hover:underline"
                >
                  Full View →
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs text-slate-500 truncate font-mono">
                  {application.localProofFilename || application.medicalCertificateName || "Document"}
                </p>
                {application.localProofStored ? (
                  <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full flex-shrink-0 flex items-center gap-1">
                    <HardDrive className="w-2.5 h-2.5" />
                    Local
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full flex-shrink-0">
                    Cloudinary
                  </span>
                )}
              </div>

              {application.localProofStored && application.localProofFilename ? (
                <div
                  onClick={() => setActiveTab("certificate")}
                  className="cursor-pointer border border-emerald-200 rounded-xl overflow-hidden hover:opacity-90 transition-opacity bg-slate-50 max-h-56 flex flex-col items-center justify-center p-3 text-center"
                >
                  <HardDrive className="w-8 h-8 text-emerald-600 mb-1" />
                  <span className="text-[11px] font-bold text-slate-800">
                    Local Copy Ready
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Click for full preview
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center space-y-2">
                  <p className="text-[11px] text-amber-800 font-medium">
                    Proof is on temporary Cloudinary storage
                  </p>
                  <button
                    type="button"
                    onClick={handleTransferLocally}
                    disabled={isTransferring}
                    className="w-full py-1.5 px-2 bg-davu-navy-800 hover:bg-davu-navy-900 text-white rounded-lg text-[10px] font-bold shadow-xs disabled:opacity-50"
                  >
                    {isTransferring ? "Transferring..." : "Transfer to Local PC"}
                  </button>
                </div>
              )}
            </div>

            {/* Existing Admin Remarks Card */}
            {application.adminRemarks && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
                <span className="text-xs font-bold text-slate-900 block mb-2">
                  Official Administrative Remarks
                </span>
                <p className="p-3 bg-slate-50 border-l-4 border-davu-navy-700 rounded-r text-xs text-slate-800 leading-relaxed">
                  {application.adminRemarks}
                </p>
                {application.reviewedBy && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    Endorsed by: {application.reviewedBy} on{" "}
                    {formatDate(application.reviewedAt || "")}
                  </p>
                )}
              </div>
            )}

            {/* Faculty PC Backup & Synchronization Status Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <HardDrive className="w-4 h-4 text-davu-navy-800" />
                  <span>Faculty PC Backup</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    application.syncStatus === "SYNCED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {application.syncStatus || "PENDING_SYNC"}
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Firebase Record:</span>
                  <span className="font-semibold text-emerald-700">Permanent ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cloudinary Proof:</span>
                  <span className="font-semibold">
                    {application.cloudinaryDeleted
                      ? "Deleted (Archived locally)"
                      : "Temporary Active"}
                  </span>
                </div>
                {application.syncedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Synced On:</span>
                    <span className="font-medium text-slate-800">
                      {formatDate(application.syncedAt)}
                    </span>
                  </div>
                )}
                {application.facultyPcId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Faculty PC:</span>
                    <span className="font-mono text-[10px] text-slate-800">
                      {application.facultyPcId}
                    </span>
                  </div>
                )}
              </div>

              <a
                href={`/api/sync/download-package?appId=${encodeURIComponent(
                  application.applicationId
                )}&autoConfirm=true`}
                download
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Local Backup (ZIP)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Formal Letter View */}
      {activeTab === "letter" && (
        <div className="bg-slate-100 p-4 sm:p-8 rounded-2xl border border-slate-200">
          <ApplicationLetter application={application} showActions={true} />
        </div>
      )}

      {/* TAB 3: Certificate View (Strictly Local Storage Loading - Section 8 & 13) */}
      {activeTab === "certificate" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          {application.localProofStored && application.localProofFilename ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Attached Medical Verification Certificate
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      Local Storage (medical-proofs/)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {application.localProofFilename}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/admin/medical-proofs/${encodeURIComponent(
                      application.localProofFilename
                    )}?adminUid=${encodeURIComponent(admin?.id || "adm-001")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Open in New Tab
                  </a>
                  <a
                    href={`/api/admin/medical-proofs/${encodeURIComponent(
                      application.localProofFilename
                    )}?adminUid=${encodeURIComponent(admin?.id || "adm-001")}`}
                    download={application.localProofFilename}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </a>
                </div>
              </div>

              {/* Render Local Proof File */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-center min-h-[400px]">
                {application.localProofFilename.toLowerCase().endsWith(".pdf") ||
                application.cloudinaryResourceType === "raw" ? (
                  <iframe
                    src={`/api/admin/medical-proofs/${encodeURIComponent(
                      application.localProofFilename
                    )}?adminUid=${encodeURIComponent(admin?.id || "adm-001")}`}
                    className="w-full h-[700px] border border-slate-200 rounded-lg shadow-xs"
                    title="Local Medical Proof PDF"
                  />
                ) : (
                  <img
                    src={`/api/admin/medical-proofs/${encodeURIComponent(
                      application.localProofFilename
                    )}?adminUid=${encodeURIComponent(admin?.id || "adm-001")}`}
                    alt="Medical Proof Document"
                    className="max-h-[700px] object-contain rounded-lg shadow-sm border border-slate-200 mx-auto"
                  />
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Loaded directly from local Admin PC storage (medical-proofs/)
                </span>
                {application.cloudinaryDeleted && (
                  <span className="text-slate-400">
                    Cloudinary copy securely purged
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <HardDrive className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Proof Not Yet Transferred to Local Admin PC
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  As per DAV University medical data privacy protocol, medical proofs are stored on the local Admin PC (<code>medical-proofs/</code>) and purged from Cloudinary.
                </p>
              </div>

              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {transferError}
                </div>
              )}

              <button
                type="button"
                onClick={handleTransferLocally}
                disabled={isTransferring}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <HardDrive className="w-4 h-4" />
                {isTransferring
                  ? "Transferring Proof to Local PC..."
                  : "Transfer & Store Proof Locally (medical-proofs/)"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Timeline View */}
      {activeTab === "timeline" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-2">
            Application Verification Timeline
          </h2>
          <ApplicationTimeline
            timeline={application.timeline}
            currentStatus={application.status}
          />
        </div>
      )}

      {/* DECISION ACTION MODAL (Requirement #16: Mandatory remarks for Reject/Return) */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4">
            <div>
              <span className="text-xs font-bold text-davu-red-600 uppercase tracking-wider block">
                Official University Endorsement
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {actionModal.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {actionModal.description}
              </p>
            </div>

            {actionModal.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{actionModal.error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Remarks / Decision Grounds{" "}
                {actionModal.isMandatoryRemarks ? (
                  <span className="text-rose-500">* (Mandatory)</span>
                ) : (
                  <span className="text-slate-400">(Optional)</span>
                )}
              </label>
              <textarea
                rows={4}
                value={actionModal.remarks}
                onChange={(e) =>
                  setActionModal((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                    error: undefined,
                  }))
                }
                placeholder={
                  actionModal.targetStatus === "Approved"
                    ? "Verified with medical certificate. Sanctioned."
                    : actionModal.targetStatus === "Returned for Correction"
                    ? "Please specify required missing documents (e.g. Doctor's registration seal or OPD slip missing)."
                    : "Specify university regulation grounds for rejection."
                }
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-davu-navy-600 leading-relaxed"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setActionModal({
                    isOpen: false,
                    targetStatus: null,
                    title: "",
                    description: "",
                    remarks: "",
                    isMandatoryRemarks: false,
                  })
                }
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={isProcessing}
                className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-xs ${
                  actionModal.targetStatus === "Approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : actionModal.targetStatus === "Rejected"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : actionModal.targetStatus === "Returned for Correction"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-davu-navy-800 hover:bg-davu-navy-900"
                }`}
              >
                {isProcessing ? "Updating Record..." : "Confirm & Save Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
