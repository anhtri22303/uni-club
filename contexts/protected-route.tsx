"use client";

import type React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

import { safeSessionStorage } from "@/lib/browser-utils";



interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}


export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  // avoid redirect while auth state is still initializing
  const { auth, isAuthenticated, initialized } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth, isAuthenticated, initialized } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);


  useEffect(() => {
    // Chờ context và pathname sẵn sàng
    if (!initialized) {
      return; 
    }
    
    // ⭐ SỬA LỖI TẠI ĐÂY: Thêm dòng kiểm tra này
    // Đảm bảo không chạy logic khi pathname chưa được Next.js cung cấp đầy đủ.
    if (!pathname) {
      return;
    }

    if (isAuthenticated) {
      setIsRedirecting(false); 
      return;
    }

    // Kích hoạt overlay
    setIsRedirecting(true);


    // Lưu đường dẫn với safe storage
    console.log(`ProtectedRoute: Đang lưu intendedPath: ${pathname}`);
    safeSessionStorage.setItem('intendedPath', pathname);

    // Lưu đường dẫn
    console.log(`ProtectedRoute: Đang lưu intendedPath: ${pathname}`);
    sessionStorage.setItem('intendedPath', pathname);


    // Đặt hẹn giờ chuyển hướng
    const timer = setTimeout(() => {
      console.log("ProtectedRoute: Hết giờ, chuyển hướng tới /");
      router.push("/");
    }, 5000);

    return () => clearTimeout(timer);

  }, [initialized, isAuthenticated, pathname, router]);

  // Giao diện loading ban đầu trong khi chờ context
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Nếu đã đăng nhập, kiểm tra quyền
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
    return <>{children}</>;
  }

  // Nếu chưa đăng nhập, hiển thị nội dung và overlay nếu isRedirecting
  return (
    <>
      {children}
      {isRedirecting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm text-center">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please log in to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}