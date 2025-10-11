"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login as loginApi, LoginResponse } from "@/service/authApi";

interface AuthState {
  userId: string | number | null;
  role: string | null;
  user: {
    userId: string | number;
    email: string;
    fullName: string;
  } | null;
}

interface AuthContextType {
  auth: AuthState;
  login: (
    email: string,
    password: string,
    // Bỏ redirectTo khỏi định nghĩa vì không dùng nữa, nhưng để optional cho an toàn
    redirectTo?: string
  ) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    userId: null,
    role: null,
    user: null,
  });
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Phần useEffect này giữ nguyên
    const saved = localStorage.getItem("uniclub-auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { token: string } & LoginResponse;
        const normalizeRole = (r?: string | null) => {
          if (!r) return null;
          const lower = String(r).toLowerCase();
          const map: Record<string, string> = {
            student: "student",
            member: "member",
            club_manager: "club_leader",
            "club manager": "club_leader",
            uni_admin: "uni_staff",
            university_admin: "uni_staff",
            university_staff: "uni_staff",
            "university staff": "uni_staff",
            admin: "admin",
            staff: "staff",
          };
          return map[lower] || lower;
        };

        setAuth({
          userId: parsed.userId,
          role: normalizeRole(parsed.role),
          user: {
            userId: parsed.userId,
            email: parsed.email,
            fullName: parsed.fullName,
          },
        });
        localStorage.setItem("jwtToken", parsed.token);
      } catch (err) {
        console.warn("Failed to parse stored auth", err);
      }
    }
    setInitialized(true);
  }, []);

  const login = async (
    email: string,
    password: string,
    // tham số redirectTo giờ không còn quan trọng
    redirectTo?: string 
  ): Promise<boolean> => {
    try {
      const res: LoginResponse = await loginApi({ email, password });
      localStorage.setItem("uniclub-auth", JSON.stringify(res));
      localStorage.setItem("jwtToken", res.token);

      const normalizeRole = (r?: string | null) => {
        if (!r) return null;
        const lower = String(r).toLowerCase();
        const map: Record<string, string> = {
          student: "student",
          member: "member",
          club_manager: "club_leader",
          "club manager": "club_leader",
          uni_admin: "uni_staff",
          university_admin: "uni_staff",
          university_staff: "uni_staff",
          "university staff": "uni_staff",
          admin: "admin",
          staff: "staff",
        };
        return map[lower] || lower;
      };
      const normalizedRole = normalizeRole(res.role);

      setAuth({
        userId: res.userId,
        role: normalizedRole,
        user: {
          userId: res.userId,
          email: res.email,
          fullName: res.fullName,
        },
      });

      // ⭐ LOGIC ĐIỀU HƯỚNG MỚI, CHẮC CHẮN VÀ ĐƠN GIẢN
      
      // 1. Luôn kiểm tra sessionStorage trước tiên
      const intendedPath = sessionStorage.getItem('intendedPath');

      if (intendedPath) {
        console.log(`AuthContext: Tìm thấy intendedPath trong sessionStorage: ${intendedPath}`);
        // Xóa ngay sau khi đọc để lần đăng nhập sau không bị ảnh hưởng
        sessionStorage.removeItem('intendedPath'); 
        router.push(intendedPath);
      } else {
        // 2. Nếu không có, mới fallback về trang theo role
        const redirectMap: Record<string, string> = {
          member: "/member",
          student: "/student",
          club_leader: "/club-leader",
          uni_staff: "/uni-staff",
          admin: "/admin",
          staff: "/staff",
        };
        const fallbackPath = redirectMap[normalizedRole || ""] || "/member";
        console.log(`AuthContext: Không có intendedPath, điều hướng mặc định tới: ${fallbackPath}`);
        router.push(fallbackPath);
      }

      return true;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  };

  const logout = () => {
    setAuth({ userId: null, role: null, user: null });
    localStorage.removeItem("clubly-membership-applications");
    localStorage.removeItem("uniclub-auth");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("uniclub-member-staff");
    sessionStorage.removeItem("intendedPath"); // Dọn dẹp khi logout
    router.push("/");
  };

  const isAuthenticated = auth.userId !== null && auth.role !== null;

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
        isAuthenticated,
        initialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}