import React from "react";
import Link from "next/link";
import { DavLogo } from "../common/DavLogo";
import { Phone, Mail, MapPin, ExternalLink, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 print:hidden">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: University Info */}
          <div className="md:col-span-2 space-y-4">
            <DavLogo variant="dark" size="lg" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              DAV University is a premier multidisciplinary institution established under Punjab Act No. 8 of 2013, continuing the glorious 135+ years tradition of the DAV College Managing Committee (DAVCMC) to deliver value-based higher education.
            </p>
            <div className="pt-2 flex flex-col space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-davu-red-500 flex-shrink-0" />
                <span>NH-44, Sarmastpur, Jalandhar – 144012, Punjab, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-davu-red-500 flex-shrink-0" />
                <span>Toll Free Helpline: 1800-1800-190 • Medical Center: Ext. 240</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-davu-red-500 flex-shrink-0" />
                <span>medical.leave@davuniversity.org</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Student Services
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/apply"
                  className="hover:text-davu-red-400 transition-colors"
                >
                  Apply for Medical Leave
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="hover:text-davu-red-400 transition-colors"
                >
                  Track Application Status
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-davu-red-400 transition-colors"
                >
                  Student Portal Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/my-applications"
                  className="hover:text-davu-red-400 transition-colors"
                >
                  My Medical Applications
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-davu-red-400 transition-colors"
                >
                  Student Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: University Admin & Policies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Faculty & Administration
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/admin"
                  className="hover:text-davu-red-400 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-davu-gold-400" />
                  Admin Faculty Panel
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/applications"
                  className="hover:text-davu-red-400 transition-colors"
                >
                  Review Applications
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/reports"
                  className="hover:text-davu-red-400 transition-colors"
                >
                  Medical Leave Reports
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/template"
                  className="hover:text-davu-red-400 transition-colors"
                >
                  Application Template Editor
                </Link>
              </li>
              <li>
                <a
                  href="https://davuniversity.org"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-davu-red-400 transition-colors flex items-center gap-1"
                >
                  Main DAVU Website
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-slate-950 py-4 text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} DAV University, Jalandhar. All rights reserved.
          </p>
          <p className="flex items-center gap-3">
            <span>Attendance & Medical Regulations Compliance</span>
            <span>•</span>
            <span>Confidential Medical Records System</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
