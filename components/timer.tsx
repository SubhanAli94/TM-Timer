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

interface TimerProps {
  qualifiedTime?: number;
  warningTime?: number;
  dangerTime?: number;
  totalTime?: number;
}

const Timer: React.FC<TimerProps> = ({
  qualifiedTime: defaultQualifiedTime = 180,
  warningTime: defaultWarningTime = 240,
  dangerTime: defaultDangerTime = 360,
  totalTime: defaultTotalTime = 480 // 8 minutes default
}) => {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  const [qualifiedTime, setQualifiedTime] = useState<number | null>(defaultQualifiedTime)
  const [warningTime, setWarningTime] = useState<number | null>(defaultWarningTime)
  const [dangerTime, setDangerTime] = useState<number | null>(defaultDangerTime)
  const [totalTime, setTotalTime] = useState<number>(defaultTotalTime)
  const [errors, setErrors] = useState<string[]>([])

  const baseOpacity = 0.1
  const qualifiedOpacity = Math.max(baseOpacity, Math.min(1, (time - qualifiedTime) / 60))
  const warningOpacity = Math.max(baseOpacity, Math.min(1, (time - warningTime) / 60))
  const dangerOpacity = Math.max(baseOpacity, Math.min(1, (time - dangerTime) / 60))
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

  // Helper to get numeric value or 0 if null
  const getTimeValue = (time: number | null): number => time ?? 0

  // Get current sum for display - Fixed to handle empty values correctly
  const getCurrentSum = () => {
    const greenTime = qualifiedTime === null ? 0 : Math.floor(qualifiedTime / 60)
    const yellowTime = warningTime === null ? 0 : Math.floor(warningTime / 60)
    const redTime = dangerTime === null ? 0 : Math.floor(dangerTime / 60)
    return greenTime + yellowTime + redTime
  }

  // Validation function - Simplified to just check total sum
  const validateTimes = (
    qualified: number | null,
    warning: number | null,
    danger: number | null,
    total: number
  ) => {
    const currentSum = getCurrentSum()
    const totalMinutes = Math.floor(total / 60)

    // Only show error if at least one field has a value and sum doesn't match
    if ((qualified !== null || warning !== null || danger !== null) &&
      currentSum !== totalMinutes) {
      setErrors([`Total time must equal ${totalMinutes} minutes`])
      return false
    }

    // Clear errors if sum matches or all fields are empty
    setErrors([])
    return true
  }

  // Reset time values when total time changes
  const handleTotalTimeChange = (newTotal: number) => {
    setTotalTime(newTotal)
    setQualifiedTime(null)
    setWarningTime(null)
    setDangerTime(null)
    setErrors([]) // Clear any existing errors
  }

  // Only show warning if at least one field has a value and sum doesn't match
  const shouldShowSumWarning = () => {
    const hasAnyValue = qualifiedTime !== null || warningTime !== null || dangerTime !== null
    return hasAnyValue && getCurrentSum() !== Math.floor(totalTime / 60)
  }

  // Handle input changes
  const handleInputChange = (
    value: string,
    setter: (value: number | null) => void,
    currentValues: {
      qualified: number | null,
      warning: number | null,
      danger: number | null
    }
  ) => {
    const newValue = value === '' ? null : Number(value) * 60
    setter(newValue)
    validateTimes(
      currentValues.qualified,
      currentValues.warning,
      currentValues.danger,
      totalTime
    )
  }

  // Add handleTimeUpdate function
  const handleTimeUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate one last time before closing
    const isValid = validateTimes(qualifiedTime, warningTime, dangerTime, totalTime)
    if (!isValid) {
      e.stopPropagation() // Prevent dialog from closing if validation fails
    }
  }

  return (
    <div className="relative">
      <Dialog className="invisible">
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="absolute -top-2 -right-2 z-10 invisible"
          >
            ⚙️
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Timer Configuration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTimeUpdate} className="w-full space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm">Total Speech Time (minutes)</label>
                <input
                  type="number"
                  value={Math.floor(totalTime / 60)}
                  onChange={(e) => {
                    const newTime = Number(e.target.value) * 60
                    handleTotalTimeChange(newTime)
                  }}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>

              <div className="col-span-2 text-sm text-center">
                Current sum: {getCurrentSum()} minutes
                {shouldShowSumWarning() && (
                  <span className="text-red-500 ml-2">
                    (Must equal {Math.floor(totalTime / 60)} minutes)
                  </span>
                )}
              </div>

              <div>
                <label className="text-sm">Green Time (minutes)</label>
                <input
                  type="number"
                  value={qualifiedTime === null ? '' : Math.floor(qualifiedTime / 60)}
                  onChange={(e) => handleInputChange(
                    e.target.value,
                    setQualifiedTime,
                    {
                      qualified: qualifiedTime,
                      warning: warningTime,
                      danger: dangerTime
                    }
                  )}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm">Yellow Time (minutes)</label>
                <input
                  type="number"
                  value={warningTime === null ? '' : Math.floor(warningTime / 60)}
                  onChange={(e) => handleInputChange(
                    e.target.value,
                    setWarningTime,
                    {
                      qualified: qualifiedTime,
                      warning: warningTime,
                      danger: dangerTime
                    }
                  )}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm">Red Time (minutes)</label>
                <input
                  type="number"
                  value={dangerTime === null ? '' : Math.floor(dangerTime / 60)}
                  onChange={(e) => handleInputChange(
                    e.target.value,
                    setDangerTime,
                    {
                      qualified: qualifiedTime,
                      warning: warningTime,
                      danger: dangerTime
                    }
                  )}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm">{error}</p>
                ))}
              </div>
            )}

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
                {Math.floor(qualifiedTime / 60)} Min
              </div>
              <div
                style={{ opacity: warningOpacity }}
                className="flex-1 bg-yellow-400 text-black p-2 text-center transition-opacity duration-500"
              >
                {Math.floor((warningTime - qualifiedTime) / 60)} Min
              </div>
              <div
                style={{ opacity: dangerOpacity }}
                className="flex-1 bg-red-500 text-white p-2 text-center transition-opacity duration-500"
              >
                {Math.floor((dangerTime - warningTime) / 60)} Min
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

