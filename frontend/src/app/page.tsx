"use client";

import React from "react";
import Link from "next/link";
import { DavLogo } from "@/components/common/DavLogo";
import { useAuth } from "@/context/AuthContext";
import {
  FilePlus,
  Search,
  FileCheck,
  Clock,
  ShieldCheck,
  Download,
  Building2,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  UserCheck,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-davu-navy-50 via-white to-slate-50 border-b border-slate-200 py-16 sm:py-24">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Direct Application • No Student Login Required</span>
          </div>

          {/* Main Hero Headings */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Medical Leave Application Portal
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            DAV University students can apply for medical leave directly without creating an account or logging in. Simply track all your submitted applications and approval statuses by entering your <strong>Registration Number</strong>, <strong>Name</strong>, and <strong>Father's Name</strong>.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <FilePlus className="w-4 h-4" />
              Apply for Medical Leave
            </Link>

            <Link
              href="/track"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs hover:border-slate-400 active:scale-95"
            >
              <Search className="w-4 h-4 text-slate-500" />
              Check Leave Status (Reg No, Name & Father)
            </Link>
          </div>

          {/* Quick Notice Banner */}
          <div className="mt-10 max-w-xl mx-auto p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-center gap-2.5">
            <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Official Regulation:</strong> Submit applications within 3 working days of resuming classes along with doctor's prescription.
            </span>
          </div>
        </div>
      </section>

      {/* QUICK STATS STRIP */}
      <section className="bg-davu-navy-900 text-white py-10 border-b border-davu-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-davu-gold-400">
                Direct
              </p>
              <p className="mt-1 text-xs text-slate-300 font-medium">
                No Passwords / No Login Needed
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-white">
                3 Fields
              </p>
              <p className="mt-1 text-xs text-slate-300 font-medium">
                Reg No + Name + Father's Name Tracking
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-davu-gold-400">
                Auto-PDF
              </p>
              <p className="mt-1 text-xs text-slate-300 font-medium">
                Official DAVU Formatted Letter
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-white">
                10+
              </p>
              <p className="mt-1 text-xs text-slate-300 font-medium">
                Academic Departments Supported
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-davu-navy-700 uppercase tracking-widest">
              Simple Hassle-Free Process
            </h2>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
              How Students Apply & Check Status Without Logging In
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Enter Student & Father's Name",
                desc: "No password required. Enter your Registration Number, Full Name, Father's Name, and academic details.",
              },
              {
                step: "02",
                title: "Specify Dates & Upload Certificate",
                desc: "Leave days calculate automatically. Attach your doctor's prescription or hospital certificate (PDF/JPG/PNG).",
              },
              {
                step: "03",
                title: "Live Preview on University Letterhead",
                desc: "Review your formal medical leave letter generated automatically with official DAV University formatting.",
              },
              {
                step: "04",
                title: "Check Status by Reg No & Father's Name",
                desc: "Check all your applications and approval statuses anytime using your Registration Number, Name and Father's Name.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative"
              >
                <div className="text-3xl font-black text-davu-red-600/20 mb-2">
                  {s.step}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-xl transition-all shadow-xs"
            >
              Apply for Medical Leave Now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* PORTAL ACCESS OPTIONS */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Card */}
            <div className="p-8 bg-gradient-to-br from-white to-davu-red-50/40 border border-davu-red-100 rounded-2xl shadow-xs">
              <div className="w-10 h-10 bg-davu-red-600 text-white rounded-lg flex items-center justify-center font-bold mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Student Self-Service
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Apply directly online or check the status of all your applications using your registration number, full name, and father's name.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/apply"
                  className="px-4 py-2 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-lg transition-colors"
                >
                  Apply Directly
                </Link>
                <Link
                  href="/track"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Check Leave Status
                </Link>
              </div>
            </div>

            {/* Admin / Faculty Card */}
            <div className="p-8 bg-gradient-to-br from-white to-davu-navy-50/40 border border-davu-navy-100 rounded-2xl shadow-xs">
              <div className="w-10 h-10 bg-davu-navy-800 text-white rounded-lg flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5 text-davu-gold-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Faculty & Administration Desk
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Authorized university deans, heads of departments, and medical officers can review, sanction, or return applications.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-lg transition-colors"
                >
                  Faculty / Staff Login
                </Link>
                <Link
                  href="/admin"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Admin Console
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
