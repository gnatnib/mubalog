"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Check, Clock, Moon, Plus, Sun, Minus, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import CountUp from "@/components/count-up"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DeedType = "taraweeh" | "fasting" | "quran" | "charity" | "dhikr"

type Deed = {
  type: DeedType
  name: string
  icon: React.ReactNode
  description: string
  target: number
  unit: string
  color: string
  customizable: boolean
}

type DeedProgress = {
  [key in DeedType]: {
    completed: boolean
    progress: number
    target: number
    history: {
      date: string
      value: number
    }[]
  }
}

const DEFAULT_DEEDS: Deed[] = [
  {
    type: "taraweeh",
    name: "Taraweeh Prayer",
    icon: <Moon className="w-5 h-5" />,
    description: "Track your nightly Taraweeh prayers during Ramadan",
    target: 20,
    unit: "rakats",
    color: "bg-purple-500",
    customizable: true,
  },
  {
    type: "fasting",
    name: "Fasting",
    icon: <Sun className="w-5 h-5" />,
    description: "Track your daily fasting during Ramadan",
    target: 1,
    unit: "day",
    color: "bg-amber-500",
    customizable: false,
  },
  {
    type: "quran",
    name: "Quran Reading",
    icon: <Book className="w-5 h-5" />,
    description: "Track your daily Quran reading",
    target: 10,
    unit: "pages",
    color: "bg-emerald-500",
    customizable: true,
  },
  {
    type: "charity",
    name: "Charity",
    icon: <Heart className="w-5 h-5" />,
    description: "Track your charitable acts during Ramadan",
    target: 1,
    unit: "act",
    color: "bg-rose-500",
    customizable: true,
  },
  {
    type: "dhikr",
    name: "Dhikr",
    icon: <Repeat className="w-5 h-5" />,
    description: "Track your daily remembrance of Allah",
    target: 100,
    unit: "times",
    color: "bg-sky-500",
    customizable: true,
  },
]

