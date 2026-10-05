"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { StudentProfile } from "@/types";
import {
  User,
  GraduationCap,
  Building,
  Mail,
  Phone,
  Calendar,
  FileText,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function StudentProfilePage() {
  const { user, role } = useAuth();
  const student = role === "student" ? (user as StudentProfile) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Student Academic Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Official enrollment and contact records registered with DAV University.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-davu-red-600 to-davu-navy-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {student?.name ? student.name[0] : "S"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {student?.name || "Rahul Verma"}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                Active Enrolled
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Roll No / Student ID:{" "}
              <strong className="text-slate-800 font-mono">
                {student?.studentId || "DAVU/2023/CSE/1042"}
              </strong>
            </p>
          </div>
        </div>

        {/* Detailed Fields */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <span className="text-slate-400 block font-medium mb-1">
              Degree Program
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {student?.program || "B.Tech Computer Science & Engineering"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium mb-1">
              Department
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {student?.department || "Department of Computer Science & Engineering"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium mb-1">
              Current Semester & Section
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {student?.semester || "5th Semester"} • Section {student?.section || "A"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium mb-1">
              Academic Session
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {student?.academicSession || "2026-2027"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium mb-1">
              University Email
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {student?.email || "rahul.verma@davuniversity.org"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium mb-1">
              Registered Contact Number
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {student?.phone || "+91 98765 43210"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium mb-1">
              Parent / Guardian Name
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {student?.parentName || "Sh. Rakesh Verma"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium mb-1">
              Institutional Status
            </span>
            <span className="text-sm font-bold text-emerald-700 block">
              Verified Student Record
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-xl transition-all shadow-xs"
          >
            Apply for Medical Leave
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/my-applications"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
          >
            View My Past Leaves
          </Link>
        </div>
      </div>
    </div>
  );
}
