"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Lấy kiểu props trực tiếp từ component để tránh sai khác giữa versions
type NextThemesProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({
  children,
  ...props
}: NextThemesProps & { children: React.ReactNode }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
