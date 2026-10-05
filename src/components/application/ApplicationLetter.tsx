"use client";

import React, { useRef } from "react";
import { MedicalLeaveApplication, TemplateConfig } from "@/types";
import { DavLogo } from "../common/DavLogo";
import { StatusBadge } from "../common/StatusBadge";
import {
  extractVariablesFromApplication,
  renderTemplateText,
  formatDate,
} from "@/lib/templateEngine";
import { defaultTemplate } from "@/lib/data";
import { Printer, Download, CheckCircle, ShieldCheck } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ApplicationLetterProps {
  application: Partial<MedicalLeaveApplication>;
  template?: TemplateConfig;
  showActions?: boolean;
  onEdit?: () => void;
  isOfficialView?: boolean;
}

export const ApplicationLetter: React.FC<ApplicationLetterProps> = ({
  application,
  template = defaultTemplate,
  showActions = true,
  onEdit,
  isOfficialView = false,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const vars = extractVariablesFromApplication(application);
  const renderedSubject = renderTemplateText(template.subject, vars);
  const renderedBody = renderTemplateText(template.body, vars);
  const renderedRecipient = renderTemplateText(template.recipient, vars);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `${vars.application_id}_${vars.student_name.replace(
        /\s+/g,
        "_"
      )}_Medical_Leave.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top action bar (hidden during print) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 mb-6 bg-white border border-slate-200 rounded-xl shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Document Status:
            </span>
            <StatusBadge
              status={application.status || "Draft"}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Edit Details
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Application
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? "Generating PDF..." : "Download PDF (A4)"}
            </button>
          </div>
        </div>
      )}

      {/* Official A4 Document Container */}
      <div
        ref={printRef}
        id="official-leave-document"
        className="relative mx-auto w-full max-w-[820px] bg-white border border-slate-300 shadow-lg rounded-sm p-8 sm:p-12 text-slate-900 font-sans print:border-none print:shadow-none print:p-6 print:m-0 print:max-w-none"
        style={{ minHeight: "1050px" }}
      >
        {/* Watermark Seal in Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none z-0">
          <img
            src="/dav-logo.png"
            alt="Official DAV Seal Watermark"
            className="w-80 h-auto object-contain select-none opacity-50"
          />
        </div>

        {/* Official Header */}
        <header className="relative z-10 pb-5 border-b-2 border-davu-red-600">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <DavLogo size="lg" showText={false} />
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  DAV UNIVERSITY
                </h1>
                <p className="text-xs font-semibold tracking-wide text-davu-red-600 uppercase">
                  JALANDHAR, PUNJAB, INDIA
                </p>
                <p className="text-[10px] text-slate-500">
                  Established under Punjab Act No. 8 of 2013 • NH-44, Sarmastpur, Jalandhar – 144012
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-2.5 py-1 text-[11px] font-bold tracking-wider text-davu-navy-800 bg-slate-100 border border-slate-300 rounded uppercase">
                Official Leave Record
              </div>
              <p className="mt-1 text-xs font-bold text-slate-800">
                {vars.application_id}
              </p>
              <p className="text-[11px] text-slate-500">
                Date: {vars.application_date}
              </p>
            </div>
          </div>
        </header>

        {/* Application Title & Reference */}
        <div className="relative z-10 mt-6 text-center">
          <span className="inline-block px-4 py-1 text-xs font-extrabold uppercase tracking-widest bg-davu-red-50 text-davu-red-700 border border-davu-red-200 rounded-full">
            FORMAL APPLICATION FOR MEDICAL LEAVE
          </span>
        </div>

        {/* Recipient Address */}
        <div className="relative z-10 mt-6 text-sm text-slate-800 leading-relaxed font-medium">
          <p className="font-bold text-slate-900">To,</p>
          <div className="whitespace-pre-line pl-3 border-l-2 border-slate-200 my-1">
            {renderedRecipient}
          </div>
        </div>

        {/* Subject Line */}
        <div className="relative z-10 mt-5 p-2.5 bg-slate-50 border-l-4 border-davu-red-600 rounded-r text-sm font-bold text-slate-900">
          <span>Subject: </span>
          <span className="text-slate-800">{renderedSubject}</span>
        </div>

        {/* Salutation */}
        <div className="relative z-10 mt-4 text-sm font-semibold text-slate-800">
          {template.salutation}
        </div>

        {/* Main Body */}
        <div className="relative z-10 mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line text-justify font-normal">
          {renderedBody}
        </div>

        {/* Structured Leave & Medical Summary Table */}
        <div className="relative z-10 mt-6 overflow-hidden border border-slate-200 rounded-lg">
          <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Submitted Medical & Academic Record
            </span>
            <span className="text-[11px] font-semibold text-davu-navy-700">
              Verified by Student Portal
            </span>
          </div>
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-white">
                <td className="px-3.5 py-2 font-semibold text-slate-500 w-1/3">
                  Student Name
                </td>
                <td className="px-3.5 py-2 font-bold text-slate-900">
                  {vars.student_name}
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-3.5 py-2 font-semibold text-slate-500">
                  Student ID / Roll No.
                </td>
                <td className="px-3.5 py-2 font-bold text-slate-900">
                  {vars.student_id}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-3.5 py-2 font-semibold text-slate-500">
                  Program & Department
                </td>
                <td className="px-3.5 py-2 text-slate-800">
                  {vars.program} ({vars.department})
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-3.5 py-2 font-semibold text-slate-500">
                  Semester & Section
                </td>
                <td className="px-3.5 py-2 text-slate-800">
                  {vars.semester} • Section {vars.section} (Session: {vars.academic_session})
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-3.5 py-2 font-semibold text-slate-500">
                  Leave Duration
                </td>
                <td className="px-3.5 py-2 font-bold text-davu-red-700">
                  {vars.start_date} to {vars.end_date} ({vars.number_of_days} Day(s))
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-3.5 py-2 font-semibold text-slate-500">
                  Reason for Illness
                </td>
                <td className="px-3.5 py-2 text-slate-900 font-medium">
                  {vars.medical_reason}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-3.5 py-2 font-semibold text-slate-500">
                  Consulting Doctor / Clinic
                </td>
                <td className="px-3.5 py-2 text-slate-800">
                  {vars.doctor_name} (Consulted: {vars.consultation_date})
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-3.5 py-2 font-semibold text-slate-500">
                  Attached Medical Certificate
                </td>
                <td className="px-3.5 py-2 text-slate-800 font-medium">
                  {application.medicalCertificateName || "Medical_Certificate.pdf"} (Uploaded)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Declaration Badge */}
        <div className="relative z-10 mt-4 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-md flex items-center gap-2 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Student Declaration Verified:</strong> The student has solemnly affirmed the accuracy of all submitted clinical records.
          </span>
        </div>

        {/* Signatures & University Endorsement Block */}
        <div className="relative z-10 mt-10 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-8">
            {/* Student Signature */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-8">
                Applicant Signature:
              </p>
              <div className="border-b border-dashed border-slate-400 w-48 mb-1.5 font-serif italic text-sm text-slate-800">
                {vars.student_name}
              </div>
              <p className="text-xs font-bold text-slate-900">
                {vars.student_name}
              </p>
              <p className="text-[11px] text-slate-500">
                Student ID: {vars.student_id}
              </p>
              <p className="text-[11px] text-slate-500">
                Contact: {vars.student_phone}
              </p>
            </div>

            {/* University Authorization Block */}
            <div className="text-right flex flex-col items-end">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                University Endorsement:
              </p>
              
              {/* Approval Stamp or Reviewer Info */}
              {application.status === "Approved" ? (
                <div className="my-2 p-2 border-2 border-emerald-600 rounded-md text-center max-w-[200px] bg-emerald-50/50">
                  <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                    DAV UNIVERSITY
                  </div>
                  <div className="text-xs font-extrabold text-emerald-700 uppercase">
                    MEDICAL LEAVE SANCTIONED
                  </div>
                  <div className="text-[9px] text-emerald-600 font-medium">
                    {application.reviewedBy || "Office of Dean Academics"}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {formatDate(application.reviewedAt || "")}
                  </div>
                </div>
              ) : (
                <div className="my-4 border border-dashed border-slate-300 w-48 h-16 flex items-center justify-center text-[10px] text-slate-400 font-medium uppercase">
                  Faculty / Medical Stamp
                </div>
              )}

              <p className="text-xs font-bold text-slate-800">
                Head of Department / Dean
              </p>
              <p className="text-[10px] text-slate-500">
                DAV University, Jalandhar
              </p>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <footer className="relative z-10 mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
          <span>{template.footerNotes.replace("{{application_id}}", vars.application_id)}</span>
          <span>System Generated • Page 1 of 1</span>
        </footer>
      </div>
    </div>
  );
};
