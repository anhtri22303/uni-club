"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login as loginApi, LoginResponse, loginWithGoogleToken } from "@/service/authApi";
import { safeSessionStorage, safeLocalStorage } from "@/lib/browser-utils";
import { ClientOnlyWrapper } from "@/components/client-only-wrapper";

interface AuthState {
  userId: string | number | null;
  role: string | null;
  staff: boolean;
  
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
  loginWithGoogle: (googleToken: string) => Promise<boolean>;
  logout: () => void;
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

  useEffect(() => {
    // Phần useEffect này giữ nguyên nhưng dùng safe storage
    const saved = safeLocalStorage.getItem("uniclub-auth");

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

        setAuth({
          userId: parsed.userId,
          role: normalizeRole(parsed.role),
          staff: (parsed as any).staff || false,
          user: {
            userId: parsed.userId,
            email: parsed.email,
            fullName: parsed.fullName,
          },
        });

        safeLocalStorage.setItem("jwtToken", parsed.token);

        localStorage.setItem("jwtToken", parsed.token);
      } catch (err) {
        console.warn("Failed to parse stored auth", err);
      }
    }
    setInitialized(true);
  }, []);

  // Helper function để xử lý login response chung
  const processLoginResponse = (res: LoginResponse) => {
    safeLocalStorage.setItem("uniclub-auth", JSON.stringify(res));
    safeLocalStorage.setItem("jwtToken", res.token);

    localStorage.setItem("uniclub-auth", JSON.stringify(res));
    localStorage.setItem("jwtToken", res.token);

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
    const normalizedRole = normalizeRole(res.role);

    setAuth({
      userId: res.userId,
      role: normalizedRole,
      staff: res.staff || false,
      user: {
        userId: res.userId,
        email: res.email,
        fullName: res.fullName,
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

      if (intendedPath) {
        console.log(
          `AuthContext: Tìm thấy intendedPath (từ checkin page): ${intendedPath}`
        );
        // Xóa ngay sau khi đọc để lần đăng nhập sau không bị ảnh hưởng
        safeSessionStorage.removeItem("intendedPath");

        router.push(intendedPath);
      } else {
        // 2. Không có intendedPath (người dùng đăng nhập từ trang chủ hoặc trang khác)
        const redirectMap: Record<string, string> = {
          student: "/profile",
          club_leader: "/club-leader",
          uni_staff: "/uni-staff",
          admin: "/admin",
          staff: "/staff",
        };
        const fallbackPath = redirectMap[normalizedRole || ""] || "/student";
        console.log(
          `AuthContext: Không có intendedPath, điều hướng mặc định tới: ${fallbackPath}`
        );
        router.push(fallbackPath);
      }

      return true;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  };

  const loginWithGoogle = async (googleToken: string): Promise<boolean> => {
    try {
      console.log("🔐 AuthContext: Starting Google login process...")
      
      const res: LoginResponse = await loginWithGoogleToken({ token: googleToken });
      const normalizedRole = processLoginResponse(res);

      // ⭐ LOGIC ĐIỀU HƯỚNG THÔNG MINH (giống như login thường)
      const intendedPath = safeSessionStorage.getItem("intendedPath");

      if (intendedPath) {
        console.log(
          `AuthContext: Tìm thấy intendedPath (từ checkin page): ${intendedPath}`
        );
        safeSessionStorage.removeItem("intendedPath");
        router.push(intendedPath);
      } else {
        const redirectMap: Record<string, string> = {
          student: "/profile",
          club_leader: "/club-leader",
          uni_staff: "/uni-staff",
          admin: "/admin",
          staff: "/staff",
        };
        const fallbackPath = redirectMap[normalizedRole || ""] || "/student";
        console.log(
          `AuthContext: Google login - điều hướng mặc định tới: ${fallbackPath}`
        );
        router.push(fallbackPath);
      }

      return true;
    } catch (err: any) {
      console.error("❌ Google login failed:", err);
      
      // Nếu backend chưa ready, show thông báo rõ ràng
      if (err.message?.includes("Backend chưa hỗ trợ")) {
        console.warn("⚠️ Backend chưa implement Google OAuth, cần setup backend trước");
      }
      
      return false;
    }
  };

  // Trong file AuthContext của bạn

  const logout = () => {
    // --- Bước 1: Định nghĩa tất cả các key cần xóa ---
    const keysToRemove = [
      // Local Storage keys
      "uniclub-auth",
      "jwtToken",
      "clubly-membership-applications",
      "clubly-events",
      "clubly-clubs",
      "clubly-users",
      "clubly-club-applications",
      "clubly-policies",
      "clubly-event-requests",
      
      // Session Storage keys
      "intendedPath",
    ];

    console.log("Logout: Bắt đầu quá trình dọn dẹp storage...");

    try {
      // --- Bước 2: Thực hiện xóa ---
      keysToRemove.forEach((key) => {
        safeLocalStorage.removeItem(key);
        safeSessionStorage.removeItem(key);

        // Xóa trực tiếp để đảm bảo cleanup hoàn toàn (dù đã dùng safe wrapper)
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log("Logout: Đã thực hiện xong các lệnh xóa.");

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
          "✅ Logout: Kiểm tra thành công! Storage đã được dọn dẹp sạch sẽ."
        );
      }
    } catch (err) {
      console.error(
        "Logout: Đã có lỗi xảy ra trong quá trình dọn dẹp storage.",
        err
      );
    } finally {
      // --- Bước 4: Luôn luôn chuyển trang ---
      // Khối `finally` đảm bảo rằng việc chuyển trang sẽ luôn xảy ra,
      // kể cả khi có lỗi trong khối `try`.
      console.log("Logout: Chuyển hướng về trang chủ.");
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
