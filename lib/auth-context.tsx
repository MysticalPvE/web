"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to get the correct redirect URL
  const getRedirectUrl = () => {
    if (typeof window === "undefined") {
      return "https://zdtpfnfeyhpwqxthsubb.supabase.co/auth/v1/callback"
    }

    const currentOrigin = window.location.origin

    // If we're in a deployed environment (not localhost), use the current origin
    if (!currentOrigin.includes("localhost") && !currentOrigin.includes("127.0.0.1")) {
      return `${currentOrigin}/auth/callback`
    }

    // Fallback to Supabase callback for localhost/development
    return "https://zdtpfnfeyhpwqxthsubb.supabase.co/auth/v1/callback"
  }

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Supabase configuration is missing. Please check your environment variables.")
      setLoading(false)
      return
    }

    // Check for error in URL params
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const urlError = urlParams.get("error")
      if (urlError) {
        setError(decodeURIComponent(urlError))
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    try {
      // Handle authentication session
      const initializeAuth = async () => {
        try {
          // First, try to get existing session
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession()

          if (sessionError) {
            console.error("Session error:", sessionError)
            setError("Failed to get session")
          } else if (session) {
            console.log("Existing session found for:", session.user.email)
            setUser(session.user)
          }
        } catch (error) {
          console.error("Session initialization error:", error)
          setError("Failed to initialize authentication")
        } finally {
          setLoading(false)
        }
      }

      initializeAuth()

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth event:", event, session?.user?.email)

        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)

        // Handle successful sign in
        if (event === "SIGNED_IN" && session?.user) {
          try {
            // Check if user profile exists
            const { data: profile, error: profileError } = await supabase
              .from("user_profiles")
              .select("id")
              .eq("id", session.user.id)
              .single()

            if (profileError && profileError.code === "PGRST116") {
              // Profile doesn't exist, create it
              console.log("Creating user profile for:", session.user.email)
              const { error: insertError } = await supabase.from("user_profiles").insert({
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.user_metadata.full_name,
                avatar_url: session.user.user_metadata.avatar_url,
              })

              if (insertError) {
                console.error("Profile creation error:", insertError)
              } else {
                console.log("User profile created successfully")
              }
            }
          } catch (profileError) {
            console.error("Profile handling error:", profileError)
          }
        }

        // Clean up URL after successful auth
        if (event === "SIGNED_IN" && typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      })

      return () => subscription.unsubscribe()
    } catch (authError) {
      console.error("Auth initialization error:", authError)
      setError("Failed to initialize authentication")
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      setError(null)
      console.log("Attempting Google sign-in...")

      const redirectUrl = getRedirectUrl()
      console.log("Using redirect URL:", redirectUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      console.log("Sign-in response:", { data, error })

      if (error) {
        console.error("OAuth error details:", error)
        throw error
      }
    } catch (err) {
      console.error("Sign-in error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in"
      setError(errorMessage)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign out"
      setError(errorMessage)
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