// Custom icons
function Book(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

function Heart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function Repeat(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

export default function GoodDeedsTracker() {
  const [deeds, setDeeds] = useState<Deed[]>(DEFAULT_DEEDS)
  const [progress, setProgress] = useState<DeedProgress>({
    taraweeh: { completed: false, progress: 0, target: 20, history: [] },
    fasting: { completed: false, progress: 0, target: 1, history: [] },
    quran: { completed: false, progress: 0, target: 10, history: [] },
    charity: { completed: false, progress: 0, target: 1, history: [] },
    dhikr: { completed: false, progress: 0, target: 100, history: [] },
  })

  const [activeTab, setActiveTab] = useState<DeedType>("taraweeh")
  const [streaks, setStreaks] = useState({
    taraweeh: 0,
    fasting: 0,
    quran: 0,
    charity: 0,
    dhikr: 0,
  })

  const [editingDeed, setEditingDeed] = useState<DeedType | null>(null)
  const [newTarget, setNewTarget] = useState<number>(0)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  useEffect(() => {
    const storedDeeds = localStorage.getItem("deeds")
    if (storedDeeds) {
      setDeeds(JSON.parse(storedDeeds))
    }

    const storedProgress = localStorage.getItem("deedsProgress")
    if (storedProgress) {
      setProgress(JSON.parse(storedProgress))
    }

    const storedStreaks = localStorage.getItem("deedsStreaks")
    if (storedStreaks) {
      setStreaks(JSON.parse(storedStreaks))
    }

    // Check if deeds were completed today
    checkTodayCompletion()
  }, [])

  const checkTodayCompletion = () => {
    const today = new Date().toISOString().split("T")[0]

    const newProgress = { ...progress }

    Object.keys(newProgress).forEach((key) => {
      const deedType = key as DeedType
      const lastEntry = newProgress[deedType].history[newProgress[deedType].history.length - 1]

      if (lastEntry && lastEntry.date === today) {
        const deed = deeds.find((d) => d.type === deedType)
        if (deed && lastEntry.value >= newProgress[deedType].target) {
          newProgress[deedType].completed = true
        }
      } else {
        // Reset progress for a new day
        newProgress[deedType].completed = false
        newProgress[deedType].progress = 0
      }
    })

    setProgress(newProgress)
  }

  const updateProgress = (type: DeedType, amount: number) => {
    const deed = deeds.find((d) => d.type === type)
    if (!deed) return

    const today = new Date().toISOString().split("T")[0]

    const newProgress = { ...progress }
    const deedProgress = newProgress[type]

    // Ensure we don't go below 0
    if (deedProgress.progress + amount < 0) {
      amount = -deedProgress.progress
    }

    // Check if there's an entry for today
    const todayEntryIndex = deedProgress.history.findIndex((entry) => entry.date === today)

    if (todayEntryIndex >= 0) {
      // Update today's entry
      deedProgress.history[todayEntryIndex].value += amount
      deedProgress.progress = deedProgress.history[todayEntryIndex].value
    } else {
      // Create a new entry for today
      deedProgress.history.push({ date: today, value: amount })
      deedProgress.progress = amount
    }

    // Check if the deed is completed for today
    if (deedProgress.progress >= deedProgress.target && !deedProgress.completed) {
      deedProgress.completed = true

      // Update streak
      const newStreaks = { ...streaks }
      newStreaks[type] += 1
      setStreaks(newStreaks)
      localStorage.setItem("deedsStreaks", JSON.stringify(newStreaks))
    } else if (deedProgress.progress < deedProgress.target && deedProgress.completed) {
      deedProgress.completed = false
    }

    setProgress(newProgress)
    localStorage.setItem("deedsProgress", JSON.stringify(newProgress))
  }

  const getProgressPercentage = (type: DeedType) => {
    const deedProgress = progress[type]
    if (!deedProgress) return 0

    return Math.min(Math.round((deedProgress.progress / deedProgress.target) * 100), 100)
  }

  const updateDeedTarget = (type: DeedType, newTarget: number) => {
    // Update the deed target
    const newDeeds = deeds.map((deed) => (deed.type === type ? { ...deed, target: newTarget } : deed))
    setDeeds(newDeeds)
    localStorage.setItem("deeds", JSON.stringify(newDeeds))

    // Update the progress target
    const newProgress = { ...progress }
    newProgress[type].target = newTarget

    // Check if the deed is now completed based on the new target
    if (newProgress[type].progress >= newTarget && !newProgress[type].completed) {
      newProgress[type].completed = true
    } else if (newProgress[type].progress < newTarget && newProgress[type].completed) {
      newProgress[type].completed = false
    }

    setProgress(newProgress)
    localStorage.setItem("deedsProgress", JSON.stringify(newProgress))

    setEditingDeed(null)
    setShowSettingsDialog(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="mt-6"
    >
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle>Good Deeds Tracker</CardTitle>
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => setShowSettingsDialog(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Track your daily good deeds during Ramadan</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="taraweeh" value={activeTab} onValueChange={(value) => setActiveTab(value as DeedType)}>
            <TabsList className="grid grid-cols-5 mb-6">
              {deeds.map((deed) => (
                <TabsTrigger key={deed.type} value={deed.type} className="relative">
                  <span className="flex items-center gap-2">
                    {deed.icon}
                    <span className="hidden md:inline">{deed.name}</span>
                  </span>
                  {progress[deed.type].completed && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {deeds.map((deed) => (
              <TabsContent key={deed.type} value={deed.type} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col md:flex-row gap-4 md:items-center justify-between"
                >
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {deed.icon}
                      {deed.name}
                    </h3>
                    <p className="text-muted-foreground">{deed.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateProgress(deed.type, -1)}
                      disabled={progress[deed.type].progress <= 0}
                      className="rounded-full w-8 h-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateProgress(deed.type, 1)}
                      disabled={progress[deed.type].completed}
                      className="rounded-full"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add {deed.unit}
                    </Button>

                    {deed.type === "taraweeh" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateProgress(deed.type, 4)}
                        disabled={progress[deed.type].completed}
                        className="rounded-full"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add 4 rakats
                      </Button>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="p-5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Today's Progress</span>
                    </div>
                    <span className="font-medium flex items-baseline gap-1">
                      <CountUp from={0} to={progress[deed.type].progress} duration={1} className="text-lg font-bold" />
                      <span className="text-muted-foreground">
                        / {progress[deed.type].target} {deed.unit}
                      </span>
                    </span>
                  </div>

                  <div className="relative pt-1">
                    <Progress value={getProgressPercentage(deed.type)} className="h-3" />
                    <AnimatePresence>
                      {progress[deed.type].completed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className={`absolute -right-1 -top-1 w-5 h-5 rounded-full ${deed.color} flex items-center justify-center`}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1">
                        <CountUp from={0} to={streaks[deed.type]} duration={1} className="font-bold" /> day streak
                      </span>
                    </div>

                    {progress[deed.type].completed ? (
                      <span className="text-xs font-medium text-green-500 flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Completed for today
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {progress[deed.type].target - progress[deed.type].progress} {deed.unit} remaining
                      </span>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="mt-4"
                >
                  <h4 className="font-medium mb-3">Recent History</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const date = new Date()
                      date.setDate(date.getDate() - i)
                      const dateStr = date.toISOString().split("T")[0]

                      const historyEntry = progress[deed.type].history.find((entry) => entry.date === dateStr)

                      const isCompleted = historyEntry && historyEntry.value >= progress[deed.type].target

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 border rounded-lg aspect-square",
                            isCompleted
                              ? `${deed.color.replace("bg-", "bg-opacity-20 border-")}`
                              : "bg-muted/30 border-muted",
                          )}
                        >
                          <span className="text-xs">
                            {date.toLocaleDateString("en-US", { weekday: "short" }).substring(0, 3)}
                          </span>
                          <span className="text-xs font-medium">{date.getDate()}</span>
                          {isCompleted && <Check className={`w-3 h-3 mt-1 ${deed.color.replace("bg-", "text-")}`} />}
                          {historyEntry && !isCompleted && (
                            <span className={`text-xs font-medium mt-1 ${deed.color.replace("bg-", "text-")}`}>
                              {historyEntry.value}
                            </span>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Customize Targets</DialogTitle>
            <DialogDescription>Set your personal targets for each good deed</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {deeds.map(
              (deed) =>
                deed.customizable && (
                  <div key={deed.type} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`target-${deed.type}`} className="text-right col-span-1">
                      {deed.name}
                    </Label>
                    <div className="col-span-2">
                      <Input
                        id={`target-${deed.type}`}
                        type="number"
                        min="1"
                        value={progress[deed.type].target}
                        onChange={(e) => {
                          const newTarget = Number.parseInt(e.target.value) || 1
                          const newProgress = { ...progress }
                          newProgress[deed.type].target = newTarget
                          setProgress(newProgress)
                        }}
                        className="col-span-2"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{deed.unit}</span>
                  </div>
                ),
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target-taraweeh-preset" className="text-right col-span-1">
                Taraweeh Preset
              </Label>
              <Select
                onValueChange={(value) => {
                  const newTarget = Number.parseInt(value)
                  const newProgress = { ...progress }
                  newProgress.taraweeh.target = newTarget
                  setProgress(newProgress)
                }}
                defaultValue={progress.taraweeh.target.toString()}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select rakats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 rakats</SelectItem>
                  <SelectItem value="20">20 rakats</SelectItem>
                  <SelectItem value="36">36 rakats (with Witr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                localStorage.setItem("deedsProgress", JSON.stringify(progress))
                setShowSettingsDialog(false)
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

