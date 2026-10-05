"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApplicationLetter } from "./ApplicationLetter";
import { MedicalLeaveApplication, StudentProfile } from "@/types";
import {
  User,
  Calendar,
  Stethoscope,
  FileCheck,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

interface FormState {
  // Step 1
  studentName: string;
  studentId: string;
  email: string;
  phone: string;
  parentName: string;
  program: string;
  department: string;
  semester: string;
  section: string;
  academicSession: string;

  // Step 2
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  applicationDate: string;

  // Step 3
  doctorName: string;
  consultationDate: string;
  treatmentDetails: string;
  medicalCertificateName: string;
  medicalCertificateUrl: string;
  medicalCertificateSize: string;

  // Step 4
  declarationAccepted: boolean;
}

const DEPARTMENTS = [
  "Department of Computer Science & Engineering",
  "Department of Civil Engineering",
  "Department of Mechanical Engineering",
  "Department of Electrical Engineering",
  "Department of Biotechnology",
  "DAV University Institute of Management",
  "Department of Pharmaceutical Sciences",
  "Department of Agriculture & Environmental Sciences",
  "Department of Journalism & Mass Communication",
  "Department of Law",
];

const SEMESTERS = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
];

export const MedicalLeaveForm: React.FC = () => {
  const { user, role } = useAuth();
  const student = role === "student" ? (user as StudentProfile) : null;

  const [step, setStep] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<MedicalLeaveApplication | null>(null);

  const [formData, setFormData] = useState<FormState>({
    studentName: "",
    studentId: "",
    email: "",
    phone: "",
    parentName: "",
    program: "B.Tech Computer Science & Engineering",
    department: "Department of Computer Science & Engineering",
    semester: "5th Semester",
    section: "A",
    academicSession: "2026-2027",

    leaveType: "Medical Leave",
    startDate: "",
    endDate: "",
    numberOfDays: 0,
    reason: "",
    applicationDate: new Date().toISOString().split("T")[0],

    doctorName: "",
    consultationDate: "",
    treatmentDetails: "",
    medicalCertificateName: "",
    medicalCertificateUrl: "",
    medicalCertificateSize: "",

    declarationAccepted: false,
  });

  // Pre-fill profile info if student is logged in
  useEffect(() => {
    if (student) {
      setFormData((prev) => ({
        ...prev,
        studentName: student.name || prev.studentName,
        studentId: student.studentId || prev.studentId,
        email: student.email || prev.email,
        phone: student.phone || prev.phone,
        parentName: student.parentName || prev.parentName,
        program: student.program || prev.program,
        department: student.department || prev.department,
        semester: student.semester || prev.semester,
        section: student.section || prev.section,
        academicSession: student.academicSession || prev.academicSession,
      }));
    }
  }, [student]);

  // Auto-calculate number of days when start or end date changes
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const s = new Date(formData.startDate);
      const e = new Date(formData.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        if (e >= s) {
          const diffTime = Math.abs(e.getTime() - s.getTime());
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          setFormData((prev) => ({ ...prev, numberOfDays: days }));
          setErrors((prev) => {
            const next = { ...prev };
            delete next.endDate;
            return next;
          });
        } else {
          setFormData((prev) => ({ ...prev, numberOfDays: 0 }));
          setErrors((prev) => ({
            ...prev,
            endDate: "End date cannot be earlier than start date.",
          }));
        }
      }
    }
  }, [formData.startDate, formData.endDate]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear field-specific error
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        medicalCertificate: "File size exceeds 5MB limit. Please upload a smaller document.",
      }));
      return;
    }

    // Valid extensions
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        medicalCertificate: "Only PDF, JPG, JPEG, and PNG files are accepted.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
      setFormData((prev) => ({
        ...prev,
        medicalCertificateName: file.name,
        medicalCertificateUrl: reader.result as string,
        medicalCertificateSize: sizeStr,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.medicalCertificate;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      medicalCertificateName: "",
      medicalCertificateUrl: "",
      medicalCertificateSize: "",
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.studentName.trim()) newErrors.studentName = "Please enter your Full Name.";
      if (!formData.studentId.trim()) newErrors.studentId = "Please enter your Student ID / Roll No.";
      if (!formData.email.trim() || !formData.email.includes("@")) {
        newErrors.email = "Please enter a valid university email address.";
      }
      if (!formData.phone.trim() || formData.phone.length < 10) {
        newErrors.phone = "Please enter a valid 10-digit mobile number.";
      }
      if (!formData.parentName.trim()) {
        newErrors.parentName = "Please enter your Father's Name.";
      }
      if (!formData.department) newErrors.department = "Please select your department.";
      if (!formData.program.trim()) newErrors.program = "Please enter your degree program.";
    }

    if (currentStep === 2) {
      if (!formData.startDate) newErrors.startDate = "Please select leave start date.";
      if (!formData.endDate) newErrors.endDate = "Please select leave end date.";
      if (formData.startDate && formData.endDate) {
        const s = new Date(formData.startDate);
        const e = new Date(formData.endDate);
        if (e < s) {
          newErrors.endDate = "End date cannot be earlier than start date.";
        }
      }
      if (!formData.reason.trim() || formData.reason.length < 5) {
        newErrors.reason = "Please describe the reason for your medical leave.";
      }
    }

    if (currentStep === 3) {
      if (!formData.doctorName.trim()) newErrors.doctorName = "Please enter Doctor / Hospital name.";
      if (!formData.consultationDate) {
        newErrors.consultationDate = "Please specify date of medical consultation.";
      }
      if (!formData.medicalCertificateUrl) {
        newErrors.medicalCertificate = "Please upload your medical certificate or prescription.";
      }
    }

    if (currentStep === 4) {
      if (!formData.declarationAccepted) {
        newErrors.declarationAccepted =
          "You must confirm the truthfulness declaration before submitting.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          studentDbId: student?.id || "std-guest",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit medical leave application.");
      }

      setSubmittedApp(data.application);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, submit: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // If application is successfully submitted, show Step 5 confirmation screen!
  if (submittedApp) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-10 text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Application Submitted Successfully!
          </h2>
          <p className="mt-2 text-slate-600 max-w-lg mx-auto text-sm leading-relaxed">
            Your medical leave application has been securely recorded and queued for university medical and departmental verification.
          </p>

          <div className="mt-6 inline-block bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Official Application ID
            </span>
            <span className="text-xl sm:text-2xl font-black text-davu-red-600 tracking-wide">
              {submittedApp.applicationId}
            </span>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl max-w-lg mx-auto text-xs text-amber-900">
            <strong>No login needed:</strong> You can check this application and all your past applications anytime by entering your <strong>Registration Number ({submittedApp.studentId})</strong>, <strong>Name</strong>, and <strong>Father's Name</strong> on the tracking page.
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/track?id=${submittedApp.applicationId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              Track This Application
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-xl transition-all shadow-xs"
            >
              <User className="w-4 h-4 text-davu-gold-400" />
              Check All My Applications
            </Link>
          </div>
        </div>

        {/* Generated Formal Application Letter Preview & PDF Download */}
        <div className="mt-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Generated University Medical Leave Document
            </h3>
            <p className="text-xs text-slate-500">
              You can download, preview, or print your official formatted application anytime.
            </p>
          </div>
          <ApplicationLetter application={submittedApp} showActions={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Stepper Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, title: "Student Info", icon: User },
            { num: 2, title: "Leave Details", icon: Calendar },
            { num: 3, title: "Medical Details", icon: Stethoscope },
            { num: 4, title: "Preview & Submit", icon: FileCheck },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isCompleted = step > item.num;
            const isCurrent = step === item.num;

            return (
              <div
                key={item.num}
                className="flex flex-col items-center flex-1 relative cursor-pointer"
                onClick={() => {
                  if (item.num < step) setStep(item.num);
                }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 z-10 ${
                    isCurrent
                      ? "bg-davu-red-600 text-white ring-4 ring-davu-red-100 shadow-md"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold text-center transition-colors ${
                    isCurrent
                      ? "text-davu-red-600"
                      : isCompleted
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {item.title}
                </span>

                {/* Connecting line */}
                {idx < 3 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 transition-colors duration-300 ${
                      step > item.num ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Multi-Step Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        {errors.submit && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Submission Error</p>
              <p>{errors.submit}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Student Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Step 1: Student & Academic Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct submission — No login or password required.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                No Login Required
              </div>
            </div>

            {/* Test Autofill Chips for Instant Verification */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <span className="font-bold text-slate-700">Quick Test Autofill:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      studentName: "Rahul Verma",
                      studentId: "DAVU/2023/CSE/1042",
                      email: "rahul.verma@davuniversity.org",
                      phone: "+91 98765 43210",
                      parentName: "Sh. Rakesh Verma",
                      program: "B.Tech Computer Science & Engineering",
                      department: "Department of Computer Science & Engineering",
                      semester: "5th Semester",
                      section: "CSE-A",
                    }))
                  }
                  className="px-2.5 py-1 bg-white hover:bg-davu-red-50 text-davu-red-700 border border-slate-200 hover:border-davu-red-200 rounded-md font-semibold transition-colors"
                >
                  Rahul Verma
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      studentName: "Priya Sharma",
                      studentId: "DAVU/2024/BIO/2015",
                      email: "priya.sharma@davuniversity.org",
                      phone: "+91 98123 45678",
                      parentName: "Sh. Anand Sharma",
                      program: "B.Sc Biotechnology (Hons.)",
                      department: "Department of Biotechnology",
                      semester: "3rd Semester",
                      section: "BIO-1",
                    }))
                  }
                  className="px-2.5 py-1 bg-white hover:bg-davu-red-50 text-davu-red-700 border border-slate-200 hover:border-davu-red-200 rounded-md font-semibold transition-colors"
                >
                  Priya Sharma
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      studentName: "Gurpreet Singh",
                      studentId: "DAVU/2023/MBA/3088",
                      email: "gurpreet.singh@davuniversity.org",
                      phone: "+91 97800 11223",
                      parentName: "S. Balwinder Singh",
                      program: "Master of Business Administration (MBA)",
                      department: "DAV University Institute of Management",
                      semester: "3rd Semester",
                      section: "MBA-Finance",
                    }))
                  }
                  className="px-2.5 py-1 bg-white hover:bg-davu-red-50 text-davu-red-700 border border-slate-200 hover:border-davu-red-200 rounded-md font-semibold transition-colors"
                >
                  Gurpreet Singh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Verma"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                    errors.studentName ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.studentName && (
                  <p className="text-xs text-rose-500 mt-1">{errors.studentName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registration No. / Student ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="e.g. DAVU/2023/CSE/1042"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 font-mono ${
                    errors.studentId ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.studentId && (
                  <p className="text-xs text-rose-500 mt-1">{errors.studentId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Father's Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  placeholder="e.g. Sh. Rakesh Verma"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                    errors.parentName ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.parentName ? (
                  <p className="text-xs text-rose-500 mt-1">{errors.parentName}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used to track application status securely without a password
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  University Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. rahul.verma@davuniversity.org"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                    errors.email ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                    errors.phone ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.phone && (
                  <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Degree / Program <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                    errors.program ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.program && (
                  <p className="text-xs text-rose-500 mt-1">{errors.program}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
                  >
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Leave Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Step 2: Leave Period & Reason
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your required leave dates. Total days will be calculated automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Type of Leave
                </label>
                <input
                  type="text"
                  name="leaveType"
                  value={formData.leaveType}
                  readOnly
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-600 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Application
                </label>
                <input
                  type="date"
                  name="applicationDate"
                  value={formData.applicationDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Leave Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                    errors.startDate ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.startDate && (
                  <p className="text-xs text-rose-500 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Leave End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                    errors.endDate ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.endDate && (
                  <p className="text-xs text-rose-500 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Calculated Days Banner */}
            <div className="p-4 bg-davu-navy-50/70 border border-davu-navy-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-davu-navy-800 uppercase tracking-wider block">
                  Calculated Duration
                </span>
                <span className="text-xs text-slate-600">
                  Inclusive calendar days requested
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-davu-red-600">
                  {formData.numberOfDays}
                </span>
                <span className="text-sm font-bold text-slate-700">Day(s)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason for Leave / Symptoms <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Describe your medical condition (e.g. Acute Viral Fever with severe body ache, advised complete rest by doctor)"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                  errors.reason ? "border-rose-400 bg-rose-50" : "border-slate-300"
                }`}
              />
              {errors.reason && (
                <p className="text-xs text-rose-500 mt-1">{errors.reason}</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Medical Information & File Upload */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Step 3: Medical & Doctor Information
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide attending physician details and upload your medical certificate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Doctor / Hospital / Clinic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="doctorName"
                  value={formData.doctorName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. A. K. Joshi (Civil Hospital, Jalandhar)"
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                    errors.doctorName ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.doctorName && (
                  <p className="text-xs text-rose-500 mt-1">{errors.doctorName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Consultation Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="consultationDate"
                  value={formData.consultationDate}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600 ${
                    errors.consultationDate ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
                {errors.consultationDate && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.consultationDate}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Treatment / Prescription Details (Optional)
              </label>
              <textarea
                rows={2}
                name="treatmentDetails"
                value={formData.treatmentDetails}
                onChange={handleChange}
                placeholder="Prescribed medicines, diagnostic lab tests, clinical rest advice"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
              />
            </div>

            {/* Medical Certificate Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Upload Medical Certificate / Prescription <span className="text-rose-500">*</span>
              </label>

              {!formData.medicalCertificateUrl ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center hover:bg-slate-50 transition-colors ${
                    errors.medicalCertificate
                      ? "border-rose-300 bg-rose-50/50"
                      : "border-slate-300"
                  }`}
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Click to upload or drag & drop certificate
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepted formats: PDF, JPG, JPEG, PNG (Max size: 5MB)
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="medical-cert-input"
                  />
                  <label
                    htmlFor="medical-cert-input"
                    className="mt-3 inline-block px-4 py-2 text-xs font-bold text-davu-red-600 bg-davu-red-50 border border-davu-red-200 rounded-lg cursor-pointer hover:bg-davu-red-100 transition-colors"
                  >
                    Select File
                  </label>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-davu-red-100 text-davu-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {formData.medicalCertificateName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Size: {formData.medicalCertificateSize} • Document Ready
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {errors.medicalCertificate && (
                <p className="text-xs text-rose-500 mt-1">
                  {errors.medicalCertificate}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Live Application Preview & Declaration */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Step 4: Formal Letter Preview & Declaration
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Carefully review the generated university application before final submission.
              </p>
            </div>

            {/* Generated Letter Preview */}
            <div className="p-2 sm:p-4 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto">
              <ApplicationLetter
                application={{
                  ...formData,
                  applicationId: "DAV-MED-2026-PREVIEW",
                  status: "Draft",
                }}
                showActions={false}
              />
            </div>

            {/* Declaration Checkbox */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="declarationAccepted"
                  checked={formData.declarationAccepted}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-davu-red-600 rounded border-slate-300 focus:ring-davu-red-500"
                />
                <span className="text-xs text-slate-800 leading-relaxed font-medium">
                  <strong>Declaration:</strong> I hereby declare that the information provided by me is true and correct to the best of my knowledge. I understand that the university may verify the submitted medical documents and take appropriate action if any information is found to be incorrect.
                </span>
              </label>
              {errors.declarationAccepted && (
                <p className="text-xs text-rose-600 mt-2 font-semibold">
                  {errors.declarationAccepted}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-lg transition-colors shadow-xs"
            >
              Continue to Step {step + 1}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-extrabold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-lg transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting to University...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Medical Leave Application
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
