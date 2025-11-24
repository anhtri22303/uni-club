"use client"

import React, { useState } from "react"
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface GoogleSignInButtonProps {
  mode?: "sign-in" | "sign-up"
  onClick?: () => void
}

export function GoogleSignInButton({ mode = "sign-in", onClick }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const credentialTimestamp = new Date().toISOString()
    
    try {
      setIsLoading(true)
      
      // Log Google credential details
      const credentialDetails = {
        timestamp: credentialTimestamp,
        hasCredential: !!credentialResponse.credential,
        tokenLength: credentialResponse.credential?.length || 0,
        tokenPreview: credentialResponse.credential?.substring(0, 30) + "..." || "N/A",
        select_by: (credentialResponse as any).select_by || "unknown"
      }
      
      console.log("   [Google OAuth] Credential Received:", credentialDetails)
      
      // Validate credential exists
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google")
      }

      console.log("📤 [Google OAuth] Sending ID token to backend...", {
        tokenLength: credentialResponse.credential.length,
        tokenPreview: credentialResponse.credential.substring(0, 30) + "..."
      })
      
      // Use loginWithGoogle from auth context to send token to backend
      const success = await loginWithGoogle(credentialResponse.credential)
      
      if (success) {
        toast({
          title: "🎉 Google Sign-In Successful",
          description: "Redirecting to your account...",
        })
        console.log("   Google Sign-In successful, redirecting...")
      } else {
        throw new Error("Failed to authenticate with server")
      }

    } catch (error: any) {
      console.error("  Google login error:", error)
      
      // Handle different types of errors with specific messages
      let errorMessage = "Authentication failed"
      let errorDetails = "Please try again"
      
      if (error.response?.status === 401) {
        errorMessage = "Invalid Google Token"
        errorDetails = "Google token verification failed. Please try logging in again"
      } else if (error.response?.status === 400) {
        errorMessage = "Missing Required Parameters"
        errorDetails = error.response?.data?.error || error.response?.data?.message || "Invalid request format"
      } else if (error.message?.includes("fetch") || error.message?.includes("Network")) {
        errorMessage = "Cannot Connect to Server"
        errorDetails = "Please check your network connection or try again later"
      } else if (error.message) {
        errorMessage = "Login Failed"
        errorDetails = error.message
      } else if (error.response?.data?.error || error.response?.data?.message) {
        errorMessage = "Server Error"
        errorDetails = error.response.data.error || error.response.data.message
      }
      
      toast({
        title: `  Google Sign-In Failed: ${errorMessage}`, 
        description: errorDetails,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.error("  Google OAuth popup cancelled or failed")
    toast({
      title: "Google Sign-In Cancelled",
      description: "You can retry or use email/password login instead",
      variant: "destructive",
    })
  }

  return (
    <div className="w-full">
      {isLoading ? (
        <Button 
          disabled 
          className="w-full h-10 sm:h-11 flex items-center justify-center gap-2"
        >
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span>Authenticating...</span>
        </Button>
      ) : (
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          text={mode === "sign-up" ? "signup_with" : "signin_with"}
          theme="outline"
          size="large"
          width="100%"
          useOneTap={false}
          auto_select={false}
        />
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="h-6 w-6 block"
    >
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
  )
}
