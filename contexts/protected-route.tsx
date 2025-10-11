"use client";

import type React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react"; // Thêm useState
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react"; // Icon loading

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

  // State để điều khiển việc hiển thị thông báo chuyển hướng
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!initialized) {
      return; // Chờ context khởi tạo xong
    }

    // Nếu đã đăng nhập, không làm gì cả
    if (isAuthenticated) {
      // Tắt thông báo nếu có (phòng trường hợp người dùng đăng nhập ở tab khác)
      setIsRedirecting(false); 
      return;
    }

    // ⭐ LOGIC MỚI: Nếu chưa đăng nhập
    
    // 1. Kích hoạt trạng thái "đang chuyển hướng" để hiển thị overlay
    setIsRedirecting(true);

    // 2. Lưu đường dẫn muốn đến một cách đáng tin cậy
    console.log(`ProtectedRoute: Sẽ chuyển hướng, lưu intendedPath: ${pathname}`);
    sessionStorage.setItem('intendedPath', pathname);

    // 3. Đặt hẹn giờ 5 giây trước khi chuyển hướng
    const timer = setTimeout(() => {
      console.log("ProtectedRoute: Hết 5 giây, thực hiện chuyển hướng tới /");
      router.push("/");
    }, 5000); // 5000 milliseconds = 5 giây

    // 4. Hàm dọn dẹp: Hủy hẹn giờ nếu component bị unmount
    return () => clearTimeout(timer);

  }, [initialized, isAuthenticated, pathname, router]);

  // Trong khi chờ context, hiển thị loading chung
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Nếu đã đăng nhập, kiểm tra quyền và hiển thị nội dung
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
    // Nếu có quyền, hiển thị nội dung bình thường
    return <>{children}</>;
  }

  // ⭐ GIAO DIỆN MỚI: Nếu chưa đăng nhập, hiển thị nội dung trang và lớp phủ
  // Điều này cho phép người dùng thấy trang họ muốn vào trước khi bị chuyển đi
  return (
    <>
      {children}
      {isRedirecting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                You need to be logged in to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Redirecting to login page in 5 seconds...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}