"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { AdminUser } from "@/types";
import {
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FolderCheck,
  ChevronDown,
  ChevronUp,
  FileCheck,
} from "lucide-react";

interface StoredProofItem {
  applicationId: string;
  filename: string;
  storedLocally: boolean;
  cloudinaryDeleted: boolean;
  status: string;
  error?: string;
}

export const AdminProofDownloader: React.FC = () => {
  const { user, role } = useAuth();
  const admin = role === "admin" ? (user as AdminUser) : null;

  const [statusMessage, setStatusMessage] = useState<string>("Synchronizing medical proofs...");
  const [statusType, setStatusType] = useState<"syncing" | "success" | "warning" | "idle">("syncing");
  const [isProcessing, setIsProcessing] = useState(false);
  const [storedResults, setStoredResults] = useState<StoredProofItem[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Prevent multiple concurrent sync runs
  const isSyncingRef = useRef(false);

  // Trigger backend synchronization to 'medical-proofs/'
  const runLocalProofSync = useCallback(async () => {
    if (!admin || isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsProcessing(true);
    setStatusType("syncing");
    setStatusMessage("Synchronizing medical proofs...");

    try {
      const res = await fetch("/api/admin/sync-medical-proofs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-uid": admin.id,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to synchronize proofs to local storage");
      }

      const results: StoredProofItem[] = data.results || [];
      if (results.length > 0) {
        setStoredResults((prev) => {
          const map = new Map<string, StoredProofItem>();
          for (const item of [...results, ...prev]) {
            map.set(item.applicationId, item);
          }
          return Array.from(map.values());
        });
      }

      // Display required concise messages (Section 10)
      if (data.failedCount > 0 && data.storedCount > 0) {
        setStatusType("warning");
        setStatusMessage(
          `${data.storedCount} proof${data.storedCount > 1 ? "s" : ""} stored locally. ${data.failedCount} proof could not be synchronized and will be retried.`
        );
      } else if (data.failedCount > 0) {
        setStatusType("warning");
        setStatusMessage(
          `${data.failedCount} proof(s) could not be synchronized and will be retried.`
        );
      } else if (data.storedCount > 0) {
        setStatusType("success");
        setStatusMessage(
          `${data.storedCount} new medical proof${data.storedCount > 1 ? "s" : ""} stored locally.`
        );
      } else {
        setStatusType("idle");
        setStatusMessage("No new medical proofs found.");
      }
    } catch (err: any) {
      console.error("[ProofSync] Execution error:", err);
      setStatusType("warning");
      setStatusMessage("Could not synchronize with local proof storage. Will retry automatically.");
    } finally {
      setIsProcessing(false);
      isSyncingRef.current = false;
    }
  }, [admin]);

  // Section 10: Automatic synchronization upon Admin login
  useEffect(() => {
    if (role === "admin" && admin) {
      runLocalProofSync();
    }
  }, [role, admin, runLocalProofSync]);

  if (role !== "admin") return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              statusType === "syncing"
                ? "bg-blue-50 text-blue-600 animate-spin"
                : statusType === "success"
                ? "bg-emerald-50 text-emerald-600"
                : statusType === "warning"
                ? "bg-amber-50 text-amber-600"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {statusType === "syncing" ? (
              <RefreshCw className="w-4 h-4" />
            ) : statusType === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : statusType === "warning" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <HardDrive className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                Local PC Proof Storage (medical-proofs/)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1">
                <FolderCheck className="w-3 h-3" />
                Admin Local Drive
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {statusMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => runLocalProofSync()}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
            title="Scan Firestore and synchronize proofs to local folder"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`}
            />
            {isProcessing ? "Syncing..." : "Sync Now"}
          </button>

          {storedResults.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <span>{storedResults.length} Processed</span>
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Synchronized Files Table */}
      {showDetails && storedResults.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Local Medical Proofs (medical-proofs/)
            </h4>
            <span className="text-[10px] text-slate-400">
              Admin PC Permanent Archive
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-3 py-2">Application ID</th>
                  <th className="px-3 py-2">Local File (medical-proofs/)</th>
                  <th className="px-3 py-2">Local Status</th>
                  <th className="px-3 py-2 text-right">Cloudinary Cleaned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {storedResults.map((item) => (
                  <tr key={item.applicationId} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {item.applicationId}
                    </td>
                    <td className="px-3 py-2 text-slate-600 truncate max-w-xs font-mono text-[10px]">
                      {item.filename || `${item.applicationId}_MedicalProof`}
                    </td>
                    <td className="px-3 py-2">
                      {item.storedLocally ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Saved to Disk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.cloudinaryDeleted ? (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                          Purged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Pending Deletion
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
