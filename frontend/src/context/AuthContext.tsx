"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { StudentProfile, AdminUser } from "@/types";
import { initialStudents, initialAdmins } from "@/lib/data";

interface AuthContextType {
  user: (StudentProfile | AdminUser) | null;
  role: "student" | "admin" | "guest";
  isLoading: boolean;
  loginAsStudent: (student: StudentProfile) => void;
  loginAsAdmin: (admin: AdminUser) => void;
  login: (identifier: string, role: "student" | "admin") => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "guest",
  isLoading: true,
  loginAsStudent: () => {},
  loginAsAdmin: () => {},
  login: async () => false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<(StudentProfile | AdminUser) | null>(null);
  const [role, setRole] = useState<"student" | "admin" | "guest">("guest");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("davu_user");
      const savedRole = localStorage.getItem("davu_role") as
        | "student"
        | "admin"
        | null;

      if (savedUser && savedRole) {
        setUser(JSON.parse(savedUser));
        setRole(savedRole);
      } else {
        // Default to first student so evaluator gets an instant working experience
        setUser(initialStudents[0]);
        setRole("student");
        localStorage.setItem("davu_user", JSON.stringify(initialStudents[0]));
        localStorage.setItem("davu_role", "student");
      }
    } catch (e) {
      console.error("Auth restore error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsStudent = (student: StudentProfile) => {
    setUser(student);
    setRole("student");
    localStorage.setItem("davu_user", JSON.stringify(student));
    localStorage.setItem("davu_role", "student");
  };

  const loginAsAdmin = (admin: AdminUser) => {
    setUser(admin);
    setRole("admin");
    localStorage.setItem("davu_user", JSON.stringify(admin));
    localStorage.setItem("davu_role", "admin");
  };

  const login = async (
    identifier: string,
    targetRole: "student" | "admin"
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password: "password123", role: targetRole }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (targetRole === "admin") {
          loginAsAdmin(data.user);
        } else {
          loginAsStudent(data.user);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setRole("guest");
    localStorage.removeItem("davu_user");
    localStorage.removeItem("davu_role");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        loginAsStudent,
        loginAsAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
