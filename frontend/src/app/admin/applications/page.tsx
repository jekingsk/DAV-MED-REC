"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MedicalLeaveApplication } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/templateEngine";
import {
  Search,
  Filter,
  Download,
  Eye,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

const DEPARTMENTS = [
  "All",
  "Department of Computer Science & Engineering",
  "Department of Biotechnology",
  "DAV University Institute of Management",
  "Department of Pharmaceutical Sciences",
  "Department of Civil Engineering",
  "Department of Mechanical Engineering",
];

const SEMESTERS = ["All", "1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];

const STATUSES = ["All", "Submitted", "Under Review", "Approved", "Returned for Correction", "Rejected"];

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<MedicalLeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [semester, setSemester] = useState("All");
  const [status, setStatus] = useState("All");

  const loadApps = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const filtered = applications.filter((app) => {
    if (status !== "All" && app.status.toLowerCase() !== status.toLowerCase()) return false;
    if (department !== "All" && app.department.toLowerCase() !== department.toLowerCase()) return false;
    if (semester !== "All" && app.semester.toLowerCase() !== semester.toLowerCase()) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        app.applicationId.toLowerCase().includes(q) ||
        app.studentName.toLowerCase().includes(q) ||
        app.studentId.toLowerCase().includes(q) ||
        app.reason.toLowerCase().includes(q) ||
        app.doctorName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

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
      "Reason",
      "Doctor/Hospital",
      "Status",
      "Submitted On",
    ];

    const rows = filtered.map((a) => [
      `"${a.applicationId}"`,
      `"${a.studentName}"`,
      `"${a.studentId}"`,
      `"${a.department}"`,
      `"${a.semester}"`,
      `"${a.startDate}"`,
      `"${a.endDate}"`,
      a.numberOfDays,
      `"${(a.reason || "").replace(/"/g, '""')}"`,
      `"${(a.doctorName || "").replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${a.submittedAt}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DAV_Medical_Leaves_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            All Medical Leave Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional directory of student medical leave submissions across all departments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadApps}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-lg transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-davu-gold-400" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, student, reason..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-medium text-slate-700 truncate"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.filter((d) => d !== "All").map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-medium text-slate-700"
            >
              <option value="All">All Semesters</option>
              {SEMESTERS.filter((s) => s !== "All").map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-medium text-slate-700"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === "All" ? "All Statuses" : st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{applications.length}</strong> total applications
          </span>

          {(search || department !== "All" || semester !== "All" || status !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDepartment("All");
                setSemester("All");
                setStatus("All");
              }}
              className="text-davu-red-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">
            Loading university applications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">
            No medical leave applications matched your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Application ID</th>
                  <th className="px-6 py-3.5">Student Details</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Days</th>
                  <th className="px-6 py-3.5">Illness / Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {app.applicationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-800">{app.studentName}</p>
                      <p className="text-[10px] text-slate-500">{app.studentId}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                      <p className="truncate">{app.department}</p>
                      <p className="text-[10px] text-slate-400">{app.semester}</p>
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-lg transition-colors shadow-2xs"
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
    </div>
  );
}
