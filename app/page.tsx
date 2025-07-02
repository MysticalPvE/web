"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import SignIn from "./components/auth/sign-in"
import UserProfile from "./components/auth/user-profile"
import ConfigError from "./components/config-error"
import TrackerTab from "./components/tracker-tab"
import QuestionsTab from "./components/questions-tab"
import ActivitiesTab from "./components/activities-tab"
import TimerTab from "./components/timer-tab"
import NotesTab from "./components/notes-tab"
import AITab from "./components/ai-tab"
import { Loader2, CheckCircle } from "lucide-react"

export default function JEEPlanner() {
  const { user, loading, error } = useAuth()
  const [activeSubject, setActiveSubject] = useState("maths")
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault()
        window.scrollBy(0, -100)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        window.scrollBy(0, 100)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Show welcome message for new users
  useEffect(() => {
    if (user && !loading) {
      const hasSeenWelcome = localStorage.getItem(`welcome-${user.id}`)
      if (!hasSeenWelcome) {
        setShowWelcome(true)
        localStorage.setItem(`welcome-${user.id}`, "true")
        setTimeout(() => setShowWelcome(false), 5000) // Hide after 5 seconds
      }
    }
  }, [user, loading])

  if (error) {
    return <ConfigError error={error} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your study dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <SignIn />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Welcome Message */}
      {showWelcome && (
        <div className="fixed top-4 right-4 z-50 bg-green-900/90 border border-green-600 rounded-lg p-4 max-w-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-green-200 font-medium">Welcome, {user.user_metadata?.full_name || user.email}!</p>
              <p className="text-green-300 text-sm">Successfully signed in to JEE Study Tool</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">JEE Study Tool</h1>
          <UserProfile />
        </div>

        {/* Subject Selection */}
        <Tabs value={activeSubject} onValueChange={setActiveSubject} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-900 border-gray-700">
            <TabsTrigger value="chemistry" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Chemistry
            </TabsTrigger>
            <TabsTrigger value="maths" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Mathematics
            </TabsTrigger>
            <TabsTrigger value="physics" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Physics
            </TabsTrigger>
          </TabsList>

          {/* Main Content Tabs */}
          <div className="bg-gray-900 rounded-lg shadow-xl p-6 border border-gray-700">
            <Tabs defaultValue="tracker" className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-6 bg-gray-800 border-gray-600">
                <TabsTrigger value="tracker" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                  Tracker
                </TabsTrigger>
                <TabsTrigger
                  value="questions"
                  className="data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                >
                  Questions
                </TabsTrigger>
                <TabsTrigger
                  value="activities"
                  className="data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                >
                  Activities
                </TabsTrigger>
                <TabsTrigger value="timer" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                  Timer
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                  Notes
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                  AI Tutor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tracker">
                <TrackerTab subject={activeSubject} />
              </TabsContent>

              <TabsContent value="questions">
                <QuestionsTab subject={activeSubject} />
              </TabsContent>

              <TabsContent value="activities">
                <ActivitiesTab subject={activeSubject} />
              </TabsContent>

              <TabsContent value="timer">
                <TimerTab />
              </TabsContent>

              <TabsContent value="notes">
                <NotesTab />
              </TabsContent>

              <TabsContent value="ai">
                <AITab subject={activeSubject} />
              </TabsContent>
            </Tabs>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
