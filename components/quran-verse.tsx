"use client"

import { useEffect, useState, useRef } from "react"
import { Book, Copy, Pause, Play, RefreshCw, Globe2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function QuranVerse() {
  const [verse, setVerse] = useState<Verse | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [language, setLanguage] = useState<"en" | "id">("en")
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    getRandomVerse()
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current

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
  }, [toast])

  const getRandomVerse = async () => {
    setLoading(true)
    setAudioError(false)
    try {
      const surahNumber = Math.floor(Math.random() * 10) + 1
      const verseNumber = Math.floor(Math.random() * 5) + 1

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
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
    }
  }

  const toggleAudio = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          await audioRef.current.pause()
        } else {
          await audioRef.current.play()
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
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      const newTime = (value[0] / 100) * audioRef.current.duration
      audioRef.current.currentTime = newTime
      setAudioProgress(value[0])

      // If audio was playing, continue playing after seeking
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5 text-primary" />
              Daily Quran Verse
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
          <CardDescription>Reflect on a new verse each day during Ramadan</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
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
                </div>
                <audio ref={audioRef} src={verse.audio} preload="metadata" onError={() => setAudioError(true)} />
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
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-3 h-3 mr-2" />
                  Copy
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <div className="animate-pulse">Loading verse...</div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

