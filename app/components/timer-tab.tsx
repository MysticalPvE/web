"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Play, Square, Upload, Pause, SkipForward, SkipBack, Music, Database } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface AudioFile {
  id: string
  name: string
  file_url: string
  file_size?: number
  mime_type?: string
}

export default function TimerTab() {
  const { user } = useAuth()
  const [studyTime, setStudyTime] = useState(0)
  const [breakTime, setBreakTime] = useState(0)
  const [isStudying, setIsStudying] = useState(false)
  const [isOnBreak, setIsOnBreak] = useState(false)
  const [totalStudyTime, setTotalStudyTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([50])
  const [audioQueue, setAudioQueue] = useState<AudioFile[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [studyTimeAddedToTotal, setStudyTimeAddedToTotal] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (user) {
      loadTotalStudyTime()
      loadAudioFiles()
    }
  }, [user])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current && audioQueue.length > 0 && currentTrackIndex < audioQueue.length) {
      audioRef.current.src = audioQueue[currentTrackIndex].file_url
      audioRef.current.onended = () => {
        nextTrack()
      }
    }
  }, [currentTrackIndex, audioQueue])

  const loadTotalStudyTime = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("study_sessions")
        .select("total_study_time")
        .eq("user_id", user.id)
        .eq("session_date", today)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading study time:", error)
        return
      }

      if (data) {
        setTotalStudyTime(data.total_study_time)
      }
    } catch (error) {
      console.error("Error loading study time:", error)
    }
  }

  const saveTotalStudyTime = async (time: number) => {
    if (!user) return

    try {
      const today = new Date().toISOString().split("T")[0]
      const { error } = await supabase.from("study_sessions").upsert(
        {
          user_id: user.id,
          session_date: today,
          total_study_time: time,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,session_date",
        },
      )

      if (error) {
        console.error("Error saving study time:", error)
      }
    } catch (error) {
      console.error("Error saving study time:", error)
    }
  }

  const loadAudioFiles = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("audio_files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setAudioQueue(data || [])
    } catch (error) {
      console.error("Error loading audio files:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !user) return

    for (const file of Array.from(files)) {
      if (file.type.startsWith("audio/")) {
        try {
          // Upload file to Supabase Storage
          const fileName = `${user.id}/${Date.now()}-${file.name}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("audio-files")
            .upload(fileName, file)

          if (uploadError) throw uploadError

          // Get public URL
          const { data: urlData } = supabase.storage.from("audio-files").getPublicUrl(fileName)

          // Save file info to database
          const { data, error } = await supabase
            .from("audio_files")
            .insert({
              user_id: user.id,
              name: file.name,
              file_url: urlData.publicUrl,
              file_size: file.size,
              mime_type: file.type,
            })
            .select()
            .single()

          if (error) throw error

          setAudioQueue((prev) => [data, ...prev])
        } catch (error) {
          console.error("Error uploading audio file:", error)
        }
      }
    }
  }

  const removeFromQueue = async (id: string) => {
    if (!user) return

    try {
      // Get file info to delete from storage
      const audioFile = audioQueue.find((f) => f.id === id)
      if (audioFile) {
        // Extract file path from URL
        const urlParts = audioFile.file_url.split("/")
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `${user.id}/${fileName}`

        // Delete from storage
        await supabase.storage.from("audio-files").remove([filePath])
      }

      // Delete from database
      const { error } = await supabase.from("audio_files").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      setAudioQueue((prev) => prev.filter((audio) => audio.id !== id))
      if (currentTrackIndex >= audioQueue.length - 1) {
        setCurrentTrackIndex(0)
      }
    } catch (error) {
      console.error("Error removing audio file:", error)
    }
  }

  const nextTrack = () => {
    if (audioQueue.length > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % audioQueue.length)
    }
  }

  const previousTrack = () => {
    if (audioQueue.length > 0) {
      setCurrentTrackIndex((prev) => (prev - 1 + audioQueue.length) % audioQueue.length)
    }
  }

  const startStudy = () => {
    setIsStudying(true)
    setIsOnBreak(false)
    setStudyTimeAddedToTotal(false)

    intervalRef.current = setInterval(() => {
      setStudyTime((prev) => prev + 1)
    }, 1000)
  }

  const startBreak = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    const breakDuration = Math.floor(studyTime / 5)
    setBreakTime(breakDuration)
    setIsStudying(false)
    setIsOnBreak(true)

    // Add study time to total only once
    if (!studyTimeAddedToTotal) {
      const newTotal = totalStudyTime + studyTime
      setTotalStudyTime(newTotal)
      saveTotalStudyTime(newTotal)
      setStudyTimeAddedToTotal(true)
    }

    intervalRef.current = setInterval(() => {
      setBreakTime((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setIsOnBreak(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    // Only add to total if it wasn't already added during break
    if (studyTime > 0 && !isOnBreak && !studyTimeAddedToTotal) {
      const newTotal = totalStudyTime + studyTime
      setTotalStudyTime(newTotal)
      saveTotalStudyTime(newTotal)
    }

    setStudyTime(0)
    setBreakTime(0)
    setIsStudying(false)
    setIsOnBreak(false)
    setStudyTimeAddedToTotal(false)
  }

  const toggleAudio = () => {
    if (!audioRef.current || audioQueue.length === 0) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const currentTrack = audioQueue[currentTrackIndex]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer Display */}
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Study Timer
              <Database className="h-4 w-4 text-gray-400 ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-white mb-2">{formatTime(studyTime)}</div>
              {isOnBreak && (
                <div className="text-2xl font-mono font-semibold text-gray-400">Break: {formatTime(breakTime)}</div>
              )}
              <div className="text-sm text-gray-400 mt-4">Total Time Studied Today: {formatTime(totalStudyTime)}</div>
            </div>

            <div className="flex justify-center gap-2 flex-wrap">
              {!isStudying && !isOnBreak ? (
                <Button onClick={startStudy} className="bg-white hover:bg-gray-200 text-black">
                  <Play className="h-4 w-4 mr-2" />
                  Start Study
                </Button>
              ) : null}

              {isStudying && (
                <Button onClick={startBreak} className="bg-gray-400 hover:bg-gray-300 text-black">
                  Start Break
                </Button>
              )}

              <Button onClick={resetTimer} className="bg-gray-600 hover:bg-gray-500 text-white">
                <Square className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audio Queue Control */}
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="h-5 w-5" />
              Audio Queue
              <Database className="h-4 w-4 text-gray-400 ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio Files
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {audioQueue.length > 0 && (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-1">Now Playing:</p>
                  <p className="font-medium text-white">{currentTrack?.name || "No track selected"}</p>
                  <p className="text-xs text-gray-400">
                    {currentTrackIndex + 1} of {audioQueue.length}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={previousTrack}
                    variant="outline"
                    size="sm"
                    className="border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={toggleAudio}
                    variant={isPlaying ? "default" : "outline"}
                    size="lg"
                    className={
                      isPlaying
                        ? "bg-white hover:bg-gray-200 text-black"
                        : "border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
                    }
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  <Button
                    onClick={nextTrack}
                    variant="outline"
                    size="sm"
                    className="border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Volume: {volume[0]}%</label>
                  <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-full" />
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1">
                  <p className="text-sm font-medium text-gray-300 mb-2">Queue:</p>
                  {audioQueue.map((audio, index) => (
                    <div
                      key={audio.id}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        index === currentTrackIndex ? "bg-gray-700 text-white" : "text-gray-400"
                      }`}
                    >
                      <span className="truncate">{audio.name}</span>
                      <Button
                        onClick={() => removeFromQueue(audio.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-700 hover:text-white"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {audioQueue.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-400">Upload audio files to create your study playlist</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timer Status */}
      <Card className="bg-gray-800 border-gray-600">
        <CardContent className="p-4">
          <div className="text-center">
            {isStudying && <p className="text-white font-semibold">📚 Study Session Active</p>}
            {isOnBreak && <p className="text-gray-400 font-semibold">☕ Break Time</p>}
          </div>
        </CardContent>
      </Card>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  )
}
