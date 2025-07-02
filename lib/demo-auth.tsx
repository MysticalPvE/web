"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface DemoUser {
  id: string
  email: string
  user_metadata: {
    full_name: string
    avatar_url: string
  }
}

interface DemoAuthContextType {
  user: DemoUser | null
  loading: boolean
  signOut: () => void
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined)

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if demo mode is enabled
    const isDemoMode = localStorage.getItem("demo-mode")
    const demoUser = localStorage.getItem("demo-user")

    if (isDemoMode && demoUser) {
      try {
        setUser(JSON.parse(demoUser))
      } catch (error) {
        console.error("Error parsing demo user:", error)
        localStorage.removeItem("demo-mode")
        localStorage.removeItem("demo-user")
      }
    }

    setLoading(false)
  }, [])

  const signOut = () => {
    localStorage.removeItem("demo-mode")
    localStorage.removeItem("demo-user")
    setUser(null)
    window.location.reload()
  }

  return <DemoAuthContext.Provider value={{ user, loading, signOut }}>{children}</DemoAuthContext.Provider>
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext)
  if (context === undefined) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider")
  }
  return context
}
