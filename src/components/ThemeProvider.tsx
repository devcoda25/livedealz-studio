"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Define the props we need without importing from internal paths
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
  // @ts-ignore - next-themes types are incompatible
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
