"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MedicalLeaveApplication } from "@/types";
import { ApplicationLetter } from "@/components/application/ApplicationLetter";
import { ApplicationTimeline } from "@/components/application/ApplicationTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/templateEngine";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  Download,
  Printer,
  Calendar,
} from "lucide-react";

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [application, setApplication] = useState<MedicalLeaveApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"letter" | "certificate" | "timeline">("letter");

  useEffect(() => {
    async function loadApp() {
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
    }
    if (id) loadApp();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Loading official application record...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900">Application Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          No medical leave record matches the identifier "{id}".
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block px-4 py-2 text-xs font-bold text-white bg-davu-navy-800 rounded-lg"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          <StatusBadge status={application.status} size="sm" />
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            DAV University Medical Leave Record
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {application.applicationId}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Applicant:{" "}
            <strong className="text-slate-800">{application.studentName}</strong> (
            {application.studentId}) • {application.department}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("letter")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === "letter"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Formal Letter & PDF
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("certificate")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === "certificate"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Medical Certificate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === "timeline"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tracking Timeline
          </button>
        </div>
      </div>

      {/* TAB 1: Formal Letter & Printable Document */}
      {activeTab === "letter" && (
        <div className="bg-slate-100 p-4 sm:p-8 rounded-2xl border border-slate-200">
          <ApplicationLetter application={application} showActions={true} />
        </div>
      )}

      {/* TAB 2: Medical Certificate Viewer */}
      {activeTab === "certificate" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Attached Medical Document
              </h2>
              <p className="text-xs text-slate-500">
                File: {application.medicalCertificateName || "Certificate"} (
                {application.medicalCertificateSize || "Standard"})
              </p>
            </div>
            {application.medicalCertificateUrl && (
              <a
                href={application.medicalCertificateUrl}
                download={application.medicalCertificateName || "medical_cert.pdf"}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Download Attachment
              </a>
            )}
          </div>

          {application.medicalCertificateUrl ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-4">
              {application.medicalCertificateUrl.startsWith("data:application/pdf") ? (
                <iframe
                  src={application.medicalCertificateUrl}
                  className="w-full h-[600px] border-none"
                  title="Medical Certificate PDF"
                />
              ) : (
                <img
                  src={application.medicalCertificateUrl}
                  alt="Medical Certificate"
                  className="max-h-[650px] object-contain rounded-lg shadow-sm border border-slate-200"
                />
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No attached certificate file found.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Tracking Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-2">
            Application Verification Timeline
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Chronological audit trail of university reviews and status actions.
          </p>
          <ApplicationTimeline
            timeline={application.timeline}
            currentStatus={application.status}
          />
        </div>
      )}
    </div>
  );
}
