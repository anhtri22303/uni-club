"use client"

import { GoogleOAuthProvider } from '@react-oauth/google'
import React from 'react'

interface GoogleAuthProviderProps {
  children: React.ReactNode
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "787541492108-n1vdlobvmuq0ha18gqruu5gpkruonaim.apps.googleusercontent.com"
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}