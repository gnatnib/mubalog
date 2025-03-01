"use client"

import { cn } from "@/lib/utils"

import { useEffect, useState } from "react"
import { Clock, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { DateTime } from "luxon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface PrayerTimings {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

export default function PrayerTimes() {
  const [city, setCity] = useState("Jakarta")
  const [country, setCountry] = useState("ID")
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimings | null>(null)
  const [loading, setLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null)
  const [timeUntilNext, setTimeUntilNext] = useState("")

  useEffect(() => {
    // Load saved location
    const savedCity = localStorage.getItem("prayerCity")
    const savedCountry = localStorage.getItem("prayerCountry")

    if (savedCity) setCity(savedCity)
    if (savedCountry) setCountry(savedCountry)

    fetchPrayerTimes()
  }, [])

  const fetchPrayerTimes = async () => {
    setLoading(true)
    try {
      const now = DateTime.now().setZone("Asia/Jakarta")
      const api = `https://api.aladhan.com/v1/timingsByCity/${now.toFormat("dd-MM-yyyy")}?city=${city}&country=${country}&method=20`

      const response = await fetch(api)
      const data = await response.json()

      if (data.code === 200 && data.data) {
        const timings = data.data.timings
        setPrayerTimes({
          Fajr: timings.Fajr.replace(" (WIB)", ""),
          Sunrise: timings.Sunrise.replace(" (WIB)", ""),
          Dhuhr: timings.Dhuhr.replace(" (WIB)", ""),
          Asr: timings.Asr.replace(" (WIB)", ""),
          Maghrib: timings.Maghrib.replace(" (WIB)", ""),
          Isha: timings.Isha.replace(" (WIB)", ""),
        })
      }
    } catch (error) {
      console.error("Error fetching prayer times:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (prayerTimes) {
        const now = DateTime.now().setZone("Asia/Jakarta")
        const currentTime = now.toFormat("HH:mm")

        const prayers = [
          { name: "Fajr", time: prayerTimes.Fajr },
          { name: "Sunrise", time: prayerTimes.Sunrise },
          { name: "Dhuhr", time: prayerTimes.Dhuhr },
          { name: "Asr", time: prayerTimes.Asr },
          { name: "Maghrib", time: prayerTimes.Maghrib },
          { name: "Isha", time: prayerTimes.Isha },
        ]

        // Find next prayer
        let next = prayers.find((prayer) => prayer.time > currentTime)
        if (!next) next = prayers[0] // If no next prayer today, show first prayer of next day

        setNextPrayer(next)

        // Calculate time until next prayer
        const nextTime = DateTime.fromFormat(next.time, "HH:mm")
        const diff = nextTime.diff(now, ["hours", "minutes", "seconds"]).toObject()

        setTimeUntilNext(
          `${Math.floor(diff.hours || 0)}h ${Math.floor(diff.minutes || 0)}m ${Math.floor(diff.seconds || 0)}s`,
        )
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [prayerTimes])

  const handleSaveLocation = () => {
    localStorage.setItem("prayerCity", city)
    localStorage.setItem("prayerCountry", country)
    setSettingsOpen(false)
    fetchPrayerTimes()
  }

  const getPrayerName = (key: string) => {
    switch (key) {
      case "Fajr":
        return "Subuh"
      case "Sunrise":
        return "Terbit"
      case "Dhuhr":
        return "Dzuhur"
      case "Asr":
        return "Ashar"
      case "Maghrib":
        return "Maghrib"
      case "Isha":
        return "Isya"
      default:
        return key
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mt-6"
    >
      <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Prayer Times
            </CardTitle>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Change Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Location Settings</DialogTitle>
                  <DialogDescription>Set your location to get accurate prayer times.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Jakarta"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country Code</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., ID"
                      maxLength={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveLocation}>Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Prayer times for your location</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : prayerTimes ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  {city}, {country}
                </span>
              </div>

              {nextPrayer && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium">Next Prayer</p>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">{getPrayerName(nextPrayer.name)}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">in</span>
                      <span className="text-lg font-medium text-primary">{timeUntilNext}</span>
                      <span className="text-sm text-muted-foreground">at {nextPrayer.time}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(prayerTimes).map(([key, time]) => (
                  <div
                    key={key}
                    className={cn(
                      "p-4 rounded-lg bg-card border",
                      nextPrayer?.name === key ? "border-primary bg-primary/5" : "border-muted",
                    )}
                  >
                    <p className="text-sm font-medium">{getPrayerName(key)}</p>
                    <p className="text-2xl font-bold mt-1">{time}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Unable to load prayer times</p>
              <Button variant="outline" size="sm" onClick={fetchPrayerTimes} className="mt-2">
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

