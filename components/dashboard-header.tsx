"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, CalendarIcon, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import CountUp from "@/components/count-up"
import { motion } from "framer-motion"
import type { RamadanDates } from "./ramadan-date-setup"
import { format, differenceInDays } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function DashboardHeader() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const [ramadanDay, setRamadanDay] = useState(1)
  const [totalDays, setTotalDays] = useState(30)
  const [ramadanDates, setRamadanDates] = useState<RamadanDates>({
    startDate: new Date(2025, 2, 1), // Default: March 1, 2025
    endDate: new Date(2025, 2, 30), // Default: March 30, 2025
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [startCalendarOpen, setStartCalendarOpen] = useState(false)
  const [endCalendarOpen, setEndCalendarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Load saved Ramadan dates from localStorage
    const savedDates = localStorage.getItem("ramadanDates")
    if (savedDates) {
      try {
        const parsed = JSON.parse(savedDates)
        setRamadanDates({
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
        })
      } catch (error) {
        console.error("Error parsing saved Ramadan dates:", error)
      }
    }

    const timer = setInterval(() => setDate(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (ramadanDates.startDate && ramadanDates.endDate) {
      // Calculate total days in Ramadan
      const days = differenceInDays(ramadanDates.endDate, ramadanDates.startDate) + 1
      setTotalDays(days)

      // Calculate current Ramadan day
      const today = new Date()
      const startDate = new Date(ramadanDates.startDate)

      // If before Ramadan, show day 0
      if (today < startDate) {
        setRamadanDay(0)
        return
      }

      // If after Ramadan, show the last day
      if (today > ramadanDates.endDate) {
        setRamadanDay(days)
        return
      }

      // Calculate current day
      const currentDay = differenceInDays(today, startDate) + 1
      setRamadanDay(currentDay)
    }
  }, [ramadanDates])

  const handleSaveSettings = () => {
    // Save to localStorage
    localStorage.setItem(
      "ramadanDates",
      JSON.stringify({
        startDate: ramadanDates.startDate.toISOString(),
        endDate: ramadanDates.endDate.toISOString(),
      }),
    )

    setSettingsOpen(false)
  }

  if (!mounted) return null

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 3,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-primary/20 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Moon className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Mubalog
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
                <Settings className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ramadan Settings</DialogTitle>
                <DialogDescription>Adjust your Ramadan dates to match your local observation.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(ramadanDates.startDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={ramadanDates.startDate}
                          onSelect={(date) => {
                            if (date) {
                              setRamadanDates((prev) => ({ ...prev, startDate: date }))
                              setStartCalendarOpen(false)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(ramadanDates.endDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={ramadanDates.endDate}
                          onSelect={(date) => {
                            if (date) {
                              setRamadanDates((prev) => ({ ...prev, endDate: date }))
                              setEndCalendarOpen(false)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSettings}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-10 h-10"
          >
            {theme === "dark" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col gap-1 p-6 border rounded-xl bg-card shadow-md"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm font-medium">
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-semibold flex items-baseline gap-2">
            Ramadan Day
            <span className="text-primary font-bold">
              <CountUp from={0} to={ramadanDay} separator="," duration={1.5} className="text-3xl" />
            </span>
          </h2>
          <div className="px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary">
            <CountUp from={31} to={totalDays - ramadanDay} direction="down" duration={1.5} /> days remaining
          </div>
        </div>
        <div className="w-full h-3 mt-3 overflow-hidden rounded-full bg-muted relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(ramadanDay / totalDays) * 100}%` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="h-full bg-primary absolute top-0 left-0"
          />
          <div className="absolute top-0 left-0 w-full h-full flex justify-between px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-full w-0.5 ${i === 0 || i === 5 ? "opacity-0" : "bg-background/20"}`}
                style={{ left: `${(i / 5) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{format(ramadanDates.startDate, "MMM d")}</span>
          <span>{format(ramadanDates.endDate, "MMM d, yyyy")}</span>
        </div>
      </motion.div>
    </motion.header>
  )
}

