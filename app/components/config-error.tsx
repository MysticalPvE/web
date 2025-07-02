"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ExternalLink, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ConfigErrorProps {
  error: string
}

export default function ConfigError({ error }: ConfigErrorProps) {
  const [copied, setCopied] = useState(false)

  const envTemplate = `# Add these to your .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(envTemplate)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="bg-gray-800 border-red-600 border-2">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Configuration Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-900/20 border border-red-600 rounded p-3">
              <p className="text-red-300 font-mono text-sm">{error}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-white font-semibold">To fix this issue:</h3>

              <div className="space-y-2 text-gray-300">
                <p>
                  <strong>1.</strong> Create a Supabase project at{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    supabase.com <ExternalLink className="h-3 w-3" />
                  </a>
                </p>

                <p>
                  <strong>2.</strong> Get your project URL and anon key from Settings → API
                </p>

                <p>
                  <strong>3.</strong> Create a <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code> file in
                  your project root:
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-600 rounded p-3 relative">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{envTemplate}</code>
                </pre>
                <Button
                  onClick={copyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                >
                  {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>

              <div className="space-y-2 text-gray-300">
                <p>
                  <strong>4.</strong> Replace the placeholder values with your actual Supabase credentials
                </p>
                <p>
                  <strong>5.</strong> Restart your development server
                </p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-600 rounded p-3">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> Make sure your <code className="bg-gray-700 px-1 rounded">.env.local</code> file
                is in the same directory as your <code className="bg-gray-700 px-1 rounded">package.json</code> file.
              </p>
            </div>

            <div className="flex gap-2">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  Open Supabase Dashboard
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-gray-500 text-gray-300 hover:bg-gray-700"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
