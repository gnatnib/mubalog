"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Gift, Star, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Confetti from "react-confetti"
import { useWindowSize } from "@/lib/hooks"
import CountUp from "@/components/count-up"

type LoginStreak = {
  lastLogin: string
  currentStreak: number
  daysLoggedIn: string[]
  totalPoints: number
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

export default function DailyLogin() {
  const [loginStreak, setLoginStreak] = useState<LoginStreak>({
    lastLogin: "",
    currentStreak: 0,
    daysLoggedIn: [],
    totalPoints: 0,
  })
  const [showReward, setShowReward] = useState(false)
  const [todaysClaim, setTodaysClaim] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [rewardPoints, setRewardPoints] = useState(0)
  const { width, height } = useWindowSize()

  useEffect(() => {
    const storedStreak = localStorage.getItem("loginStreak")
    if (storedStreak) {
      const parsedStreak = JSON.parse(storedStreak) as LoginStreak
      setLoginStreak(parsedStreak)

      // Check if already claimed today
      const today = new Date().toISOString().split("T")[0]
      setTodaysClaim(parsedStreak.daysLoggedIn.includes(today))
    }
  }, [])

  const handleDailyLogin = () => {
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
      animate={{ scale: [0, 1.2, 1] }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <Star className="w-3 h-3 fill-primary text-primary" />
    </motion.div>
  )

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
                <Calendar className="w-5 h-5 text-primary" />
                Daily Login
              </CardTitle>
              <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span className="flex items-baseline gap-1">
                  Day <CountUp from={0} to={loginStreak.currentStreak} duration={1} className="font-bold" />
                </span>
              </div>
            </div>
            <CardDescription>Log in daily during Ramadan to earn rewards and maintain your streak</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex items-center justify-between mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-6 flex justify-center"
            >
              <Button
                onClick={handleDailyLogin}
                disabled={todaysClaim}
                size="lg"
                className={cn(
                  "relative overflow-hidden font-semibold text-base px-8 rounded-full",
                  !todaysClaim && "animate-pulse",
                )}
              >
                {todaysClaim ? "Claimed Today" : "Claim Daily Reward"}
                {!todaysClaim && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="absolute w-full h-full bg-white/20 animate-ping rounded-full"></span>
                  </span>
                )}
              </Button>
            </motion.div>
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
                  animate={{ scale: [1.2, 1] }}
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

