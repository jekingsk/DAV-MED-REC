import { MedicalLeaveApplication, TemplateConfig } from "../types";

export interface TemplateVariables {
  student_name: string;
  student_id: string;
  department: string;
  program: string;
  semester: string;
  section: string;
  academic_session: string;
  start_date: string;
  end_date: string;
  number_of_days: string | number;
  medical_reason: string;
  doctor_name: string;
  consultation_date: string;
  application_date: string;
  application_id: string;
  student_email: string;
  student_phone: string;
  parent_name: string;
}

export function extractVariablesFromApplication(
  app: Partial<MedicalLeaveApplication>
): TemplateVariables {
  return {
    student_name: app.studentName || "[Student Name]",
    student_id: app.studentId || "[Student ID]",
    department: app.department || "[Department]",
    program: app.program || "[Program]",
    semester: app.semester || "[Semester]",
    section: app.section || "A",
    academic_session: app.academicSession || "2026-2027",
    start_date: app.startDate ? formatDate(app.startDate) : "[Start Date]",
    end_date: app.endDate ? formatDate(app.endDate) : "[End Date]",
    number_of_days: app.numberOfDays ?? "[Days]",
    medical_reason: app.reason || "[Reason for Leave]",
    doctor_name: app.doctorName || "[Doctor Name / Hospital]",
    consultation_date: app.consultationDate
      ? formatDate(app.consultationDate)
      : "[Consultation Date]",
    application_date: app.applicationDate
      ? formatDate(app.applicationDate)
      : formatDate(new Date().toISOString().split("T")[0]),
    application_id: app.applicationId || "DAV-MED-TEMP",
    student_email: app.email || "[Email]",
    student_phone: app.phone || "[Phone]",
    parent_name: app.parentName || "[Parent Name]",
  };
}

export function renderTemplateText(
  text: string,
  variables: TemplateVariables
): string {
  if (!text) return "";
  let rendered = text;

  // Replace each {{placeholder}} or {{ placeholder }}
  Object.entries(variables).forEach(([key, val]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    rendered = rendered.replace(regex, String(val));
  });

  return rendered;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
