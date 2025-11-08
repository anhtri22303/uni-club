"use client"

import { GoogleOAuthProvider } from '@react-oauth/google'
import React from 'react'

interface GoogleAuthProviderProps {
  children: React.ReactNode
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  // Use the correct Google Client ID from environment variables
  // Default fallback is the official client ID provided by backend team
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com"
  
  console.log("🔑 Google OAuth Client ID:", clientId.substring(0, 20) + "...")
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}