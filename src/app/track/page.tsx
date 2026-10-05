"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MedicalLeaveApplication, StudentProfile } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ApplicationTimeline } from "@/components/application/ApplicationTimeline";
import { ApplicationLetter } from "@/components/application/ApplicationLetter";
import { formatDate } from "@/lib/templateEngine";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Download,
  Building,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Printer,
  Sparkles,
  HelpCircle,
} from "lucide-react";

function TrackContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  // Mode: "student" (Registration No + Name + Father's Name) vs "appId" (Single Application ID)
  const [activeTab, setActiveTab] = useState<"student" | "appId">(
    queryId ? "appId" : "student"
  );

  // Student Identity Fields
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [fatherName, setFatherName] = useState("");

  // Single Application ID Field
  const [applicationId, setApplicationId] = useState(queryId || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<MedicalLeaveApplication[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [letterViewApp, setLetterViewApp] = useState<MedicalLeaveApplication | null>(null);

  const fetchStudentApplications = async (regNo: string, sName: string, fName: string) => {
    try {
      setLoading(true);
      setError(null);
      setApplications([]);
      setStudentProfile(null);
      setLetterViewApp(null);

      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber: regNo.trim(),
          studentName: sName.trim(),
          fatherName: fName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No medical leave records found.");
      }

      setApplications(data.applications || []);
      setStudentProfile(data.student || null);
      if (data.applications && data.applications.length > 0) {
        setExpandedAppId(data.applications[0].applicationId);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleApplication = async (appId: string) => {
    try {
      setLoading(true);
      setError(null);
      setApplications([]);
      setStudentProfile(null);
      setLetterViewApp(null);

      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: appId.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Application not found.");
      }

      setApplications(data.applications || [data.application]);
      setExpandedAppId(data.application?.applicationId || appId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryId) {
      fetchSingleApplication(queryId);
    }
  }, [queryId]);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber || !studentName || !fatherName) {
      setError("Please fill in Registration Number, Student Name, and Father's Name.");
      return;
    }
    fetchStudentApplications(registrationNumber, studentName, fatherName);
  };

  const handleAppIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId.trim()) {
      setError("Please enter your Application ID.");
      return;
    }
    fetchSingleApplication(applicationId);
  };

  const quickFillStudent = (reg: string, name: string, father: string) => {
    setRegistrationNumber(reg);
    setStudentName(name);
    setFatherName(father);
    setActiveTab("student");
    fetchStudentApplications(reg, name, father);
  };

  const totalDaysApproved = applications
    .filter((a) => a.status === "Approved")
    .reduce((sum, a) => sum + (a.numberOfDays || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-davu-navy-50 border border-davu-navy-200 text-davu-navy-800 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-davu-red-600" />
          No Password or Login Needed
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Track & Check Medical Leave Applications
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          Students can check all their submitted medical leave applications, live approval stages, and official PDF documents simply by verifying their identity.
        </p>
      </div>

      {/* Lookup Card with Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-bold max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab("student");
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "student"
                ? "bg-white text-davu-red-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            Check by Reg No, Name & Father's Name
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("appId");
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "appId"
                ? "bg-white text-davu-navy-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            Track by Application ID
          </button>
        </div>

        {/* Form 1: Student Identity Verification (3 Fields) */}
        {activeTab === "student" && (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registration No. / Roll No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. DAVU/2023/CSE/1042"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Father's Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="e.g. Rakesh Verma"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Quick sample fill chips for evaluation */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Quick Test Records:</span>
                <button
                  type="button"
                  onClick={() =>
                    quickFillStudent(
                      "DAVU/2023/CSE/1042",
                      "Rahul Verma",
                      "Sh. Rakesh Verma"
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-davu-red-50 text-davu-red-700 hover:border-davu-red-200 border border-slate-200 font-semibold"
                >
                  Rahul Verma
                </button>
                <button
                  type="button"
                  onClick={() =>
                    quickFillStudent(
                      "DAVU/2024/BIO/2015",
                      "Priya Sharma",
                      "Sh. Anand Sharma"
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-davu-red-50 text-davu-red-700 hover:border-davu-red-200 border border-slate-200 font-semibold"
                >
                  Priya Sharma
                </button>
                <button
                  type="button"
                  onClick={() =>
                    quickFillStudent(
                      "DAVU/2023/MBA/3088",
                      "Gurpreet Singh",
                      "S. Balwinder Singh"
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-davu-red-50 text-davu-red-700 hover:border-davu-red-200 border border-slate-200 font-semibold"
                >
                  Gurpreet Singh
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? "Checking Records..." : "Check All My Applications"}
              </button>
            </div>
          </form>
        )}

        {/* Form 2: Direct Application ID Lookup */}
        {activeTab === "appId" && (
          <form onSubmit={handleAppIdSubmit} className="space-y-4">
            <div className="max-w-lg mx-auto">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                University Application ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                placeholder="e.g. DAV-MED-2026-000101 or DAV-MED-2026-000106"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-mono"
              />
            </div>

            <div className="flex items-center justify-center pt-1">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? "Searching..." : "Track Application"}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">No Records Found</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* RESULTS DISPLAY */}
      {applications.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Student Profile Card (if found) */}
          {studentProfile && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-davu-red-600 to-davu-navy-800 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                    {studentProfile.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        {studentProfile.name}
                      </h2>
                      <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                        Identity Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Registration No:{" "}
                      <strong className="text-slate-800 font-mono">
                        {studentProfile.studentId}
                      </strong>{" "}
                      • Father's Name:{" "}
                      <strong className="text-slate-800">
                        {studentProfile.parentName}
                      </strong>
                    </p>
                  </div>
                </div>

                <Link
                  href="/apply"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-xl transition-all shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  New Medical Application
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Program</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {studentProfile.program}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Department</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {studentProfile.department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Total Applications</span>
                  <span className="font-black text-slate-900 block text-sm">
                    {applications.length} Record(s)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Approved Leave Days</span>
                  <span className="font-black text-davu-red-600 block text-sm">
                    {totalDaysApproved} Days
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* List of Applications Found */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Medical Leave Submissions ({applications.length})
              </h3>
              <span className="text-xs text-slate-500">
                Click on any application to view timeline & letter
              </span>
            </div>

            {applications.map((app) => {
              const isExpanded = expandedAppId === app.applicationId;

              return (
                <div
                  key={app.id || app.applicationId}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all"
                >
                  {/* Collapsed Header / Summary Row */}
                  <div
                    onClick={() =>
                      setExpandedAppId(isExpanded ? null : app.applicationId)
                    }
                    className="p-5 sm:p-6 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-black text-slate-900 font-mono">
                          {app.applicationId}
                        </span>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600">
                        Leave: <strong>{formatDate(app.startDate)}</strong> to{" "}
                        <strong>{formatDate(app.endDate)}</strong> (
                        <span className="font-bold text-davu-red-600">
                          {app.numberOfDays} Days
                        </span>
                        ) • Submitted on {formatDate(app.submittedAt)}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-xl">
                        Illness: {app.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLetterViewApp(app);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-davu-navy-800 bg-davu-navy-50 hover:bg-davu-navy-100 border border-davu-navy-200 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Formal Letter PDF
                      </button>

                      <div className="p-1.5 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details Section */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-6">
                      {/* Clinical info strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
                        <div>
                          <span className="text-slate-400 block font-medium">Consulting Doctor</span>
                          <span className="font-semibold text-slate-800 block truncate">
                            {app.doctorName}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Consultation Date</span>
                          <span className="font-semibold text-slate-800 block">
                            {formatDate(app.consultationDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Medical Certificate</span>
                          <span className="font-semibold text-slate-800 block truncate">
                            {app.medicalCertificateName || "Attached"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Reviewed By</span>
                          <span className="font-semibold text-slate-800 block truncate">
                            {app.reviewedBy || "Pending Review"}
                          </span>
                        </div>
                      </div>

                      {/* Official Remarks if any */}
                      {app.adminRemarks && (
                        <div className="p-3 bg-white border-l-4 border-davu-red-600 rounded-r-xl text-xs shadow-2xs">
                          <span className="font-bold text-slate-900 block">
                            University Official Remarks:
                          </span>
                          <p className="mt-0.5 text-slate-700 leading-relaxed">
                            {app.adminRemarks}
                          </p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                          Step-by-Step Approval Timeline
                        </span>
                        <ApplicationTimeline
                          timeline={app.timeline}
                          currentStatus={app.status}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modal / Inline Letter Viewer if requested */}
          {letterViewApp && (
            <div className="p-6 bg-slate-100 border border-slate-200 rounded-2xl shadow-inner space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  Official Formatted Application Document: {letterViewApp.applicationId}
                </h4>
                <button
                  type="button"
                  onClick={() => setLetterViewApp(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                >
                  Close Document Preview
                </button>
              </div>

              <ApplicationLetter application={letterViewApp} showActions={true} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading application tracker...
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
