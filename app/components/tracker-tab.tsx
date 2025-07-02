"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { subjectData } from "../data/subjects"
import { Loader2, Database } from "lucide-react"

interface TrackerTabProps {
  subject: string
}

interface TopicProgress {
  theory: boolean
  questions: boolean
  revision1: boolean
  revision2: boolean
  revision3: boolean
}

export default function TrackerTab({ subject }: TrackerTabProps) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<Record<string, Record<string, TopicProgress>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadProgress()
    }
  }, [user, subject])

  const loadProgress = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("tracker_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject", subject)

      if (error) throw error

      const progressMap: Record<string, Record<string, TopicProgress>> = {}

      data?.forEach((item) => {
        if (!progressMap[subject]) {
          progressMap[subject] = {}
        }
        progressMap[subject][item.topic_key] = {
          theory: item.theory,
          questions: item.questions,
          revision1: item.revision1,
          revision2: item.revision2,
          revision3: item.revision3,
        }
      })

      setProgress(progressMap)
    } catch (error) {
      console.error("Error loading progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (subject: string, topic: string, field: keyof TopicProgress, value: boolean) => {
    if (!user) return

    // Update local state immediately for better UX
    setProgress((prev) => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [topic]: {
          ...prev[subject]?.[topic],
          [field]: value,
        },
      },
    }))

    try {
      const { error } = await supabase.from("tracker_progress").upsert(
        {
          user_id: user.id,
          subject,
          topic_key: topic,
          [field]: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,subject,topic_key",
        },
      )

      if (error) {
        console.error("Error updating progress:", error)
        // Revert local state on error
        loadProgress()
      }
    } catch (error) {
      console.error("Error updating progress:", error)
      loadProgress()
    }
  }

  const calculateOverallProgress = (subject: string) => {
    const currentSubjectData = subjectData[subject as keyof typeof subjectData]
    let totalWeightedProgress = 0
    let totalWeightage = 0

    // Calculate for Class XI
    currentSubjectData.classXI.forEach((topic) => {
      const topicKey = `XI-${topic.name}`
      const topicProgress = progress[subject]?.[topicKey] || {
        theory: false,
        questions: false,
        revision1: false,
        revision2: false,
        revision3: false,
      }

      const checkedBoxes = Object.values(topicProgress).filter(Boolean).length
      const topicContribution = (topic.weightage / 5) * checkedBoxes
      totalWeightedProgress += topicContribution
      totalWeightage += topic.weightage
    })

    // Calculate for Class XII
    currentSubjectData.classXII.forEach((topic) => {
      const topicKey = `XII-${topic.name}`
      const topicProgress = progress[subject]?.[topicKey] || {
        theory: false,
        questions: false,
        revision1: false,
        revision2: false,
        revision3: false,
      }

      const checkedBoxes = Object.values(topicProgress).filter(Boolean).length
      const topicContribution = (topic.weightage / 5) * checkedBoxes
      totalWeightedProgress += topicContribution
      totalWeightage += topic.weightage
    })

    return totalWeightage > 0 ? (totalWeightedProgress / totalWeightage) * 100 : 0
  }

  const renderTopicRow = (topic: any, className: string) => {
    const topicKey = `${className}-${topic.name}`
    const topicProgress = progress[subject]?.[topicKey] || {
      theory: false,
      questions: false,
      revision1: false,
      revision2: false,
      revision3: false,
    }

    return (
      <tr key={topicKey} className="border-b border-gray-600 hover:bg-gray-800">
        <td className="p-3 font-medium text-white">{topic.name}</td>
        <td className="p-3 text-center font-semibold text-gray-300">{topic.weightage}</td>
        <td className="p-3 text-center">
          <Checkbox
            checked={topicProgress.theory}
            onCheckedChange={(checked) => updateProgress(subject, topicKey, "theory", !!checked)}
            className="border-gray-500 data-[state=checked]:bg-white data-[state=checked]:border-white"
          />
        </td>
        <td className="p-3 text-center">
          <Checkbox
            checked={topicProgress.questions}
            onCheckedChange={(checked) => updateProgress(subject, topicKey, "questions", !!checked)}
            className="border-gray-500 data-[state=checked]:bg-white data-[state=checked]:border-white"
          />
        </td>
        <td className="p-3 text-center">
          <Checkbox
            checked={topicProgress.revision1}
            onCheckedChange={(checked) => updateProgress(subject, topicKey, "revision1", !!checked)}
            className="border-gray-500 data-[state=checked]:bg-white data-[state=checked]:border-white"
          />
        </td>
        <td className="p-3 text-center">
          <Checkbox
            checked={topicProgress.revision2}
            onCheckedChange={(checked) => updateProgress(subject, topicKey, "revision2", !!checked)}
            className="border-gray-500 data-[state=checked]:bg-white data-[state=checked]:border-white"
          />
        </td>
        <td className="p-3 text-center">
          <Checkbox
            checked={topicProgress.revision3}
            onCheckedChange={(checked) => updateProgress(subject, topicKey, "revision3", !!checked)}
            className="border-gray-500 data-[state=checked]:bg-white data-[state=checked]:border-white"
          />
        </td>
      </tr>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <span className="ml-2 text-white">Loading your progress...</span>
      </div>
    )
  }

  const currentSubjectData = subjectData[subject as keyof typeof subjectData]
  const overallProgress = calculateOverallProgress(subject)

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white capitalize flex items-center gap-2">
            <Database className="h-5 w-5 text-gray-400" />
            {subject} Progress: {overallProgress.toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3 bg-gray-700" />
        </CardContent>
      </Card>

      {/* Class Tabs */}
      <Tabs defaultValue="class-xi" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-600">
          <TabsTrigger value="class-xi" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
            Class XI
          </TabsTrigger>
          <TabsTrigger value="class-xii" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
            Class XII
          </TabsTrigger>
        </TabsList>

        <TabsContent value="class-xi">
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">Class XI Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-600">
                      <th className="p-3 text-left text-gray-300">Chapter</th>
                      <th className="p-3 text-center text-gray-300">Weightage</th>
                      <th className="p-3 text-center text-gray-300">Theory</th>
                      <th className="p-3 text-center text-gray-300">Questions</th>
                      <th className="p-3 text-center text-gray-300">Revision 1</th>
                      <th className="p-3 text-center text-gray-300">Revision 2</th>
                      <th className="p-3 text-center text-gray-300">Revision 3</th>
                    </tr>
                  </thead>
                  <tbody>{currentSubjectData.classXI.map((topic) => renderTopicRow(topic, "XI"))}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class-xii">
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">Class XII Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-600">
                      <th className="p-3 text-left text-gray-300">Chapter</th>
                      <th className="p-3 text-center text-gray-300">Weightage</th>
                      <th className="p-3 text-center text-gray-300">Theory</th>
                      <th className="p-3 text-center text-gray-300">Questions</th>
                      <th className="p-3 text-center text-gray-300">Revision 1</th>
                      <th className="p-3 text-center text-gray-300">Revision 2</th>
                      <th className="p-3 text-center text-gray-300">Revision 3</th>
                    </tr>
                  </thead>
                  <tbody>{currentSubjectData.classXII.map((topic) => renderTopicRow(topic, "XII"))}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
