"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login as loginApi, LoginResponse, loginWithGoogleToken } from "@/service/authApi";
import { safeSessionStorage, safeLocalStorage } from "@/lib/browser-utils";
import { ClientOnlyWrapper } from "@/components/client-only-wrapper";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface AuthState {
  userId: string | number | null;
  role: string | null;
  staff: boolean;
  
  user: {
    userId: string | number;
    email: string;
    fullName: string;
    role: string;
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
  loginWithGoogle: (googleToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    userId: null,
    role: null,
    staff: false,
    user: null,
  });
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  // Eager prefetch dashboard routes for instant login redirect
  useEffect(() => {
    const prefetchDashboards = () => {
      const dashboards = ['/profile', '/club-leader', '/uni-staff', '/admin', '/staff'];
      dashboards.forEach(path => router.prefetch(path));
    };
    
    // Prefetch after a short delay to not block initial render
    const timer = setTimeout(prefetchDashboards, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Phần useEffect này giữ nguyên nhưng dùng safe storage
    const saved = safeSessionStorage.getItem("uniclub-auth");

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { token: string } & LoginResponse;
        const normalizeRole = (r?: string | null) => {
          if (!r) return null;
          const lower = String(r).toLowerCase();
          const map: Record<string, string> = {
            member: "student",
            student: "student",
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

        const normalizedRole = normalizeRole(parsed.role);
        setAuth({
          userId: parsed.userId,
          role: normalizedRole,
          staff: (parsed as any).staff || false,
          user: {
            userId: parsed.userId,
            email: parsed.email,
            fullName: parsed.fullName,
            role: normalizedRole || "",
          },
        });

        safeSessionStorage.setItem("jwtToken", parsed.token);
      } catch (err) {
        console.warn("Failed to parse stored auth", err);
      }
    }
    setInitialized(true);
  }, []);

  // Helper function để xử lý login response chung
  const processLoginResponse = (res: LoginResponse) => {
    safeSessionStorage.setItem("uniclub-auth", JSON.stringify(res));
    safeSessionStorage.setItem("jwtToken", res.token);

    const normalizeRole = (r?: string | null) => {
      if (!r) return null;
      const lower = String(r).toLowerCase();
      const map: Record<string, string> = {
        member: "student",
        student: "student",
        club_manager: "club_leader",
        "club manager": "club_leader",
        club_leader: "club_leader",
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

    // Save role for password reset check
    if (normalizedRole) {
      sessionStorage.setItem("userRole", normalizedRole.toUpperCase());
    }

    // Log response structure for debugging
    console.log(" [Auth] Processing login response:", {
      role: normalizedRole,
      hasClubId: res.clubId !== undefined,
      hasClubIds: res.clubIds !== undefined,
      clubId: res.clubId,
      clubIds: res.clubIds,
      requirePasswordChange: res.requirePasswordChange
    });

    setAuth({
      userId: res.userId,
      role: normalizedRole,
      staff: res.staff || false,
      user: {
        userId: res.userId,
        email: res.email,
        fullName: res.fullName,
        role: normalizedRole || "",
      },
    });

    return normalizedRole;
  };

  const login = async (
    email: string,
    password: string,
    // tham số redirectTo giờ không còn quan trọng
    redirectTo?: string
  ): Promise<boolean> => {
    try {
      const res: LoginResponse = await loginApi({ email, password });
      const normalizedRole = processLoginResponse(res);

      // ⭐ LOGIC ĐIỀU HƯỚNG THÔNG MINH

      // 1. Kiểm tra có intendedPath được lưu từ trang checkin không (chỉ lưu cho student/checkin/[code])

      const intendedPath = safeSessionStorage.getItem("intendedPath");

      // Determine redirect path
      let redirectPath: string;
      if (intendedPath) {
        console.log(
          `AuthContext: Tìm thấy intendedPath (từ checkin page): ${intendedPath}`
        );
        // Xóa ngay sau khi đọc để lần đăng nhập sau không bị ảnh hưởng
        safeSessionStorage.removeItem("intendedPath");
        redirectPath = intendedPath;
      } else {
        // 2. Không có intendedPath (người dùng đăng nhập từ trang chủ hoặc trang khác)
        const redirectMap: Record<string, string> = {
          student: "/profile",
          club_leader: "/club-leader",
          uni_staff: "/uni-staff",
          admin: "/admin",
          staff: "/staff",
        };
        redirectPath = redirectMap[normalizedRole || ""] || "/student";
        console.log(
          `AuthContext: Không có intendedPath, điều hướng mặc định tới: ${redirectPath}`
        );
      }

      // Prefetch and navigate with transition for instant redirect
      router.prefetch(redirectPath);
      startTransition(() => {
        router.replace(redirectPath); // Use replace instead of push for faster login redirect
      });

      return true;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  };

  const loginWithGoogle = async (googleToken: string): Promise<boolean> => {
    try {
      const res: LoginResponse = await loginWithGoogleToken({ token: googleToken });
      const normalizedRole = processLoginResponse(res);

      // ⭐ LOGIC ĐIỀU HƯỚNG THÔNG MINH (giống như login thường)
      const intendedPath = safeSessionStorage.getItem("intendedPath");

      // Determine redirect path
      let redirectPath: string;
      if (intendedPath) {
        console.log(
          `AuthContext: Tìm thấy intendedPath (từ checkin page): ${intendedPath}`
        );
        safeSessionStorage.removeItem("intendedPath");
        redirectPath = intendedPath;
      } else {
        const redirectMap: Record<string, string> = {
          student: "/profile",
          club_leader: "/club-leader",
          uni_staff: "/uni-staff",
          admin: "/admin",
          staff: "/staff",
        };
        redirectPath = redirectMap[normalizedRole || ""] || "/student";
        console.log(
          `AuthContext: Google login - điều hướng mặc định tới: ${redirectPath}`
        );
      }

      // Prefetch and navigate with transition for instant redirect
      router.prefetch(redirectPath);
      startTransition(() => {
        router.replace(redirectPath); // Use replace instead of push for faster Google login redirect
      });

      return true;
    } catch (err) {
      console.error("Google login failed", err);
      return false;
    }
  };

  // Trong file AuthContext của bạn

  const logout = async () => {
    // --- Bước 0: Clear chatbot conversation history from Redis ---
    try {
      const saved = safeSessionStorage.getItem("uniclub-auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        const userId = parsed.userId || parsed.id;
        if (userId) {
          await axios.delete(`/api/chatbot/history?userId=${userId}`);
        }
      }
    } catch (error) {
      console.error(" Logout: Error clearing chatbot history:", error);
      // Continue with logout even if this fails
    }

    // --- Bước 1: Định nghĩa tất cả các key cần xóa ---
    const keysToRemove = [
      // Local Storage keys
      "uniclub-auth",
      "jwtToken",
      "userRole",
      "clubly-membership-applications",
      "clubly-events",
      "clubly-clubs",
      "clubly-users",
      "clubly-club-applications",
      "clubly-policies",
      "clubly-event-requests",
      "resetUserId",
      
      // Report Editor Local Storage keys (now using localStorage instead of sessionStorage)
      "clubly-report-editor-content",
      "clubly-report-page-settings",
      "editor_history_meta",
      // History slots (0-24)
      ...Array.from({ length: 25 }, (_, i) => `editor_history_${i}`),
      
      // Clipboard Session Storage keys
      "report_clipboard",
      "report_clipboard_type",
      
      // Session Storage keys
      "intendedPath",
      "requirePasswordReset",
      "resetEmail",
      "student-events-selected-club-id", // Student events page selected club
      "student-gift-selected-club-id", // Student gift page selected club
    ];


    try {
      // --- Bước 2: Thực hiện xóa ---
      keysToRemove.forEach((key) => {
        safeLocalStorage.removeItem(key);
        safeSessionStorage.removeItem(key);

        // Xóa trực tiếp để đảm bảo cleanup hoàn toàn (dù đã dùng safe wrapper)
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // --- Bước 2.5: Xóa tất cả Google OAuth data trong sessionStorage ---
      if (typeof window !== "undefined" && sessionStorage) {
        try {
          const allSessionKeys = Object.keys(sessionStorage);
          const googleKeys = allSessionKeys.filter((key) => key.startsWith("google_"));
          
          if (googleKeys.length > 0) {
            googleKeys.forEach((key) => {
              safeSessionStorage.removeItem(key);
              sessionStorage.removeItem(key);
            });
          }
        } catch (err) {
        }
      }


      // --- Bước 3: Kiểm tra lại storage ---
      const remainingKeys = keysToRemove.filter((key) => {
        return (
          localStorage.getItem(key) !== null ||
          sessionStorage.getItem(key) !== null
        );
      });

      if (remainingKeys.length > 0) {
        // Nếu vẫn còn key sót lại, báo lỗi ngay lập tức
        console.error(
          "LỖI NGHIÊM TRỌNG KHI LOGOUT: Các key sau vẫn còn tồn tại trong storage:",
          remainingKeys
        );
        // Bạn có thể gửi một thông báo lỗi tới hệ thống giám sát ở đây
      } else {
        console.log(
          "   Logout: Kiểm tra thành công! Storage đã được dọn dẹp sạch sẽ."
        );
      }
    } catch (err) {
      console.error(
        "Logout: Đã có lỗi xảy ra trong quá trình dọn dẹp storage.",
        err
      );
    } finally {
      // --- Bước 4: Clear React Query cache ---
      queryClient.clear(); // Clear all cached queries
      
      // --- Bước 5: Luôn luôn chuyển trang ---
      // Khối `finally` đảm bảo rằng việc chuyển trang sẽ luôn xảy ra,
      // kể cả khi có lỗi trong khối `try`.
      setAuth({ userId: null, role: null, staff: false, user: null }); // Cập nhật state
      router.replace("/"); // Dùng replace để không quay lại được trang cũ
    }
  };

  const isAuthenticated = auth.userId !== null && auth.role !== null;

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        loginWithGoogle,
        logout,
        isAuthenticated,
        initialized,
      }}
    >
      <ClientOnlyWrapper>{children}</ClientOnlyWrapper>
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
