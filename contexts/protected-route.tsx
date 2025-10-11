"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  // avoid redirect while auth state is still initializing
  const { auth, isAuthenticated, initialized } = useAuth()

  useEffect(() => {
    // only redirect when we've finished reading stored auth
    if (initialized && !isAuthenticated) {
      // include the current path so the user can be redirected back after login
      const dest = pathname ? `/?next=${encodeURIComponent(pathname)}` : "/"
      router.push(dest)
      return
    }
  }, [initialized, isAuthenticated, router])

  if (!initialized) {
    // still loading auth from storage - don't render or redirect yet
    return null
  }

  if (!isAuthenticated) {
    return null // Will redirect once initialized
  }

  if (!allowedRoles.includes(auth.role!)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page with your current role.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
