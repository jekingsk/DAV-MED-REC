"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PortalStats, MedicalLeaveApplication } from "@/types";
import { formatDate } from "@/lib/templateEngine";
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  PieChart,
} from "lucide-react";

export default function AdminReportsPage() {
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [deptData, setDeptData] = useState<Record<string, { total: number; approved: number; rejected: number; pending: number }>>({});
  const [semData, setSemData] = useState<Record<string, number>>({});
  const [monthData, setMonthData] = useState<Record<string, number>>({});
  const [applications, setApplications] = useState<MedicalLeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [statsRes, appsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/applications"),
        ]);

        const sData = await statsRes.json();
        const aData = await appsRes.json();

        if (sData.success) {
          setStats(sData.stats);
          setDeptData(sData.departmentBreakdown || {});
          setSemData(sData.semesterBreakdown || {});
          setMonthData(sData.monthlyBreakdown || {});
        }

        if (aData.success) {
          setApplications(aData.applications);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const totalSanctionedDays = applications
    .filter((a) => a.status === "Approved")
    .reduce((sum, a) => sum + (a.numberOfDays || 0), 0);

  const exportCsv = () => {
    const headers = [
      "Application ID",
      "Student Name",
      "Student ID",
      "Department",
      "Semester",
      "Start Date",
      "End Date",
      "Days",
      "Status",
      "Consulting Doctor",
      "Submission Date",
    ];

    const rows = applications.map((a) => [
      `"${a.applicationId}"`,
      `"${a.studentName}"`,
      `"${a.studentId}"`,
      `"${a.department}"`,
      `"${a.semester}"`,
      `"${a.startDate}"`,
      `"${a.endDate}"`,
      a.numberOfDays,
      `"${a.status}"`,
      `"${(a.doctorName || "").replace(/"/g, '""')}"`,
      `"${a.submittedAt}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `DAVU_Medical_Leave_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Admin Console
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-davu-red-600">
              Reports & Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Institutional Medical Leave Statistics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive audit, department-wise breakdowns, and attendance condonation analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Report
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-lg transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-davu-gold-400" />
            Export to CSV / Excel
          </button>
        </div>
      </div>

      {/* Top Key Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Submissions
          </span>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {stats?.totalApplications ?? 0}
          </p>
          <span className="text-[11px] text-slate-500">
            Across 10 academic departments
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
            Approved Applications
          </span>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            {stats?.approved ?? 0}
          </p>
          <span className="text-[11px] text-slate-500">
            {stats?.approvedRate ?? 0}% overall approval rate
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-davu-gold-700 uppercase tracking-wider block">
            Sanctioned Leave Days
          </span>
          <p className="mt-2 text-3xl font-black text-davu-gold-700">
            {totalSanctionedDays}
          </p>
          <span className="text-[11px] text-slate-500">
            Total days approved by deans
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-davu-navy-800 uppercase tracking-wider block">
            Avg. Leave Duration
          </span>
          <p className="mt-2 text-3xl font-black text-davu-navy-800">
            {stats?.avgLeaveDuration ?? 0}{" "}
            <span className="text-sm font-normal text-slate-500">Days</span>
          </p>
          <span className="text-[11px] text-slate-500">
            Average recovery period
          </span>
        </div>
      </div>

      {/* Department Breakdown Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Applications by Academic Department
            </h2>
            <p className="text-xs text-slate-500">
              Departmental distribution of medical requests and clearance ratios.
            </p>
          </div>
          <Building className="w-5 h-5 text-slate-400" />
        </div>

        <div className="space-y-4">
          {Object.entries(deptData).map(([dept, data]) => {
            const maxVal = Math.max(...Object.values(deptData).map((d) => d.total), 1);
            const percentage = Math.round((data.total / maxVal) * 100);

            return (
              <div key={dept} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 truncate max-w-md">
                    {dept}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">
                      {data.approved} Approved
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-900 font-bold">
                      {data.total} Total
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-3"
                    style={{
                      width: `${(data.approved / data.total) * percentage}%`,
                    }}
                    title={`${data.approved} Approved`}
                  />
                  <div
                    className="bg-amber-400 h-3"
                    style={{
                      width: `${(data.pending / data.total) * percentage}%`,
                    }}
                    title={`${data.pending} Pending`}
                  />
                  <div
                    className="bg-rose-500 h-3"
                    style={{
                      width: `${(data.rejected / data.total) * percentage}%`,
                    }}
                    title={`${data.rejected} Rejected`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded" />
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-400 rounded" />
            <span>Pending / Review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-rose-500 rounded" />
            <span>Rejected</span>
          </div>
        </div>
      </div>

      {/* Grid: Semester Breakdown & Monthly Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Semester Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Applications by Semester
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Leave distribution across student academic levels.
          </p>

          <div className="space-y-3">
            {Object.entries(semData).map(([sem, count]) => {
              const total = applications.length || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={sem} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 w-32">{sem}</span>
                  <div className="flex-1 mx-4 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-davu-navy-800 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-900 w-12 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Monthly Application Volumes
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Seasonal spike and trends in medical absences.
          </p>

          <div className="space-y-3">
            {Object.entries(monthData).map(([month, count]) => {
              const maxMonth = Math.max(...Object.values(monthData), 1);
              const pct = Math.round((count / maxMonth) * 100);

              return (
                <div key={month} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 w-32">{month}</span>
                  <div className="flex-1 mx-4 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-davu-red-600 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-900 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
