"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { login as loginApi, LoginResponse } from "@/service/authApi"

interface AuthState {
  userId: string | number | null
  role: string | null
  user: {
    userId: string | number
    email: string
    fullName: string
  } | null
}

interface AuthContextType {
  auth: AuthState
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  initialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    userId: null,
    role: null,
    user: null,
  })
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Load auth state from localStorage on mount
    const saved = localStorage.getItem("uniclub-auth")
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { token: string } & LoginResponse

        // map backend role values to the app's internal role keys
        const normalizeRole = (r?: string | null) => {
          if (!r) return null
          const lower = String(r).toLowerCase()
          const map: Record<string, string> = {
            // keep backend STUDENT as its own internal 'student' role
            student: "student",
            member: "member",
            club_manager: "club_leader",
            "club manager": "club_leader",
            // Support different backend naming for university staff/admin
            uni_admin: "uni_staff",
            university_admin: "uni_staff",
            university_staff: "uni_staff", // <-- added to handle UNIVERSITY_STAFF
            "university staff": "uni_staff",
            admin: "admin",
            staff: "staff",
          }
          return map[lower] || lower
        }

        setAuth({
          userId: parsed.userId,
          // normalize role to the app's canonical key (e.g. 'uni_admin')
          role: normalizeRole(parsed.role),
          user: {
            userId: parsed.userId,
            email: parsed.email,
            fullName: parsed.fullName,
          },
        })
        // also set default Authorization header for axios if token exists
        localStorage.setItem("jwtToken", parsed.token)
      } catch (err) {
        console.warn("Failed to parse stored auth", err)
      }
    }
    // mark initialization complete regardless of stored auth
    setInitialized(true)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res: LoginResponse = await loginApi({ email, password })

      // Persist full response (token + user info)
      localStorage.setItem("uniclub-auth", JSON.stringify(res))
      // Also store jwtToken separately for backward compatibility
      localStorage.setItem("jwtToken", res.token)

      // normalize backend role to canonical internal key
      const normalizeRole = (r?: string | null) => {
        if (!r) return null
        const lower = String(r).toLowerCase()
        const map: Record<string, string> = {
          student: "student",
          member: "member",
          club_manager: "club_leader",
          "club manager": "club_leader",
          uni_admin: "uni_staff",
          university_admin: "uni_staff",
          university_staff: "uni_staff", // <-- added to handle UNIVERSITY_STAFF
          "university staff": "uni_staff",
          admin: "admin",
          staff: "staff",
        }
        return map[lower] || lower
      }

      const normalizedRole = normalizeRole(res.role)

      setAuth({
        userId: res.userId,
        role: normalizedRole,
        user: {
          userId: res.userId,
          email: res.email,
          fullName: res.fullName,
        },
      })

      // Redirect based on normalized role
      const redirectMap: Record<string, string> = {
        member: "/member",
        student: "/student",
        club_leader: "/club-leader",
        uni_staff: "/uni-staff",
        admin: "/admin",
        staff: "/staff",
      }

  router.push(redirectMap[normalizedRole || ""] || "/member")
      return true
    } catch (err) {
      console.error("Login failed", err)
      return false
    }
  }

  const logout = () => {
    setAuth({ userId: null, role: null, user: null })
    localStorage.removeItem("clubly-membership-applications")
    localStorage.removeItem("uniclub-auth")
    localStorage.removeItem("jwtToken")
    localStorage.removeItem("uniclub-member-staff")
    
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
        initialized,
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
