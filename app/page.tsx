"use client"

import { useState, useEffect } from "react"
import DailyLogin from "@/components/daily-login"
import DashboardHeader from "@/components/dashboard-header"
import GoodDeedsTracker from "@/components/good-deeds-tracker"
import QuranVerse from "@/components/quran-verse"
import PrayerTimes from "@/components/prayer-times"
import RamadanDateSetup, { type RamadanDates } from "@/components/ramadan-date-setup"

export default function Home() {
  const [ramadanDates, setRamadanDates] = useState<RamadanDates | null>(null)

  useEffect(() => {
    // Check if user has already set Ramadan dates
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
  }, [])

  const handleSaveRamadanDates = (dates: RamadanDates) => {
    setRamadanDates(dates)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <RamadanDateSetup onSave={handleSaveRamadanDates} />
      <div className="container max-w-6xl px-4 py-6 mx-auto">
        <DashboardHeader />
        <div className="grid gap-6 mt-8 md:grid-cols-2">
          <DailyLogin />
          <QuranVerse />
        </div>
        <PrayerTimes />
        <GoodDeedsTracker />
      </div>
    </main>
  )
}

