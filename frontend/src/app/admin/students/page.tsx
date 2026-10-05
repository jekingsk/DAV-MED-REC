"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Users,
  Search,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Building,
  CheckCircle2,
} from "lucide-react";

interface StudentExtended {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  department: string;
  semester: string;
  section: string;
  academicSession: string;
  totalApplications: number;
  approvedApplications: number;
  totalApprovedDays: number;
  latestStatus: any;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        const res = await fetch("/api/students");
        const data = await res.json();
        if (data.success) {
          setStudents(data.students);
        }
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
              Student Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Registered Student Directory & Medical Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor student attendance condonation, leave history, and academic profile records.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, roll no, department..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">
            Loading student records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">
            No students matched your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Student Details</th>
                  <th className="px-6 py-3.5">Academic Program</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Semester & Section</th>
                  <th className="px-6 py-3.5">Contact Info</th>
                  <th className="px-6 py-3.5">Leave Applications</th>
                  <th className="px-6 py-3.5">Approved Days</th>
                  <th className="px-6 py-3.5">Latest Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {s.studentId}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap font-medium">
                      {s.program}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                      {s.department}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      {s.semester} • Sec {s.section}
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      <p>{s.email}</p>
                      <p className="text-[10px] text-slate-400">{s.phone}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {s.totalApplications} Submitted
                    </td>
                    <td className="px-6 py-4 font-bold text-davu-red-600">
                      {s.totalApprovedDays} Days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.latestStatus !== "None" ? (
                        <StatusBadge status={s.latestStatus} size="sm" />
                      ) : (
                        <span className="text-slate-400 text-[10px]">No record</span>
                      )}
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
