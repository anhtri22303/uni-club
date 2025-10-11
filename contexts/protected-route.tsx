"use client";

import type React from "react";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  // avoid redirect while auth state is still initializing
  const { auth, isAuthenticated, initialized } = useAuth();

  // Bên trong ProtectedRoute.tsx

  useEffect(() => {
    console.log("--- ProtectedRoute: useEffect Bắt đầu ---");
    console.log(
      "Trạng thái: initialized =",
      initialized,
      ", isAuthenticated =",
      isAuthenticated
    );
    console.log("Pathname hiện tại:", pathname);

    if (!initialized || isAuthenticated) {
      console.log(
        "-> Quyết định: KHÔNG điều hướng (đang khởi tạo hoặc đã xác thực)."
      );
      return;
    }

    // ... (giữ nguyên code cũ của bạn ở giữa)
    let resolvedPath = pathname;
    if (!resolvedPath && typeof window !== "undefined") {
      resolvedPath = window.location?.pathname || "";
    }

    const dest = resolvedPath
      ? `/?next=${encodeURIComponent(resolvedPath)}`
      : "/";
    console.log(
      "-> Quyết định: ĐIỀU HƯỚNG người dùng chưa xác thực tới:",
      dest
    );
    router.push(dest);
    return;
  }, [initialized, isAuthenticated, router, pathname]);

  if (!initialized) return null;

  if (!isAuthenticated) {
    let resolvedPath = pathname;
    if (!resolvedPath && typeof window !== "undefined") {
      resolvedPath = window.location?.pathname || "";
    }
    const dest = resolvedPath
      ? `/?next=${encodeURIComponent(resolvedPath)}`
      : "/";
    router.push(dest);
    return null; // Will redirect once initialized
  }

  if (!allowedRoles.includes(auth.role!)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page with your current
              role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
