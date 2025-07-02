"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Eye, Calendar, Clock } from "lucide-react"

interface Activity {
  id: string
  name: string
  status: "completed" | "in-progress" | "not-started"
  date: string
  time: string
  doubts: string
}

export default function ActivityTab() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newActivity, setNewActivity] = useState({
    name: "",
    status: "not-started" as const,
    doubts: "",
  })

  useEffect(() => {
    const saved = localStorage.getItem("jee-activities")
    if (saved) {
      setActivities(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("jee-activities", JSON.stringify(activities))
  }, [activities])

  const addActivity = () => {
    const now = new Date()
    const activity: Activity = {
      id: Date.now().toString(),
      ...newActivity,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    }
    setActivities([...activities, activity])
    setNewActivity({ name: "", status: "not-started", doubts: "" })
    setIsAddDialogOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Activities</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Activity Name</Label>
                <Input
                  id="name"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  placeholder="Mock Test, Lab Work, Group Study..."
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newActivity.status}
                  onValueChange={(value: any) => setNewActivity({ ...newActivity, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="doubts">Doubts/Notes</Label>
                <Textarea
                  id="doubts"
                  value={newActivity.doubts}
                  onChange={(e) => setNewActivity({ ...newActivity, doubts: e.target.value })}
                  placeholder="Any doubts or notes about this activity..."
                />
              </div>
              <Button onClick={addActivity} className="w-full">
                Add Activity
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {activities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{activity.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge className={getStatusColor(activity.status)}>{activity.status.replace("-", " ")}</Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {activity.date}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {activity.time}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {activity.doubts && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{activity.name} - Notes</DialogTitle>
                        </DialogHeader>
                        <div className="whitespace-pre-wrap">{activity.doubts}</div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {activities.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No activities added yet. Click "Add Activity" to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
