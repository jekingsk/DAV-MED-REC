"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DavLogo } from "@/components/common/DavLogo";
import { initialAdmins } from "@/lib/data";
import Link from "next/link";
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FilePlus,
  Search,
  CheckCircle2,
  Info,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsAdmin } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in faculty email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const success = await login(identifier, "admin");
      if (success) {
        router.push("/admin");
      } else {
        setError("Invalid faculty credentials. You can use the 1-click test accounts below.");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <DavLogo size="lg" className="justify-center mb-4" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          DAV University Administration Desk
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Faculty, Dean of Academic Affairs, and Medical Officer Access
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        {/* Notice for Students: NO LOGIN REQUIRED */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Students: No Login Required
              </h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                You do not need a password or login account. You can apply for medical leave directly or track all your applications by entering your <strong>Registration Number</strong>, <strong>Name</strong>, and <strong>Father's Name</strong>.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-lg transition-colors shadow-2xs"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  Apply for Leave
                </Link>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  Check Leave Status
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Faculty Login Card */}
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-davu-navy-800" />
            <h3 className="text-sm font-bold text-slate-900">
              Authorized University Staff Login
            </h3>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Faculty Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="dean.academics@davuniversity.org"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-davu-navy-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-lg transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Sign In to Admin Console"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick 1-Click Faculty Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-3">
              1-Click Demo Faculty Accounts
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  loginAsAdmin(initialAdmins[0]);
                  router.push("/admin");
                }}
                className="w-full text-left p-2.5 border border-slate-200 hover:border-davu-navy-300 rounded-xl bg-slate-50 hover:bg-davu-navy-50/50 transition-colors flex items-center justify-between"
              >
                <div className="text-xs">
                  <p className="font-bold text-slate-800">
                    Dr. Rajesh Kumar
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Dean of Academic Affairs
                  </p>
                </div>
                <span className="text-[10px] font-bold text-davu-navy-700">
                  Enter Console →
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  loginAsAdmin(initialAdmins[2]);
                  router.push("/admin");
                }}
                className="w-full text-left p-2.5 border border-slate-200 hover:border-davu-navy-300 rounded-xl bg-slate-50 hover:bg-davu-navy-50/50 transition-colors flex items-center justify-between"
              >
                <div className="text-xs">
                  <p className="font-bold text-slate-800">
                    Dr. Harshita Batra
                  </p>
                  <p className="text-[10px] text-slate-500">
                    University Medical Officer
                  </p>
                </div>
                <span className="text-[10px] font-bold text-davu-navy-700">
                  Enter Console →
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
