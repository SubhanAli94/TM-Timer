"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const Timer: React.FC = () => {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  const baseOpacity = 0.1
  const qualifiedOpacity = Math.max(baseOpacity, Math.min(1, (time - 180) / 60))
  const warningOpacity = Math.max(baseOpacity, Math.min(1, (time - 240) / 60))
  const dangerOpacity = Math.max(baseOpacity, Math.min(1, (time - 360) / 60))
  const showDisqualified = time >= 420

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const startTimer = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true)
      const id = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)
      setIntervalId(id)
    }
  }, [isRunning])

  const resetTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
    setIsRunning(false)
    setTime(0)
    setIntervalId(null)
  }, [intervalId])

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [intervalId])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="text-6xl font-mono font-bold">{formatTime(time)}</div>
          <div className="flex gap-4">
            <Button
              onClick={startTimer}
              disabled={isRunning}
              className="w-24"
              variant={isRunning ? "secondary" : "default"}
            >
              {isRunning ? "Running" : "Start"}
            </Button>
            <Button onClick={resetTimer} className="w-24" variant="outline">
              Reset
            </Button>
          </div>
          <div className="w-full flex gap-2">
            <div
              style={{ opacity: qualifiedOpacity }}
              className="flex-1 bg-green-500 text-white p-2 text-center transition-opacity duration-500"
            >
              3 Min - Qualified
            </div>
            <div
              style={{ opacity: warningOpacity }}
              className="flex-1 bg-yellow-400 text-black p-2 text-center transition-opacity duration-500"
            >
              2 Min
            </div>
            <div
              style={{ opacity: dangerOpacity }}
              className="flex-1 bg-red-500 text-white p-2 text-center transition-opacity duration-500"
            >
              1 Min
            </div>
          </div>
          {showDisqualified && (
            <div className="w-full bg-black text-white p-3 text-center text-lg font-bold animate-fade-in">
              Disqualified
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Timer

