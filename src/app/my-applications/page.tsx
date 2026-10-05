"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { MedicalLeaveApplication, StudentProfile } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/templateEngine";
import {
  FilePlus,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Calendar,
} from "lucide-react";

export default function MyApplicationsPage() {
  const { user, role } = useAuth();
  const student = role === "student" ? (user as StudentProfile) : null;

  const [applications, setApplications] = useState<MedicalLeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const studentId = student?.studentId || "DAVU/2023/CSE/1042";
        const res = await fetch(
          `/api/applications?studentId=${encodeURIComponent(studentId)}`
        );
        const data = await res.json();
        if (data.success) {
          setApplications(data.applications);
        }
      } catch (err) {
        console.error("Failed to load applications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [student]);

  const filteredApps = applications.filter((app) => {
    const matchesStatus =
      statusFilter === "All" ||
      app.status.toLowerCase() === statusFilter.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      app.applicationId.toLowerCase().includes(q) ||
      app.reason.toLowerCase().includes(q) ||
      app.doctorName.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Medical Leave Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete record of your submitted medical leave requests and official approvals.
          </p>
        </div>

        <Link
          href="/apply"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-xl transition-all shadow-xs"
        >
          <FilePlus className="w-4 h-4" />
          New Application
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, reason, or doctor..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
          >
            <option value="All">All Statuses ({applications.length})</option>
            <option value="Approved">Approved</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Returned for Correction">Returned for Correction</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading medical leave records...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No applications match your filter</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or submit a new medical leave application.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Application ID</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Days</th>
                  <th className="px-6 py-3.5">Reason / Medical Diagnosis</th>
                  <th className="px-6 py-3.5">Consulting Doctor</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {app.applicationId}
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
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                      {app.doctorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/track?id=${app.applicationId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          Track
                        </Link>
                        <Link
                          href={`/applications/${app.applicationId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-davu-navy-800 bg-davu-navy-50 hover:bg-davu-navy-100 border border-davu-navy-200 rounded-md transition-colors"
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
