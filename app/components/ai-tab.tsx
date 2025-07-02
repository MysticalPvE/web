"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Send,
  Loader2,
  BookOpen,
  Calculator,
  Atom,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  User,
  Bot,
  Database,
  ImageIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  subject?: string
  image_url?: string
}

interface AITabProps {
  subject: string
}

export default function AITab({ subject }: AITabProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const availableModels = [
    { id: "openai/gpt-4o", name: "GPT-4o (Vision)" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Vision)" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Vision)" },
    { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku (Vision)" },
    { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5 (Vision)" },
    { id: "meta-llama/llama-3.2-90b-vision-instruct", name: "Llama 3.2 90B Vision" },
  ]

  useEffect(() => {
    if (user) {
      loadMessages()
    }
  }, [user, subject])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadMessages = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("messages")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading messages:", error)
        return
      }

      if (data?.messages) {
        const parsedMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(parsedMessages)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const saveMessages = async (newMessages: Message[]) => {
    if (!user) return

    try {
      const { error } = await supabase.from("ai_conversations").upsert(
        {
          user_id: user.id,
          subject: subject,
          messages: newMessages,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,subject",
        },
      )

      if (error) {
        console.error("Error saving messages:", error)
      }
    } catch (error) {
      console.error("Error saving messages:", error)
    }
  }

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case "chemistry":
        return <Atom className="h-4 w-4" />
      case "maths":
        return <Calculator className="h-4 w-4" />
      case "physics":
        return <BookOpen className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getSystemPrompt = (subject: string) => {
    return `You are an expert JEE (Joint Entrance Examination) tutor specializing in ${subject}. You help students prepare for JEE Main and JEE Advanced exams.

Your expertise includes:
- Explaining complex concepts in simple, clear terms
- Providing step-by-step problem solutions with detailed reasoning
- Offering effective study strategies and memory techniques
- Creating practice questions with worked solutions
- Identifying common mistakes and how to avoid them
- Suggesting relevant formulas, shortcuts, and mnemonics
- Analyzing images of problems, equations, diagrams, and handwritten work

Subject Focus - ${subject.charAt(0).toUpperCase() + subject.slice(1)}:
${
  subject === "chemistry"
    ? `- Organic Chemistry: Reaction mechanisms, IUPAC nomenclature, stereochemistry
- Inorganic Chemistry: Periodic properties, coordination compounds, metallurgy
- Physical Chemistry: Thermodynamics, chemical kinetics, equilibrium, electrochemistry`
    : subject === "maths"
      ? `- Calculus: Limits, continuity, derivatives, integrals and applications
- Algebra: Complex numbers, quadratic equations, sequences and series
- Coordinate Geometry: Straight lines, circles, parabola, ellipse, hyperbola
- Trigonometry: Functions, identities, equations, inverse functions
- Probability and Statistics: Permutations, combinations, probability distributions`
      : `- Mechanics: Kinematics, dynamics, work-energy theorem, rotational motion
- Thermodynamics: Laws of thermodynamics, kinetic theory, heat transfer
- Electromagnetism: Electrostatics, current electricity, magnetic effects
- Optics: Ray optics, wave optics, optical instruments
- Modern Physics: Atomic structure, nuclear physics, photoelectric effect`
}

Always be encouraging, patient, and thorough. Use examples and analogies when helpful. Break down complex problems into manageable steps. Keep responses focused on JEE preparation and syllabus.

When analyzing images, describe what you see and provide detailed explanations of any mathematical expressions, diagrams, or problems shown.`
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const sendMessage = async () => {
    if ((!input.trim() && !imageFile) || !user) return

    let imageUrl = null

    // Upload image if present
    if (imageFile) {
      try {
        const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("ai-images")
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("ai-images").getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      } catch (error) {
        console.error("Error uploading image:", error)
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim() || "Please analyze this image",
      timestamp: new Date(),
      subject,
      image_url: imageUrl,
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    const currentInput = input.trim()
    setInput("")
    removeImage()
    setIsLoading(true)

    try {
      // Prepare messages for OpenRouter API
      const apiMessages = [
        {
          role: "system",
          content: getSystemPrompt(subject),
        },
        ...newMessages.slice(-10).map((msg) => {
          const messageContent: any = {
            role: msg.role,
            content: msg.image_url
              ? [
                  { type: "text", text: msg.content },
                  { type: "image_url", image_url: { url: msg.image_url } },
                ]
              : msg.content,
          }
          return messageContent
        }),
      ]

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "JEE Study Tool",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date(),
        subject,
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)
      saveMessages(finalMessages)
    } catch (error) {
      console.error("Error calling OpenRouter API:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm having trouble connecting to the AI service. Please check your OpenRouter API key and try again.

Error details: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
        subject,
      }
      const finalMessages = [...newMessages, errorMessage]
      setMessages(finalMessages)
      saveMessages(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessages = async () => {
    setMessages([])
    if (user) {
      try {
        await supabase.from("ai_conversations").delete().eq("user_id", user.id).eq("subject", subject)
      } catch (error) {
        console.error("Error clearing messages:", error)
      }
    }
  }

  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error("Failed to copy message:", error)
    }
  }

  const quickPrompts = [
    `Explain a fundamental ${subject} concept for JEE`,
    `Solve a challenging ${subject} problem step by step`,
    `What are the most important formulas in ${subject}?`,
    `Give me a practice question in ${subject}`,
    `How should I approach ${subject} for JEE preparation?`,
    `What are common mistakes students make in ${subject}?`,
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Tutor - {subject.charAt(0).toUpperCase() + subject.slice(1)}
              {getSubjectIcon(subject)}
              <Database className="h-4 w-4 text-gray-400 ml-2" />
            </CardTitle>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button
                  onClick={clearMessages}
                  variant="outline"
                  size="sm"
                  className="border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="model" className="text-gray-300 text-sm">
                AI Model
              </Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-gray-700 border-gray-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-500 text-white">
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-white hover:bg-gray-600">
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-400">Powered by OpenRouter • Vision-capable models</p>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white text-lg">Quick Start Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  onClick={() => setInput(prompt)}
                  variant="outline"
                  className="border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent text-left justify-start h-auto p-3"
                >
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  {prompt}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card className="bg-gray-800 border-gray-600">
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 mr-2 opacity-50" />
                  <span className="text-lg">AI Tutor</span>
                </div>
                <p>Ask me anything about {subject} - I can analyze images, solve problems, and explain concepts!</p>
                <p className="text-sm mt-2">Upload images of problems, equations, or diagrams for detailed analysis.</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex gap-3 max-w-[80%]">
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-black" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user" ? "bg-white text-black" : "bg-gray-700 text-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        {message.image_url && (
                          <div className="mb-2">
                            <img
                              src={message.image_url || "/placeholder.svg"}
                              alt="Uploaded image"
                              className="max-w-full h-auto rounded border"
                              style={{ maxHeight: "200px" }}
                            />
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                      </div>
                      <Button
                        onClick={() => copyMessage(message.content, message.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      >
                        {copiedMessageId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-black" />
                  </div>
                  <div className="bg-gray-700 text-white rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Input */}
      <Card className="bg-gray-800 border-gray-600">
        <CardContent className="p-4">
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-h-32 rounded border" />
              <Button
                onClick={removeImage}
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
              >
                ×
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${subject} or upload an image...`}
                className="bg-gray-700 border-gray-500 text-white placeholder-gray-400 resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                onClick={sendMessage}
                disabled={(!input.trim() && !imageFile) || isLoading}
                className="bg-white hover:bg-gray-200 text-black"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <p className="text-xs text-gray-400 mt-2">
            Press Enter to send, Shift+Enter for new line • Upload images for analysis
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
