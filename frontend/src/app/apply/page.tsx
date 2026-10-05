import React from "react";
import { MedicalLeaveForm } from "@/components/application/MedicalLeaveForm";
import { Info, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Apply for Medical Leave | DAV University",
  description: "Submit online medical leave application for DAV University students.",
};

export default function ApplyPage() {
  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Apply for Medical Leave
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Complete the multi-step form below. Your formal university application will be automatically generated with official DAV University formatting.
          </p>
        </div>

        {/* Form Container */}
        <MedicalLeaveForm />
      </div>
    </div>
  );
}
