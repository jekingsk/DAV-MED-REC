import React from "react";
import Link from "next/link";
import { DavLogo } from "@/components/common/DavLogo";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export const metadata = {
  title: "About the Portal & Medical Regulations | DAV University",
  description:
    "Official guidelines, attendance condonation regulations, and medical certificate requirements at DAV University.",
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <DavLogo size="lg" className="justify-center mb-4" />
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Medical Leave Application Regulations
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          Comprehensive guidance for DAV University students regarding online medical leave applications, medical document verification, and academic attendance condonation.
        </p>
      </div>

      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-3">
          1. Purpose of the Digital Portal
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The DAV University Medical Leave Application Portal provides an authenticated, automated, and tamper-resistant digital workflow for students to report medical absences. By submitting medical documentation online, students eliminate manual paper delays and receive an official university-approved formal leave letter with institutional verification credentials.
        </p>
      </div>

      {/* Attendance & Condonation Rules */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
          2. University Attendance Condonation Regulations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Minimum Attendance Requirement
            </h3>
            <p className="leading-relaxed text-slate-600">
              Students must maintain an aggregate minimum attendance of <strong>75%</strong> in lectures, tutorials, and practical laboratories in each semester to be eligible for end-term examinations.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-davu-navy-700" />
              Medical Condonation Limit
            </h3>
            <p className="leading-relaxed text-slate-600">
              On genuine medical grounds recommended by the University Medical Officer and approved by the Dean of Academic Affairs, attendance condonation of up to <strong>10%</strong> may be granted.
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Mandatory Deadline:</strong> Medical leave applications must be submitted through this online portal within <strong>three (3) working days</strong> from the date the student resumes university classes following medical recovery. Late applications without exceptional justification will be rejected automatically.
          </p>
        </div>
      </div>

      {/* Required Medical Documentation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
          3. Mandatory Medical Documents
        </h2>

        <ul className="space-y-3 text-xs text-slate-700">
          <li className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-davu-red-100 text-davu-red-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">
              1
            </div>
            <div>
              <strong className="text-slate-900">Registered Medical Practitioner Certificate:</strong>
              <p className="text-slate-500 mt-0.5">
                Must clearly state patient diagnosis, consultation date, recommended rest duration, and doctor's registration number (MCI/PMC) with official clinic stamp.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-davu-red-100 text-davu-red-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">
              2
            </div>
            <div>
              <strong className="text-slate-900">Hospitalization & Diagnostic Reports (if applicable):</strong>
              <p className="text-slate-500 mt-0.5">
                For surgical procedures or prolonged illnesses, hospital discharge summary and relevant pathology/radiology test reports must be attached.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-davu-red-100 text-davu-red-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">
              3
            </div>
            <div>
              <strong className="text-slate-900">Medical Fitness Certificate:</strong>
              <p className="text-slate-500 mt-0.5">
                A fitness certificate certifying recovery and fitness to resume academic studies.
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Institutional Contact Details */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8">
        <h2 className="text-base font-bold text-davu-gold-400 mb-4">
          University Health Centre & Support
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block font-semibold mb-1">Campus Location</span>
            <p className="leading-relaxed">
              DAV University Health Centre, Ground Floor, Academic Block, Sarmastpur, Jalandhar – 144012
            </p>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold mb-1">Helpline Contacts</span>
            <p>Toll Free: 1800-1800-190</p>
            <p>Medical Ext: 240</p>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold mb-1">Email Inquiries</span>
            <p>medical.leave@davuniversity.org</p>
            <p>dean.academics@davuniversity.org</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-xl transition-all"
          >
            Proceed to Apply
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/track"
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Track Existing Application
          </Link>
        </div>
      </div>
    </div>
  );
}
