"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { MedicalLeaveApplication, StudentProfile } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/templateEngine";
import {
  FilePlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Download,
  Calendar,
  Eye,
  GraduationCap,
  Mail,
  Phone,
  Building,
} from "lucide-react";

export default function StudentDashboardPage() {
  const { user, role, loginAsStudent } = useAuth();
  const student = (role === "student" ? user : null) as StudentProfile | null;

  const [applications, setApplications] = useState<MedicalLeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const studentId = student?.studentId || "DAVU/2023/CSE/1042";
        const res = await fetch(`/api/applications?studentId=${encodeURIComponent(studentId)}`);
        const data = await res.json();
        if (data.success) {
          setApplications(data.applications);
        }
      } catch (err) {
        console.error("Failed to load student applications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [student]);

  const approvedLeaves = applications.filter((a) => a.status === "Approved");
  const pendingLeaves = applications.filter(
    (a) => a.status === "Submitted" || a.status === "Under Review"
  );
  const totalApprovedDays = approvedLeaves.reduce(
    (sum, a) => sum + (a.numberOfDays || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Card & Student Profile Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-davu-red-600 to-davu-navy-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
              {student?.name ? student.name[0] : "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Welcome, {student?.name || "DAV University Student"}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                  Active Student
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Student ID:{" "}
                <strong className="text-slate-800">
                  {student?.studentId || "DAVU/2023/CSE/1042"}
                </strong>{" "}
                • {student?.program || "B.Tech Computer Science & Engineering"}
              </p>
            </div>
          </div>

          {/* Quick Apply CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-xl transition-all shadow-xs"
            >
              <FilePlus className="w-4 h-4" />
              Apply for Medical Leave
            </Link>
          </div>
        </div>

        {/* Detailed Student Metadata Strip */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Department</span>
            <span className="font-semibold text-slate-800 truncate block">
              {student?.department || "Department of CSE"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Semester & Section</span>
            <span className="font-semibold text-slate-800 block">
              {student?.semester || "5th Semester"} • Section {student?.section || "A"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">University Email</span>
            <span className="font-semibold text-slate-800 truncate block">
              {student?.email || "student@davuniversity.org"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Academic Session</span>
            <span className="font-semibold text-slate-800 block">
              {student?.academicSession || "2026-2027"}
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS & METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">
            {applications.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Submitted this academic year
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approved Leaves
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-600">
            {approvedLeaves.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Condoned in attendance records
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approved Days
            </span>
            <div className="w-8 h-8 rounded-lg bg-davu-gold-50 text-davu-gold-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-davu-gold-700">
            {totalApprovedDays} <span className="text-xs font-normal text-slate-500">Days</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Total days approved
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending / In Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-600">
            {pendingLeaves.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Awaiting faculty decision
          </p>
        </div>
      </div>

      {/* RECENT APPLICATIONS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Medical Leave Applications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review history, track approval status, and print formal medical letters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              Track by ID
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading your applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No applications yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any medical leave applications. Click the button below to submit a new application.
            </p>
            <Link
              href="/apply"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-lg transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5" />
              Apply Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Application ID</th>
                  <th className="px-6 py-3.5">Leave Duration</th>
                  <th className="px-6 py-3.5">Days</th>
                  <th className="px-6 py-3.5">Illness / Reason</th>
                  <th className="px-6 py-3.5">Submitted On</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {app.applicationId}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      {formatDate(app.startDate)} — {formatDate(app.endDate)}
                    </td>
                    <td className="px-6 py-4 font-bold text-davu-red-600">
                      {app.numberOfDays}
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                      {app.reason}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(app.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/track?id=${app.applicationId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          title="Track Timeline"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          Track
                        </Link>
                        <Link
                          href={`/applications/${app.applicationId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-davu-navy-800 bg-davu-navy-50 hover:bg-davu-navy-100 border border-davu-navy-200 rounded-md transition-colors"
                          title="View & Download PDF"
                        >
                          <Download className="w-3 h-3 text-davu-navy-700" />
                          PDF
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
