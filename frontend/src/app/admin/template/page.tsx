"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TemplateConfig } from "@/types";
import { ApplicationLetter } from "@/components/application/ApplicationLetter";
import { defaultTemplate, initialStudents } from "@/lib/data";
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  FileCode,
} from "lucide-react";

export default function TemplateEditorPage() {
  const [template, setTemplate] = useState<TemplateConfig>(defaultTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        const res = await fetch("/api/template");
        const data = await res.json();
        if (data.success && data.template) {
          setTemplate(data.template);
        }
      } catch (err) {
        console.error("Failed to load template:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch("/api/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save template.");
      }
      setSuccessMsg("University medical leave template successfully updated and published.");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("Reset template to university standard default wording?")) {
      setTemplate(defaultTemplate);
    }
  };

  const placeholders = [
    { tag: "{{student_name}}", desc: "Student's Full Name" },
    { tag: "{{student_id}}", desc: "Enrollment / Roll Number" },
    { tag: "{{program}}", desc: "Enrolled Degree / Program" },
    { tag: "{{department}}", desc: "Academic Department" },
    { tag: "{{semester}}", desc: "Current Semester" },
    { tag: "{{section}}", desc: "Class Section" },
    { tag: "{{start_date}}", desc: "Leave Start Date" },
    { tag: "{{end_date}}", desc: "Leave End Date" },
    { tag: "{{number_of_days}}", desc: "Calculated Number of Days" },
    { tag: "{{medical_reason}}", desc: "Medical Illness / Diagnosis" },
    { tag: "{{doctor_name}}", desc: "Attending Doctor / Hospital" },
    { tag: "{{consultation_date}}", desc: "Date of Consultation" },
    { tag: "{{application_date}}", desc: "Date of Leave Submission" },
    { tag: "{{application_id}}", desc: "Unique Verification ID" },
  ];

  const copyToClipboard = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedPlaceholder(tag);
    setTimeout(() => setCopiedPlaceholder(null), 2000);
  };

  const mockApp = {
    applicationId: "DAV-MED-2026-000101",
    studentName: "Rahul Verma",
    studentId: "DAVU/2023/CSE/1042",
    program: "B.Tech Computer Science & Engineering",
    department: "Department of Computer Science & Engineering",
    semester: "5th Semester",
    section: "CSE-A",
    academicSession: "2026-2027",
    startDate: "2026-09-18",
    endDate: "2026-09-22",
    numberOfDays: 5,
    reason: "Acute Viral Pyrexia with severe body aches and dehydration",
    doctorName: "Dr. A. K. Joshi, M.D. (Civil Hospital Jalandhar)",
    consultationDate: "2026-09-18",
    status: "Approved" as const,
    medicalCertificateName: "Medical_Certificate_RahulVerma.pdf",
  };

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
              Template Configuration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Medical Leave Letter Template Editor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure official university application letter wording, recipient details, and dynamic placeholders without changing code.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Defaults
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Editor on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-davu-navy-700" />
              Template Text Fields
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Address Block
                </label>
                <textarea
                  rows={3}
                  name="recipient"
                  value={template.recipient}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Line Template
                </label>
                <input
                  type="text"
                  name="subject"
                  value={template.subject}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Salutation
                </label>
                <input
                  type="text"
                  name="salutation"
                  value={template.salutation}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Application Body Text (with placeholders)
                </label>
                <textarea
                  rows={8}
                  name="body"
                  value={template.body}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sign-off Salutation
                </label>
                <textarea
                  rows={2}
                  name="signoff"
                  value={template.signoff}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Verification Footer
                </label>
                <input
                  type="text"
                  name="footerNotes"
                  value={template.footerNotes}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Publishing Changes..." : "Save & Publish Template"}
                </button>
              </div>
            </form>
          </div>

          {/* Placeholders Cheat Sheet */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Available Dynamic Placeholders (Click to Copy)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {placeholders.map((p) => (
                <button
                  key={p.tag}
                  type="button"
                  onClick={() => copyToClipboard(p.tag)}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-davu-red-50/50 hover:border-davu-red-200 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <code className="text-xs font-bold text-davu-navy-800">
                      {p.tag}
                    </code>
                    <span className="text-[10px] text-slate-500 block">
                      {p.desc}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-davu-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedPlaceholder === p.tag ? "Copied!" : "Copy"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-davu-red-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Live Document Preview (Rendered)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Sample Data: Rahul Verma
            </span>
          </div>

          <div className="bg-slate-200 p-4 rounded-2xl border border-slate-300 overflow-x-auto shadow-inner">
            <ApplicationLetter
              application={mockApp}
              template={template}
              showActions={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
