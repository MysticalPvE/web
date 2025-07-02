"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, ExternalLink, ChevronDown, ChevronUp, Trash2, Database } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface Question {
  id: string
  name: string
  status: "Completed" | "In Progress" | "Not Started"
  link: string
  date: string
  doubts: string
  subject: string
}

interface QuestionsTabProps {
  subject: string
}

export default function QuestionsTab({ subject }: QuestionsTabProps) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [newQuestion, setNewQuestion] = useState({
    name: "",
    status: "Not Started" as const,
    link: "",
    doubts: "",
  })

  useEffect(() => {
    if (user) {
      loadQuestions()
    }
  }, [user, subject])

  const loadQuestions = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .order("created_at", { ascending: false })

      if (error) throw error

      setQuestions(data || [])
    } catch (error) {
      console.error("Error loading questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = async () => {
    if (!newQuestion.name.trim() || !user) return

    try {
      const { data, error } = await supabase
        .from("questions")
        .insert({
          user_id: user.id,
          name: newQuestion.name,
          status: newQuestion.status,
          link: newQuestion.link,
          doubts: newQuestion.doubts,
          date: new Date().toLocaleDateString(),
          subject: subject,
        })
        .select()
        .single()

      if (error) throw error

      setQuestions([data, ...questions])
      setNewQuestion({ name: "", status: "Not Started", link: "", doubts: "" })
    } catch (error) {
      console.error("Error adding question:", error)
    }
  }

  const updateQuestionStatus = async (id: string, newStatus: Question["status"]) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("questions")
        .update({ status: newStatus })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error

      setQuestions((prev) =>
        prev.map((question) => (question.id === id ? { ...question, status: newStatus } : question)),
      )
    } catch (error) {
      console.error("Error updating question status:", error)
    }
  }

  const deleteSelectedQuestions = async () => {
    if (!user || selectedForDeletion.size === 0) return

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("user_id", user.id)
        .in("id", Array.from(selectedForDeletion))

      if (error) throw error

      setQuestions((prev) => prev.filter((question) => !selectedForDeletion.has(question.id)))
      setSelectedForDeletion(new Set())
      setDeleteMode(false)
    } catch (error) {
      console.error("Error deleting questions:", error)
    }
  }

  const cycleStatus = (currentStatus: Question["status"]): Question["status"] => {
    switch (currentStatus) {
      case "Not Started":
        return "In Progress"
      case "In Progress":
        return "Completed"
      case "Completed":
        return "Not Started"
      default:
        return "Not Started"
    }
  }

  const handleStatusClick = (e: React.MouseEvent, questionId: string, currentStatus: Question["status"]) => {
    e.stopPropagation()
    const newStatus = cycleStatus(currentStatus)
    updateQuestionStatus(questionId, newStatus)
  }

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode)
    setSelectedForDeletion(new Set())
  }

  const toggleQuestionForDeletion = (questionId: string) => {
    const newSelected = new Set(selectedForDeletion)
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId)
    } else {
      newSelected.add(questionId)
    }
    setSelectedForDeletion(newSelected)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-white text-black hover:bg-gray-200 cursor-pointer"
      case "In Progress":
        return "bg-gray-400 text-black hover:bg-gray-300 cursor-pointer"
      default:
        return "bg-gray-600 text-white hover:bg-gray-500 cursor-pointer"
    }
  }

  const toggleExpanded = (id: string) => {
    if (!deleteMode) {
      setExpandedId(expandedId === id ? null : id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="ml-2 text-white">Loading questions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Question Form */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Question Set ({subject.charAt(0).toUpperCase() + subject.slice(1)})
            <Database className="h-4 w-4 text-gray-400 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">
                Name
              </Label>
              <Input
                id="name"
                value={newQuestion.name}
                onChange={(e) => setNewQuestion({ ...newQuestion, name: e.target.value })}
                placeholder="JEE Main 2023 Paper 1"
                className="bg-gray-700 border-gray-500 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="status" className="text-gray-300">
                Completion Status
              </Label>
              <Select
                value={newQuestion.status}
                onValueChange={(value: any) => setNewQuestion({ ...newQuestion, status: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-500 text-white">
                  <SelectItem value="Not Started" className="text-white hover:bg-gray-600">
                    Not Started
                  </SelectItem>
                  <SelectItem value="In Progress" className="text-white hover:bg-gray-600">
                    In Progress
                  </SelectItem>
                  <SelectItem value="Completed" className="text-white hover:bg-gray-600">
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="link" className="text-gray-300">
              Link to Paper
            </Label>
            <Input
              id="link"
              value={newQuestion.link}
              onChange={(e) => setNewQuestion({ ...newQuestion, link: e.target.value })}
              placeholder="https://..."
              className="bg-gray-700 border-gray-500 text-white placeholder-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="doubts" className="text-gray-300">
              Doubts
            </Label>
            <Textarea
              id="doubts"
              value={newQuestion.doubts}
              onChange={(e) => setNewQuestion({ ...newQuestion, doubts: e.target.value })}
              placeholder="Any doubts or notes about this question set..."
              className="bg-gray-700 border-gray-500 text-white placeholder-gray-400"
            />
          </div>
          <Button onClick={addQuestion} className="w-full bg-white hover:bg-gray-200 text-black">
            Add Question Set
          </Button>
        </CardContent>
      </Card>

      {/* Delete Controls */}
      {questions.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleDeleteMode}
            variant={deleteMode ? "destructive" : "outline"}
            className={
              deleteMode
                ? "bg-gray-600 hover:bg-gray-500 text-white"
                : "border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
            }
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteMode ? "Cancel Delete" : "Delete Mode"}
          </Button>

          {deleteMode && selectedForDeletion.size > 0 && (
            <Button onClick={deleteSelectedQuestions} className="bg-gray-600 hover:bg-gray-500 text-white">
              Delete Selected ({selectedForDeletion.size})
            </Button>
          )}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id} className="bg-gray-800 border-gray-600 hover:bg-gray-700 transition-colors">
            <CardContent className="p-4">
              <div
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleExpanded(question.id)}
              >
                <div className="flex items-start gap-3 flex-1">
                  {deleteMode && (
                    <Checkbox
                      checked={selectedForDeletion.has(question.id)}
                      onCheckedChange={() => toggleQuestionForDeletion(question.id)}
                      className="mt-1 border-gray-500 data-[state=checked]:bg-white data-[state=checked]:border-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{question.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className={getStatusColor(question.status)}
                        onClick={(e) => handleStatusClick(e, question.id, question.status)}
                        title="Click to change status"
                      >
                        {question.status}
                      </Badge>
                      <span className="text-sm text-gray-400">Added: {question.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {question.link && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={question.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {!deleteMode && (
                    <>
                      {expandedId === question.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </>
                  )}
                </div>
              </div>

              {expandedId === question.id && question.doubts && !deleteMode && (
                <div className="mt-4 p-3 bg-gray-700 rounded border-l-4 border-white">
                  <h4 className="font-medium text-white mb-2">Doubts:</h4>
                  <p className="text-gray-300 whitespace-pre-wrap">{question.doubts}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">
                No question sets added for {subject.charAt(0).toUpperCase() + subject.slice(1)} yet. Add your first
                question set above!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
