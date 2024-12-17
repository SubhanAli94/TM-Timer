"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

const Timer: React.FC = () => {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  // Configuration states
  const [totalTime, setTotalTime] = useState<number>(600) // 10 minutes default (5+3+2)
  const [greenTime, setGreenTime] = useState<number>(300) // 5 minutes default
  const [yellowTime, setYellowTime] = useState<number>(180) // 3 minutes default
  const [redTime, setRedTime] = useState<number>(120) // 2 minutes default

  // Add state for validation errors
  const [errors, setErrors] = useState<string[]>([])

  const baseOpacity = 0.1
  const qualifiedOpacity = Math.max(baseOpacity, Math.min(1, (time - greenTime) / 60))
  const warningOpacity = Math.max(baseOpacity, Math.min(1, (time - yellowTime) / 60))
  const dangerOpacity = Math.max(baseOpacity, Math.min(1, (time - redTime) / 60))
  const showDisqualified = time >= totalTime

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

  const handleConfigSave = (e: React.FormEvent) => {
    e.preventDefault()
    // Dialog will close automatically due to DialogClose wrapper
  }

  // Validation function
  const validateTimes = (green: number, yellow: number, red: number, total: number) => {
    const newErrors: string[] = []
    const sum = Math.floor(green / 60) + Math.floor(yellow / 60) + Math.floor(red / 60)
    const totalMinutes = Math.floor(total / 60)

    if (sum > totalMinutes) {
      newErrors.push(`Total of all times (${sum} min) cannot exceed total speech time (${totalMinutes} min)`)
    }
    setErrors(newErrors)
    return newErrors.length === 0
  }

  return (
    <div className="relative">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="absolute -top-2 -left-2 z-10"
          >
            ⚙️
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Timer Configuration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfigSave} className="w-full space-y-4">
            {errors.length > 0 && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm">{error}</p>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm">Total Speech Time (minutes)</label>
                <input
                  type="number"
                  value={Math.floor(totalTime / 60)}
                  onChange={(e) => {
                    const newTotal = Number(e.target.value) * 60
                    setTotalTime(newTotal)
                    validateTimes(greenTime, yellowTime, redTime, newTotal)
                  }}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm">Green Time (minutes)</label>
                <input
                  type="number"
                  value={Math.floor(greenTime / 60)}
                  onChange={(e) => {
                    const newTime = Number(e.target.value) * 60
                    setGreenTime(newTime)
                    validateTimes(newTime, yellowTime, redTime, totalTime)
                  }}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm">Yellow Time (minutes)</label>
                <input
                  type="number"
                  value={Math.floor(yellowTime / 60)}
                  onChange={(e) => {
                    const newTime = Number(e.target.value) * 60
                    setYellowTime(newTime)
                    validateTimes(greenTime, newTime, redTime, totalTime)
                  }}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm">Red Time (minutes)</label>
                <input
                  type="number"
                  value={Math.floor(redTime / 60)}
                  onChange={(e) => {
                    const newTime = Number(e.target.value) * 60
                    setRedTime(newTime)
                    validateTimes(greenTime, yellowTime, newTime, totalTime)
                  }}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
            </div>
            <DialogClose asChild>
              <Button
                type="submit"
                className="w-full"
                disabled={errors.length > 0}
              >
                Save Configuration
              </Button>
            </DialogClose>
          </form>
        </DialogContent>
      </Dialog>

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
                {Math.floor(greenTime / 60)} Min
              </div>
              <div
                style={{ opacity: warningOpacity }}
                className="flex-1 bg-yellow-400 text-black p-2 text-center transition-opacity duration-500"
              >
                {Math.floor((yellowTime) / 60)} Min
              </div>
              <div
                style={{ opacity: dangerOpacity }}
                className="flex-1 bg-red-500 text-white p-2 text-center transition-opacity duration-500"
              >
                {Math.floor((redTime) / 60)} Min
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
    </div>
  )
}

export default Timer

