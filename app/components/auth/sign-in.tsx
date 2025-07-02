"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Loader2, BookOpen, Calculator, Atom, AlertCircle } from "lucide-react"

export default function SignIn() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (error) {
      console.error("Error signing in:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-4 mb-6">
            <Calculator className="h-8 w-8 text-white" />
            <Atom className="h-8 w-8 text-white" />
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold">JEE Study Tool</h1>
          <p className="text-gray-400 text-lg">Your comprehensive JEE preparation companion</p>
        </div>

        <Card className="bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-300 text-sm">
              Sign in to access your study progress, questions, activities, and AI tutor.
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600 rounded p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-200 text-black font-medium py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="text-xs text-gray-400 text-center">Secure authentication powered by Supabase</div>
          </CardContent>
        </Card>

        <div className="text-center text-gray-400 text-sm">
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <Calculator className="h-6 w-6 mx-auto mb-2 text-gray-500" />
              <div className="text-xs">Mathematics</div>
            </div>
            <div className="text-center">
              <Atom className="h-6 w-6 mx-auto mb-2 text-gray-500" />
              <div className="text-xs">Chemistry</div>
            </div>
            <div className="text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-gray-500" />
              <div className="text-xs">Physics</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
