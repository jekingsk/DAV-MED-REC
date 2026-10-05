"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DavLogo } from "../common/DavLogo";
import { useAuth } from "@/context/AuthContext";
import { initialAdmins } from "@/lib/data";
import {
  FilePlus,
  Search,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  BookOpen,
  Lock,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, role, loginAsAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Apply for Medical Leave", href: "/apply" },
    { label: "Check Leave Status", href: "/track" },
    { label: "Guidelines & Rules", href: "/about" },
    ...(role === "admin"
      ? [
          { label: "Admin Console", href: "/admin" },
          { label: "All Applications", href: "/admin/applications" },
          { label: "Reports & Stats", href: "/admin/reports" },
          { label: "Template Config", href: "/admin/template" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Top University Branding Bar */}
      <div className="bg-davu-navy-900 text-white text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between border-b border-davu-navy-800">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-davu-gold-400">
            DAV UNIVERSITY, JALANDHAR
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300">
            Accredited by UGC • Punjab Act No. 8 of 2013
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <span className="hidden sm:inline">
            Helpline: <strong className="text-white">1800-1800-190</strong>
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="text-davu-gold-300">Medical Center: Ext. 240</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Portal Identity */}
          <Link href="/" className="flex items-center">
            <DavLogo size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "text-davu-red-600 bg-davu-red-50"
                      : "text-slate-700 hover:text-davu-red-600 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Faculty/Admin Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Direct Track Status button */}
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-davu-navy-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              Check Leave Status
            </Link>

            {/* Direct Apply button */}
            <Link
              href="/apply"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-davu-red-600 hover:bg-davu-red-700 rounded-lg transition-all shadow-xs"
            >
              <FilePlus className="w-3.5 h-3.5" />
              Apply for Leave
            </Link>

            {/* Faculty / Admin Login or Active Admin Indicator */}
            {role === "admin" ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-davu-navy-800 hover:bg-davu-navy-900 rounded-lg transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-davu-gold-400" />
                  <span>Admin Desk</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {adminMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-left text-xs animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setAdminMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                      <p className="font-bold text-slate-800">{user?.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {(user as any)?.role || "Faculty / Admin"}
                      </p>
                    </div>

                    <div className="p-1">
                      <Link
                        href="/admin"
                        onClick={() => setAdminMenuOpen(false)}
                        className="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/admin/applications"
                        onClick={() => setAdminMenuOpen(false)}
                        className="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
                      >
                        All Applications
                      </Link>
                      <Link
                        href="/admin/reports"
                        onClick={() => setAdminMenuOpen(false)}
                        className="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
                      >
                        Reports & Statistics
                      </Link>
                      <Link
                        href="/admin/template"
                        onClick={() => setAdminMenuOpen(false)}
                        className="block px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
                      >
                        Letter Template Config
                      </Link>
                    </div>

                    <div className="pt-1 mt-1 border-t border-slate-100 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setAdminMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out of Admin
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded-lg transition-colors"
                title="Faculty & Administrator Login"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Faculty Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
            <Link
              href="/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-bold text-white bg-davu-red-600 rounded-lg"
            >
              Apply for Medical Leave (No Login)
            </Link>
            <Link
              href="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-bold text-slate-800 bg-slate-100 rounded-lg"
            >
              Check Leave Status (Reg No, Name & Father)
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Faculty / Administrator Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
