import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "DAV University | Medical Leave Application Portal",
  description:
    "Official DAV University Medical Leave Application Portal. Apply for medical leave online, generate university-formatted PDF applications, and track departmental approvals.",
  icons: {
    icon: "/dav-logo.png",
    shortcut: "/dav-logo.png",
    apple: "/dav-logo.png",
  },
  keywords: [
    "DAV University",
    "Medical Leave",
    "Student Portal",
    "Jalandhar",
    "DAVU",
    "Academic Leave",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
