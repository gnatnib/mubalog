"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Gift, Star, Trophy, Book, Copy, Pause, Play, RefreshCw, Globe2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Confetti from "react-confetti"
import { useWindowSize } from "@/lib/hooks"
import CountUp from "@/components/count-up"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

type LoginStreak = {
  lastLogin: string
  currentStreak: number
  daysLoggedIn: string[]
  totalPoints: number
  lastVerses: string[] // Store recently shown verses to avoid repetition
}

type Verse = {
  number: number
  text: string
  translation: {
    en: string
    id: string
  }
  audio: string
  surah: {
    name: string
    englishName: string
    number: number
  }
}

const REWARDS = [
  { day: 1, reward: "5 Good Deed Points" },
  { day: 2, reward: "10 Good Deed Points" },
  { day: 3, reward: "15 Good Deed Points" },
  { day: 4, reward: "20 Good Deed Points" },
  { day: 5, reward: "25 Good Deed Points" },
  { day: 6, reward: "30 Good Deed Points" },
  { day: 7, reward: "50 Good Deed Points + Special Badge" },
]

export default function DailyQuranStreak() {
  const [loginStreak, setLoginStreak] = useState<LoginStreak>({
    lastLogin: "",
    currentStreak: 0,
    daysLoggedIn: [],
    totalPoints: 0,
    lastVerses: [],
  })
  const [showReward, setShowReward] = useState(false)
  const [todaysClaim, setTodaysClaim] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [rewardPoints, setRewardPoints] = useState(0)
  const { width, height } = useWindowSize()
  const { toast } = useToast()

  // Quran verse state
  const [verse, setVerse] = useState<Verse | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [language, setLanguage] = useState<"en" | "id">("en")
  const [audioError, setAudioError] = useState(false)
  const [verseRead, setVerseRead] = useState(false)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [hasListenedFully, setHasListenedFully] = useState(false)

  useEffect(() => {
    const storedStreak = localStorage.getItem("loginStreak")
    if (storedStreak) {
      const parsedStreak = JSON.parse(storedStreak) as LoginStreak
      setLoginStreak(parsedStreak)

      // Check if already claimed today
      const today = new Date().toISOString().split("T")[0]
      setTodaysClaim(parsedStreak.daysLoggedIn.includes(today))
    }

    getRandomVerse()
  }, [])

  useEffect(() => {
    if (audioRef) {
      const audio = audioRef

      const updateProgress = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setAudioProgress((audio.currentTime / audio.duration) * 100)
        }
      }

      const handleLoadedMetadata = () => {
        if (!isNaN(audio.duration)) {
          setAudioDuration(audio.duration)
          setAudioError(false)
        }
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setAudioProgress(0)
        audio.currentTime = 0
        setHasListenedFully(true)
      }

      const handleError = () => {
        setAudioError(true)
        setIsPlaying(false)
        toast({
          title: "Audio Error",
          description: "Failed to load audio. Please try another verse.",
          variant: "destructive",
        })
      }

      audio.addEventListener("timeupdate", updateProgress)
      audio.addEventListener("loadedmetadata", handleLoadedMetadata)
      audio.addEventListener("ended", handleEnded)
      audio.addEventListener("error", handleError)

      return () => {
        audio.removeEventListener("timeupdate", updateProgress)
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
        audio.removeEventListener("ended", handleEnded)
        audio.removeEventListener("error", handleError)
      }
    }
  }, [toast, audioRef])

  const getRandomVerse = async () => {
    setLoading(true)
    setAudioError(false)
    setVerseRead(false)
    setHasListenedFully(false)
    try {
      // Get a wider range of Surahs (1-30) and verses (1-10)
      let surahNumber, verseNumber
      let attempts = 0
      let verseKey

      // Try to find a verse that hasn't been shown recently
      do {
        surahNumber = Math.floor(Math.random() * 30) + 1
        verseNumber = Math.floor(Math.random() * 10) + 1
        verseKey = `${surahNumber}:${verseNumber}`
        attempts++
      } while (loginStreak.lastVerses.includes(verseKey) && attempts < 10 && loginStreak.lastVerses.length > 0)

      // Fetch Arabic and English translation
      const arabicResponse = await fetch(
        `https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/quran-uthmani`,
      )
      const englishResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/en.asad`)
      const indonesianResponse = await fetch(
        `https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/id.indonesian`,
      )
      const audioResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/ar.alafasy`)

      const arabicData = await arabicResponse.json()
      const englishData = await englishResponse.json()
      const indonesianData = await indonesianResponse.json()
      const audioData = await audioResponse.json()

      if (arabicData.code === 200) {
        setVerse({
          number: arabicData.data.numberInSurah,
          text: arabicData.data.text,
          translation: {
            en: englishData.data.text,
            id: indonesianData.data.text,
          },
          audio: audioData.data.audio,
          surah: {
            name: arabicData.data.surah.name,
            englishName: arabicData.data.surah.englishName,
            number: arabicData.data.surah.number,
          },
        })

        // Update the list of recently shown verses
        const newLastVerses = [...loginStreak.lastVerses]
        newLastVerses.push(verseKey)
        // Keep only the last 20 verses to avoid the list growing too large
        if (newLastVerses.length > 20) {
          newLastVerses.shift()
        }

        setLoginStreak((prev) => ({
          ...prev,
          lastVerses: newLastVerses,
        }))
      }
    } catch (error) {
      console.error("Error fetching verse:", error)
      toast({
        title: "Error",
        description: "Failed to fetch verse. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsPlaying(false)
      setAudioProgress(0)
      if (audioRef) {
        audioRef.currentTime = 0
      }
    }
  }

  const toggleAudio = async () => {
    if (audioRef) {
      try {
        if (isPlaying) {
          await audioRef.pause()
        } else {
          await audioRef.play()
        }
        setIsPlaying(!isPlaying)
      } catch (error) {
        console.error("Audio playback error:", error)
        setAudioError(true)
        toast({
          title: "Audio Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSliderChange = (value: number[]) => {
    if (audioRef && !isNaN(audioRef.duration)) {
      const newTime = (value[0] / 100) * audioRef.duration
      audioRef.currentTime = newTime
      setAudioProgress(value[0])

      // If audio was playing, continue playing after seeking
      if (isPlaying) {
        audioRef.play().catch((error) => {
          console.error("Error playing audio after seeking:", error)
          setAudioError(true)
        })
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const copyToClipboard = () => {
    if (!verse) return

    const textToCopy = `${verse.text}\n\n${verse.translation[language]}\n\nSurah ${verse.surah.englishName} (${verse.surah.number}:${verse.number})`

    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Verse has been copied to your clipboard",
      })
    })
  }

  const markAsRead = () => {
    if (!hasListenedFully) {
      toast({
        title: "Please listen to the verse first",
        description: "Listen to the complete verse before marking it as read",
        variant: "destructive",
      })
      return
    }
    setVerseRead(true)
    toast({
      title: "Verse marked as read",
      description: "You can now claim your daily reward",
    })
  }

  const handleDailyLogin = () => {
    if (!verseRead && !todaysClaim) {
      toast({
        title: "Please read the verse first",
        description: "Mark the verse as read before claiming your reward",
        variant: "destructive",
      })
      return
    }

    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

    const newStreak = { ...loginStreak }

    // If already claimed today, do nothing
    if (newStreak.daysLoggedIn.includes(today)) {
      return
    }

    // Check if logged in yesterday to continue streak
    if (newStreak.lastLogin === yesterday) {
      newStreak.currentStreak += 1
    } else if (newStreak.lastLogin !== today) {
      // Reset streak if missed a day, unless it's the first login
      newStreak.currentStreak = newStreak.lastLogin ? 1 : 1
    }

    // Calculate reward points
    const dayIndex = (newStreak.currentStreak - 1) % 7
    const pointsMatch = REWARDS[dayIndex].reward.match(/(\d+) Good Deed Points/)
    const points = pointsMatch ? Number.parseInt(pointsMatch[1]) : 0

    newStreak.totalPoints = (newStreak.totalPoints || 0) + points
    setRewardPoints(points)

    newStreak.lastLogin = today
    newStreak.daysLoggedIn = [...newStreak.daysLoggedIn, today]

    setLoginStreak(newStreak)
    localStorage.setItem("loginStreak", JSON.stringify(newStreak))
    setTodaysClaim(true)
    setShowReward(true)
    setShowConfetti(true)

    // Hide confetti after 5 seconds
    setTimeout(() => setShowConfetti(false), 5000)
  }

  const MotionStar = ({ delay = 0 }) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: [1.2,1] }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <Star className="w-3 h-3 fill-primary text-primary" />
    </motion.div>
  )

  useEffect(() => {
    if (verse) {
      setHasListenedFully(false)
      setVerseRead(false)
    }
  }, [verse])

  return (
    <>
      {showConfetti && width && height && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          colors={["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"]}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                Daily Quran Streak
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={language} onValueChange={(value: "en" | "id") => setLanguage(value)}>
                  <SelectTrigger className="w-[130px]">
                    <Globe2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="id">Indonesia</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={getRandomVerse} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            <CardDescription>Read a verse daily to maintain your streak and earn rewards</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Quran Verse Section */}
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ) : verse ? (
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="p-5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5"
                    >
                      <p className="text-2xl text-right font-arabic leading-relaxed">{verse.text}</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <p className="italic text-muted-foreground">{verse.translation[language]}</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
                          onClick={toggleAudio}
                          disabled={audioError}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </Button>
                        <div className="flex-1">
                          <Slider
                            value={[audioProgress]}
                            max={100}
                            step={0.1}
                            onValueChange={handleSliderChange}
                            className="cursor-pointer"
                            disabled={audioError}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-20 text-right">
                          {formatTime(audioDuration * (audioProgress / 100))}
                        </span>
                      </div>
                      <audio
                        ref={setAudioRef}
                        src={verse.audio}
                        preload="metadata"
                        onError={() => setAudioError(true)}
                      />
                      {!hasListenedFully && !verseRead && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Listen to the complete verse to mark it as read
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="flex items-center justify-between"
                    >
                      <p className="text-sm text-muted-foreground">
                        Surah {verse.surah.englishName} ({verse.surah.number}:{verse.number})
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard}>
                          <Copy className="w-3 h-3 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant={verseRead ? "outline" : "default"}
                          size="sm"
                          onClick={markAsRead}
                          disabled={verseRead || todaysClaim || !hasListenedFully}
                          className={cn(
                            verseRead
                              ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                              : "",
                            !hasListenedFully && !verseRead ? "opacity-50 cursor-not-allowed" : "",
                          )}
                        >
                          {verseRead ? (
                            <>
                              <Check className="w-3 h-3 mr-2" />
                              Read
                            </>
                          ) : hasListenedFully ? (
                            "Mark as Read"
                          ) : (
                            "Listen to Verse"
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-pulse">Loading verse...</div>
                  </div>
                )}
              </div>

              {/* Streak Section */}
              <div className="mt-6 border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Streak</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          <CountUp from={0} to={loginStreak.currentStreak} duration={1.5} />
                        </span>
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-sm font-medium text-muted-foreground">Total Points</div>
                    <div className="text-xl font-bold text-primary">
                      <CountUp from={0} to={loginStreak.totalPoints || 0} duration={2} separator="," />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-6">
                  {REWARDS.map((reward, index) => {
                    const isClaimed = loginStreak.currentStreak >= reward.day
                    const isToday = loginStreak.currentStreak + 1 === reward.day && !todaysClaim

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index, duration: 0.4 }}
                        className={cn(
                          "relative flex flex-col items-center justify-center p-2 border rounded-lg aspect-square",
                          isClaimed
                            ? "bg-primary/10 border-primary"
                            : isToday
                              ? "bg-primary/5 border-primary/50"
                              : "bg-muted/30 border-muted",
                        )}
                      >
                        <span className="text-xs font-bold">Day {reward.day}</span>
                        <Gift
                          className={cn("w-6 h-6 mt-1", isClaimed ? "text-primary" : "text-muted-foreground")}
                          fill={isClaimed ? "currentColor" : "none"}
                        />
                        {isClaimed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + 0.1 * index, duration: 0.3, type: "spring" }}
                            className="absolute top-0 right-0 w-4 h-4 translate-x-1 -translate-y-1 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Star className="w-3 h-3 text-primary-foreground" fill="currentColor" />
                          </motion.div>
                        )}
                        {isToday && (
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                              repeat: Number.POSITIVE_INFINITY,
                              duration: 2,
                              ease: "easeInOut",
                            }}
                            className="absolute inset-0 rounded-lg border-2 border-primary/50"
                          />
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={handleDailyLogin}
                    disabled={todaysClaim || (!verseRead && !todaysClaim)}
                    size="lg"
                    className={cn(
                      "relative overflow-hidden font-semibold text-base px-8 rounded-full",
                      !todaysClaim && verseRead && "animate-pulse",
                    )}
                  >
                    {todaysClaim ? "Claimed Today" : "Claim Daily Reward"}
                    {!todaysClaim && verseRead && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="absolute w-full h-full bg-white/20 animate-ping rounded-full"></span>
                      </span>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowReward(false)}
          >
            <motion.div
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.9 }}
              className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full border-2 border-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1.2,1] }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="w-24 h-24 mb-6 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <Gift className="w-12 h-12 text-primary" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-3xl font-bold mb-2"
                >
                  Daily Reward Claimed!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-muted-foreground mb-6"
                >
                  You've received your Day {loginStreak.currentStreak} reward:
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 rounded-xl w-full mb-8"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <MotionStar key={i} delay={0.8 + i * 0.1} />
                      ))}
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      <CountUp from={0} to={rewardPoints} duration={1} delay={0.8} className="text-3xl" /> Points
                    </p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <MotionStar key={i} delay={0.8 + i * 0.1} />
                      ))}
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                >
                  <Button onClick={() => setShowReward(false)} size="lg" className="rounded-full px-8 font-semibold">
                    Continue
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

