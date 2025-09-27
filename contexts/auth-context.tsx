"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import users from "@/src/data/users.json"

interface User {
  id: string
  fullName: string
  email: string
  password: string
  roles: string[]
  defaultRole: string
}

interface AuthState {
  userId: string | null
  role: string | null
  user: User | null
}

interface AuthContextType {
  auth: AuthState
  login: (email: string, password: string, role: string) => boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    userId: null,
    role: null,
    user: null,
  })
  const router = useRouter()

  useEffect(() => {
    // Load auth state from localStorage on mount
    const savedAuth = localStorage.getItem("uniclub-auth")
    if (savedAuth) {
      const parsedAuth = JSON.parse(savedAuth)
      const user = users.find((u) => u.id === parsedAuth.userId)
      if (user) {
        setAuth({
          userId: parsedAuth.userId,
          role: parsedAuth.role,
          user,
        })
      }
    }
  }, [])

  const login = (email: string, password: string, role: string): boolean => {
    const user = users.find((u) => u.email === email && u.password === password && u.roles.includes(role))

    if (user) {
      const authState = { userId: user.id, role }
      setAuth({ ...authState, user })
      localStorage.setItem("uniclub-auth", JSON.stringify(authState))

      const redirectMap: Record<string, string> = {
        student: "/student",
        club_manager: "/club-manager",
        uni_admin: "/uni-admin",
        admin: "/admin",
        staff: "/staff",
      }
      router.push(redirectMap[role] || "/student")
      return true
    }
    return false
  }

  const logout = () => {
    setAuth({ userId: null, role: null, user: null })
    localStorage.removeItem("uniclub-auth")
    router.push("/")
  }

  const isAuthenticated = auth.userId !== null && auth.role !== null

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
