import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, error_description)
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error_description || error)}`)
  }

  // Handle authorization code exchange
  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError)
        return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(exchangeError.message)}`)
      }

      if (data.session) {
        console.log("Session created successfully for user:", data.session.user.email)
        return NextResponse.redirect(`${origin}/`)
      }
    } catch (error) {
      console.error("Callback error:", error)
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent("Authentication failed")}`)
    }
  }

  // If no code or error, redirect to home
  return NextResponse.redirect(`${origin}/`)
}
