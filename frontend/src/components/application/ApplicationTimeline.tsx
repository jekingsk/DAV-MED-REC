import React from "react";
import { TimelineEvent, ApplicationStatus } from "@/types";
import { formatDate } from "@/lib/templateEngine";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  XCircle,
  FileCheck,
} from "lucide-react";

interface ApplicationTimelineProps {
  timeline: TimelineEvent[];
  currentStatus: ApplicationStatus;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  timeline,
  currentStatus,
}) => {
  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "Rejected":
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case "Returned for Correction":
        return <RotateCcw className="w-5 h-5 text-purple-600" />;
      case "Under Review":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "Submitted":
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusBg = (status: ApplicationStatus) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 border-emerald-300";
      case "Rejected":
        return "bg-rose-100 border-rose-300";
      case "Returned for Correction":
        return "bg-purple-100 border-purple-300";
      case "Under Review":
        return "bg-amber-100 border-amber-300";
      case "Submitted":
      default:
        return "bg-blue-100 border-blue-300";
    }
  };

  return (
    <div className="flow-root py-4">
      <ul className="-mb-8">
        {timeline.map((event, eventIdx) => {
          const isLast = eventIdx === timeline.length - 1;
          const isFinalApproved = event.status === "Approved";
          const isFinalRejected = event.status === "Rejected";

          return (
            <li key={event.id || eventIdx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3.5">
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border shadow-2xs ${getStatusBg(
                      event.status
                    )}`}
                  >
                    {getStatusIcon(event.status)}
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {event.title}
                      </p>
                      <time className="text-xs text-slate-500 font-medium">
                        {formatDate(event.timestamp)} •{" "}
                        {new Date(event.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>

                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {event.description}
                    </p>

                    {event.remarks && (
                      <div className="mt-2 p-2.5 bg-slate-50 border-l-3 border-davu-red-500 rounded-r text-xs text-slate-800">
                        <span className="font-semibold text-davu-navy-900">
                          Remarks / Note:{" "}
                        </span>
                        {event.remarks}
                      </div>
                    )}

                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span>Action by:</span>
                      <span className="font-medium text-slate-600">
                        {event.actor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
