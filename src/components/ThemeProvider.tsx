"use client"

import * as React from "react"

// Simple ThemeProvider that doesn't depend on next-themes
// Theme handling is done via the darkMode state in page.tsx
interface ThemeProviderProps {
  children?: React.ReactNode;
  attribute?: any;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
  themes?: string[];
  [key: string]: unknown;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // This is a no-op provider since we handle theming via CSS variables
  // and the darkMode state in page.tsx
  return <>{children}</>
}
