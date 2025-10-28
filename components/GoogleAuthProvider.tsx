"use client"

import { GoogleOAuthProvider } from '@react-oauth/google'
import React from 'react'

interface GoogleAuthProviderProps {
  children: React.ReactNode
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  // Use the correct Google Client ID from environment variables
  // Default fallback is the official client ID provided by backend team
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "69239768097-t0akr44a3jmif9srfoc1p23h6g47kdel.apps.googleusercontent.com"
  
  console.log("🔑 Google OAuth Client ID:", clientId.substring(0, 20) + "...")
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}