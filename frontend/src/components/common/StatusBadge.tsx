import React from "react";
import { ApplicationStatus } from "@/types";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  FileEdit,
} from "lucide-react";

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case "Approved":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-600/20",
          dot: "bg-emerald-500",
          icon: CheckCircle2,
          label: "Approved",
        };
      case "Rejected":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-300 ring-rose-600/20",
          dot: "bg-rose-500",
          icon: XCircle,
          label: "Rejected",
        };
      case "Under Review":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-300 ring-amber-600/20",
          dot: "bg-amber-500 animate-pulse",
          icon: AlertTriangle,
          label: "Under Review",
        };
      case "Returned for Correction":
        return {
          bg: "bg-purple-50 text-purple-800 border-purple-300 ring-purple-600/20",
          dot: "bg-purple-500",
          icon: RotateCcw,
          label: "Returned for Correction",
        };
      case "Draft":
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-300 ring-slate-600/20",
          dot: "bg-slate-400",
          icon: FileEdit,
          label: "Draft",
        };
      case "Submitted":
      default:
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-300 ring-blue-600/20",
          dot: "bg-blue-500",
          icon: Clock,
          label: "Submitted",
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold gap-1",
    md: "px-2.5 py-1 text-xs font-bold gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-bold gap-2",
  };

  return (
    <span
      className={`inline-flex items-center border rounded-full font-medium ring-1 shadow-xs transition-all ${
        config.bg
      } ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
