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
import { Plus, Calendar, Clock, ChevronDown, ChevronUp, ExternalLink, Trash2, Database } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface Activity {
  id: string
  name: string
  status: "Completed" | "In Progress" | "Not Started"
  datetime: string
  doubts: string
  reference_link: string
  subject: string
}

interface ActivitiesTabProps {
  subject: string
}

export default function ActivitiesTab({ subject }: ActivitiesTabProps) {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [newActivity, setNewActivity] = useState({
    name: "",
    status: "Not Started" as const,
    doubts: "",
    referenceLink: "",
  })

  useEffect(() => {
    if (user) {
      loadActivities()
    }
  }, [user, subject])

  const loadActivities = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .order("created_at", { ascending: false })

      if (error) throw error

      setActivities(data || [])
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const addActivity = async () => {
    if (!newActivity.name.trim() || !user) return

    try {
      const { data, error } = await supabase
        .from("activities")
        .insert({
          user_id: user.id,
          name: newActivity.name,
          status: newActivity.status,
          doubts: newActivity.doubts,
          reference_link: newActivity.referenceLink,
          datetime: new Date().toLocaleString(),
          subject: subject,
        })
        .select()
        .single()

      if (error) throw error

      setActivities([data, ...activities])
      setNewActivity({ name: "", status: "Not Started", doubts: "", referenceLink: "" })
    } catch (error) {
      console.error("Error adding activity:", error)
    }
  }

  const updateActivityStatus = async (id: string, newStatus: Activity["status"]) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("activities")
        .update({ status: newStatus })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error

      setActivities((prev) =>
        prev.map((activity) => (activity.id === id ? { ...activity, status: newStatus } : activity)),
      )
    } catch (error) {
      console.error("Error updating activity status:", error)
    }
  }

  const deleteSelectedActivities = async () => {
    if (!user || selectedForDeletion.size === 0) return

    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("user_id", user.id)
        .in("id", Array.from(selectedForDeletion))

      if (error) throw error

      setActivities((prev) => prev.filter((activity) => !selectedForDeletion.has(activity.id)))
      setSelectedForDeletion(new Set())
      setDeleteMode(false)
    } catch (error) {
      console.error("Error deleting activities:", error)
    }
  }

  const cycleStatus = (currentStatus: Activity["status"]): Activity["status"] => {
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

  const handleStatusClick = (e: React.MouseEvent, activityId: string, currentStatus: Activity["status"]) => {
    e.stopPropagation()
    const newStatus = cycleStatus(currentStatus)
    updateActivityStatus(activityId, newStatus)
  }

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode)
    setSelectedForDeletion(new Set())
  }

  const toggleActivityForDeletion = (activityId: string) => {
    const newSelected = new Set(selectedForDeletion)
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId)
    } else {
      newSelected.add(activityId)
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
        <span className="ml-2 text-white">Loading activities...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Activity Form */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Activity ({subject.charAt(0).toUpperCase() + subject.slice(1)})
            <Database className="h-4 w-4 text-gray-400 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">
                Name of Activity
              </Label>
              <Input
                id="name"
                value={newActivity.name}
                onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                placeholder="Mock Test, Lab Work, Group Study..."
                className="bg-gray-700 border-gray-500 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="status" className="text-gray-300">
                Completion Status
              </Label>
              <Select
                value={newActivity.status}
                onValueChange={(value: any) => setNewActivity({ ...newActivity, status: value })}
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
            <Label htmlFor="referenceLink" className="text-gray-300">
              Reference Link
            </Label>
            <Input
              id="referenceLink"
              value={newActivity.referenceLink}
              onChange={(e) => setNewActivity({ ...newActivity, referenceLink: e.target.value })}
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
              value={newActivity.doubts}
              onChange={(e) => setNewActivity({ ...newActivity, doubts: e.target.value })}
              placeholder="Any doubts or notes about this activity..."
              className="bg-gray-700 border-gray-500 text-white placeholder-gray-400"
            />
          </div>
          <Button onClick={addActivity} className="w-full bg-white hover:bg-gray-200 text-black">
            Add Activity
          </Button>
        </CardContent>
      </Card>

      {/* Delete Controls */}
      {activities.length > 0 && (
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
            <Button onClick={deleteSelectedActivities} className="bg-gray-600 hover:bg-gray-500 text-white">
              Delete Selected ({selectedForDeletion.size})
            </Button>
          )}
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-4">
        {activities.map((activity) => (
          <Card key={activity.id} className="bg-gray-800 border-gray-600 hover:bg-gray-700 transition-colors">
            <CardContent className="p-4">
              <div
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleExpanded(activity.id)}
              >
                <div className="flex items-start gap-3 flex-1">
                  {deleteMode && (
                    <Checkbox
                      checked={selectedForDeletion.has(activity.id)}
                      onCheckedChange={() => toggleActivityForDeletion(activity.id)}
                      className="mt-1 border-gray-500 data-[state=checked]:bg-white data-[state=checked]:border-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{activity.name}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge
                        className={getStatusColor(activity.status)}
                        onClick={(e) => handleStatusClick(e, activity.id, activity.status)}
                        title="Click to change status"
                      >
                        {activity.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <Clock className="h-4 w-4" />
                        {activity.datetime}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activity.reference_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={activity.reference_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {!deleteMode && (
                    <>
                      {expandedId === activity.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </>
                  )}
                </div>
              </div>

              {expandedId === activity.id && activity.doubts && !deleteMode && (
                <div className="mt-4 p-3 bg-gray-700 rounded border-l-4 border-white">
                  <h4 className="font-medium text-white mb-2">Doubts:</h4>
                  <p className="text-gray-300 whitespace-pre-wrap">{activity.doubts}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {activities.length === 0 && (
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">
                No activities added for {subject.charAt(0).toUpperCase() + subject.slice(1)} yet. Add your first
                activity above!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
