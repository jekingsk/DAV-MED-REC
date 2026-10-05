"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PortalStats, MedicalLeaveApplication, AdminUser } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FacultyPcSyncWidget } from "@/components/admin/FacultyPcSyncWidget";
import { AdminProofDownloader } from "@/components/admin/AdminProofDownloader";
import { formatDate } from "@/lib/templateEngine";
import {
  ShieldCheck,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  Download,
  Eye,
  Filter,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, role, loginAsAdmin } = useAuth();
  const admin = role === "admin" ? (user as AdminUser) : null;

  const [stats, setStats] = useState<PortalStats | null>(null);
  const [applications, setApplications] = useState<MedicalLeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [statsRes, appsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/applications"),
        ]);

        const statsData = await statsRes.json();
        const appsData = await appsRes.json();

        if (statsData.success) setStats(statsData.stats);
        if (appsData.success) setApplications(appsData.applications);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const pendingApps = applications.filter(
    (a) => a.status === "Submitted" || a.status === "Under Review"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-davu-navy-700 text-davu-gold-400 flex items-center justify-center font-bold text-2xl shadow-sm border border-slate-700">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  University Administration Console
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold text-davu-gold-400 bg-davu-gold-400/10 border border-davu-gold-400/20 rounded-full">
                  Official Desk
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Logged in as:{" "}
                <strong className="text-white">
                  {admin?.name || "Dr. Rajesh Kumar"}
                </strong>{" "}
                • {admin?.role || "Dean of Academic Affairs"} (
                {admin?.department || "DAV University"})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-xl transition-all shadow-xs"
            >
              <FileCheck className="w-4 h-4" />
              Manage Applications
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </Link>
            <Link
              href="/admin/template"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
              <Settings className="w-4 h-4" />
              Letter Template
            </Link>
          </div>
        </div>
      </div>

      {/* DASHBOARD STATISTICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Received
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {stats?.totalApplications ?? 0}
          </p>
          <span className="text-[10px] text-slate-500">All submissions</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            New / Pending
          </span>
          <p className="mt-2 text-2xl font-black text-blue-600">
            {stats?.pendingReview ?? 0}
          </p>
          <span className="text-[10px] text-slate-500">Awaiting triage</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Under Review
          </span>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {stats?.underReview ?? 0}
          </p>
          <span className="text-[10px] text-slate-500">Medical / HOD</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Approved
          </span>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {stats?.approved ?? 0}
          </p>
          <span className="text-[10px] text-slate-500">
            {stats?.approvedRate ?? 0}% clearance
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
            Returned
          </span>
          <p className="mt-2 text-2xl font-black text-purple-600">
            {stats?.returnedForCorrection ?? 0}
          </p>
          <span className="text-[10px] text-slate-500">For correction</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Rejected
          </span>
          <p className="mt-2 text-2xl font-black text-rose-600">
            {stats?.rejected ?? 0}
          </p>
          <span className="text-[10px] text-slate-500">Unsatisfactory</span>
        </div>
      </div>

      {/* AUTOMATED PROOF DOWNLOAD & CLOUDINARY CLEANUP WIDGET */}
      <AdminProofDownloader />

      {/* FACULTY PC SYNCHRONIZATION & LOCAL BACKUP WIDGET */}
      <FacultyPcSyncWidget />

      {/* PENDING APPROVAL QUEUE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Action Required: Pending Verification Queue
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full">
                {pendingApps.length} Action(s)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Applications submitted by students requiring faculty endorsement, medical verification, or official condonation.
            </p>
          </div>

          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-davu-navy-800 hover:text-davu-navy-900"
          >
            View All Applications ({applications.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingApps.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-700">All caught up!</p>
            <p className="text-slate-400 mt-0.5">
              No pending medical leave applications awaiting review right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Application ID</th>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Leave Period</th>
                  <th className="px-6 py-3.5">Days</th>
                  <th className="px-6 py-3.5">Illness / Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {app.applicationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-800">{app.studentName}</p>
                      <p className="text-[10px] text-slate-500">{app.studentId}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                      {app.department}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      {formatDate(app.startDate)} - {formatDate(app.endDate)}
                    </td>
                    <td className="px-6 py-4 font-bold text-davu-red-600">
                      {app.numberOfDays}
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                      {app.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/applications/${app.applicationId}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-lg transition-colors shadow-2xs"
                      >
                        Review
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK SHORTCUT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/applications"
          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-davu-red-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-davu-red-50 text-davu-red-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-davu-red-600 transition-colors">
            All Applications & Filters →
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter by department, semester, or status, and export medical leave records.
          </p>
        </Link>

        <Link
          href="/admin/reports"
          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-davu-navy-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-davu-navy-50 text-davu-navy-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-davu-navy-800 transition-colors">
            Reports & Leave Analytics →
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Department-wise distribution, semester trends, and exportable CSV attendance reports.
          </p>
        </Link>

        <Link
          href="/admin/template"
          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-amber-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
            Application Letter Template →
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Customize university letter wording, recipient address, and placeholder fields.
          </p>
        </Link>
      </div>
    </div>
  );
}
