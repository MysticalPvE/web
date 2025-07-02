"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Database, ExternalLink, Folder, File, GitBranch, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface GitHubFile {
  name: string
  path: string
  type: "file" | "dir"
  download_url?: string
  content?: string
}

export default function NotesTab() {
  const { user } = useAuth()
  const [repoUrl, setRepoUrl] = useState("")
  const [savedRepoUrl, setSavedRepoUrl] = useState("")
  const [files, setFiles] = useState<GitHubFile[]>([])
  const [currentPath, setCurrentPath] = useState("")
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadRepoUrl()
    }
  }, [user])

  useEffect(() => {
    if (savedRepoUrl) {
      loadFiles("")
    }
  }, [savedRepoUrl])

  const loadRepoUrl = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("obsidian_repo_url")
        .eq("id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading repo URL:", error)
        return
      }

      if (data?.obsidian_repo_url) {
        setSavedRepoUrl(data.obsidian_repo_url)
        setRepoUrl(data.obsidian_repo_url)
      }
    } catch (error) {
      console.error("Error loading repo URL:", error)
    }
  }

  const saveRepoUrl = async () => {
    if (!user || !repoUrl.trim()) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("user_profiles")
        .update({ obsidian_repo_url: repoUrl.trim() })
        .eq("id", user.id)

      if (error) throw error

      setSavedRepoUrl(repoUrl.trim())
      loadFiles("")
    } catch (error) {
      console.error("Error saving repo URL:", error)
    } finally {
      setSaving(false)
    }
  }

  const parseGitHubUrl = (url: string) => {
    // Convert GitHub URL to API URL
    // https://github.com/user/repo -> https://api.github.com/repos/user/repo/contents
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (match) {
      const [, owner, repo] = match
      return `https://api.github.com/repos/${owner}/${repo.replace(".git", "")}/contents`
    }
    return null
  }

  const loadFiles = async (path: string) => {
    if (!savedRepoUrl) return

    try {
      setLoading(true)
      const apiUrl = parseGitHubUrl(savedRepoUrl)
      if (!apiUrl) {
        throw new Error("Invalid GitHub URL")
      }

      const url = path ? `${apiUrl}/${path}` : apiUrl
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const data = await response.json()

      // Filter for markdown files and directories
      const filteredFiles = data
        .filter((item: any) => item.type === "dir" || item.name.endsWith(".md") || item.name.endsWith(".txt"))
        .map((item: any) => ({
          name: item.name,
          path: item.path,
          type: item.type,
          download_url: item.download_url,
        }))

      setFiles(filteredFiles)
      setCurrentPath(path)
    } catch (error) {
      console.error("Error loading files:", error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const loadFileContent = async (file: GitHubFile) => {
    if (!file.download_url) return

    try {
      setLoading(true)
      const response = await fetch(file.download_url)

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }

      const content = await response.text()
      setFileContent(content)
      setSelectedFile(file)
    } catch (error) {
      console.error("Error loading file content:", error)
      setFileContent("Error loading file content")
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folderPath: string) => {
    loadFiles(folderPath)
    setSelectedFile(null)
    setFileContent("")
  }

  const navigateUp = () => {
    const pathParts = currentPath.split("/")
    pathParts.pop()
    const parentPath = pathParts.join("/")
    loadFiles(parentPath)
    setSelectedFile(null)
    setFileContent("")
  }

  const renderMarkdown = (content: string) => {
    // Basic markdown rendering (you could use a proper markdown library here)
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-white">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 text-white">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 text-white">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic text-gray-300">$1</em>')
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono">$1</code>')
      .replace(/\n/gim, "<br>")
  }

  return (
    <div className="space-y-6">
      {/* Repository Setup */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Obsidian Vault Repository
            <Database className="h-4 w-4 text-gray-400 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="repoUrl" className="text-gray-300">
              GitHub Repository URL
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/obsidian-vault"
                className="bg-gray-700 border-gray-500 text-white placeholder-gray-400"
              />
              <Button
                onClick={saveRepoUrl}
                disabled={!repoUrl.trim() || saving}
                className="bg-white hover:bg-gray-200 text-black"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Connect your Obsidian vault hosted on GitHub to browse and view your notes
            </p>
          </div>

          {savedRepoUrl && (
            <div className="bg-green-900/20 border border-green-600 rounded p-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-green-400" />
                <p className="text-green-200 text-sm">
                  Connected to: <code className="bg-gray-700 px-2 py-1 rounded">{savedRepoUrl}</code>
                </p>
                <Button asChild variant="ghost" size="sm" className="text-green-400 hover:bg-green-900/30">
                  <a href={savedRepoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {savedRepoUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Browser */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Vault Browser
                {currentPath && (
                  <Button
                    onClick={navigateUp}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:bg-gray-700 ml-auto"
                  >
                    ← Back
                  </Button>
                )}
              </CardTitle>
              {currentPath && <p className="text-sm text-gray-400">/{currentPath}</p>}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="ml-2 text-white">Loading...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {files.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No markdown files found in this directory</p>
                  ) : (
                    files.map((file) => (
                      <div
                        key={file.path}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedFile?.path === file.path
                            ? "bg-gray-700 text-white"
                            : "text-gray-300 hover:bg-gray-700"
                        }`}
                        onClick={() => {
                          if (file.type === "dir") {
                            navigateToFolder(file.path)
                          } else {
                            loadFileContent(file)
                          }
                        }}
                      >
                        {file.type === "dir" ? (
                          <Folder className="h-4 w-4 text-blue-400" />
                        ) : (
                          <File className="h-4 w-4 text-green-400" />
                        )}
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Viewer */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedFile ? selectedFile.name : "Select a file"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="ml-2 text-white">Loading file...</span>
                </div>
              ) : selectedFile ? (
                <div className="max-h-96 overflow-y-auto">
                  {selectedFile.name.endsWith(".md") ? (
                    <div
                      className="prose prose-invert max-w-none text-gray-300"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(fileContent) }}
                    />
                  ) : (
                    <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">{fileContent}</pre>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">Select a file from the browser to view its content</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!savedRepoUrl && (
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="p-8 text-center">
            <GitBranch className="h-16 w-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Connect Your Obsidian Vault</h3>
            <p className="text-gray-400 mb-4">
              Connect your Obsidian vault hosted on GitHub to browse and view your notes directly in the study tool.
            </p>
            <div className="bg-blue-900/20 border border-blue-600 rounded p-4 text-left">
              <h4 className="text-blue-200 font-medium mb-2">Setup Instructions:</h4>
              <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
                <li>Push your Obsidian vault to a GitHub repository</li>
                <li>Make sure the repository is public (or provide access)</li>
                <li>Copy the repository URL (e.g., https://github.com/username/vault)</li>
                <li>Paste the URL above and click "Connect"</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
