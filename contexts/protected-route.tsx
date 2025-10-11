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
  const { auth, isAuthenticated, initialized } = useAuth();

  useEffect(() => {
    // Chỉ thực hiện logic khi đã khởi tạo xong
    if (!initialized) {
      return;
    }

    // Nếu đã xác thực, không làm gì cả
    if (isAuthenticated) {
      return;
    }

    // Nếu chưa xác thực, LƯU đường dẫn hiện tại vào sessionStorage
    // và điều hướng đến trang Login.
    console.log(`ProtectedRoute: Chưa xác thực, lưu intendedPath: ${pathname}`);
    sessionStorage.setItem('intendedPath', pathname);
    router.push("/"); // Chỉ cần điều hướng về trang gốc là đủ

  }, [initialized, isAuthenticated, pathname, router]);

  // Hiển thị loading trong khi chờ context khởi tạo
  if (!initialized) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Nếu đã xác thực, kiểm tra quyền
  if (isAuthenticated) {
    if (!allowedRoles.includes(auth.role!)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/")} className="w-full">
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    // Nếu có quyền, hiển thị nội dung
    return <>{children}</>;
  }

  // Trong khi chờ useEffect điều hướng, không hiển thị gì cả
  return null;
}