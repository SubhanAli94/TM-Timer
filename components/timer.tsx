"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { MdSettings } from 'react-icons/md'; // Import the settings icon from Material Icons
// Add interface for speech result
interface SpeechResult {
  name: string;
  time: number;
  status: 'Qualified' | 'Disqualified';
  timestamp: string;
}

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

  // Add name state
  const [speakerName, setSpeakerName] = useState<string>("")

  // Add state for speech results
  const [speechResults, setSpeechResults] = useState<SpeechResult[]>([])

  // Add state for confirmation dialog
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);

  const baseOpacity = 0.1

  // Green zone opacity: increases from 0-5 minutes
  const qualifiedOpacity = Math.max(baseOpacity, Math.min(1, time / greenTime))

  // Yellow zone opacity: increases from 5-8 minutes (after green time)
  const warningOpacity = Math.max(
    baseOpacity,
    Math.min(1, time > greenTime ? (time - greenTime) / yellowTime : 0)
  )

  // Red zone opacity: increases from 8-10 minutes (after yellow time)
  const dangerOpacity = Math.max(
    baseOpacity,
    Math.min(1, time > (greenTime + yellowTime) ? (time - greenTime - yellowTime) / redTime : 0)
  )

  const gracePeriod = 30; // 30 seconds grace period

  // Show disqualified when total time is exceeded
  const showDisqualified = time >= (greenTime + yellowTime + redTime + gracePeriod);

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

    // Reset participant name and form data to defaults
    setSpeakerName("") // Clear the participant name
    setTotalTime(600) // Reset to default total time (10 minutes)
    setGreenTime(300) // Reset to default green time (5 minutes)
    setYellowTime(180) // Reset to default yellow time (3 minutes)
    setRedTime(120) // Reset to default red time (2 minutes)
    setErrors([]) // Clear any validation errors

  }, [intervalId])

  const stopTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId)
      setIsRunning(false)
      setIntervalId(null)

      // Add result when stopping
      const totalTimeLapsed = time + (showDisqualified ? gracePeriod : 0); // Include grace period if disqualified
      const result: SpeechResult = {
        name: speakerName || 'Anonymous Speaker',
        time: totalTimeLapsed,
        status: time < greenTime || time >= (greenTime + yellowTime + redTime + gracePeriod) ? 'Disqualified' : 'Qualified',
        timestamp: new Date().toLocaleTimeString()
      }
      setSpeechResults(prev => [...prev, result])
    }
  }, [intervalId, speakerName, time, greenTime, yellowTime, redTime, gracePeriod])

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

  // Calculate the elapsed time after red time
  const elapsedGracePeriod = time > (greenTime + yellowTime + redTime) ? Math.min(time - (greenTime + yellowTime + redTime), gracePeriod) : 0;

  // Update the opacity for the grace period box
  const graceOpacity = time > (greenTime + yellowTime + redTime) ? elapsedGracePeriod / gracePeriod : 0.2; // Faded when not in grace period

  // Function to handle stopping the timer
  const handleStopTimer = () => {
    if (isRunning) { // Check if the timer is running
      setIsConfirmingStop(true); // Show confirmation dialog
    }
  };

  // Function to confirm stopping the timer
  const confirmStopTimer = () => {
    stopTimer(); // Call the existing stopTimer function
    setIsConfirmingStop(false); // Close the dialog
  };

  // Function to dismiss the confirmation dialog
  const dismissStopTimer = () => {
    setIsConfirmingStop(false); // Close the dialog
  };

  return (
    <div className="flex flex-col gap-8 mt-10" >
      <div className="relative">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="justify-center border-black text-black fixed top-0 right-0 m-8 shadow-none">
              <MdSettings className="mr-1 text-black" />Settings
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
                  <label className="text-sm">Speaker&apos;s Name</label>
                  <input
                    type="text"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter speaker&apos;s name"
                  />
                </div>
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
                    placeholder="Total Speech Time (minutes)"
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

        <div className="w-full max-w-md mx-auto justify-center">
          <div className="p-6">
            <div className="flex flex-col items-center gap-6">
              {speakerName && (
                <div className="text-lg font-semibold text-black">
                  {speakerName}
                </div>
              )}
              <div className="text-6xl font-mono font-bold">{formatTime(time)}</div>
              <div className="flex gap-4">
                <Button
                  onClick={startTimer}
                  disabled={isRunning}
                  className="w-24 bg-green-500"
                  variant={isRunning ? "secondary" : "default"}>
                  {isRunning ? "Running" : "Start"}
                </Button>
                <Button onClick={handleStopTimer} className="w-24 bg-red-500 text-white" variant="secondary">
                  Stop
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
                <div
                  style={{ opacity: graceOpacity }}
                  className="flex-1 bg-gray-500 text-white p-2 text-center transition-opacity duration-500"
                >
                  {Math.floor(gracePeriod)} Sec
                </div>
              </div>
              {showDisqualified && (
                <div className="w-full bg-black text-white p-3 text-center text-lg font-bold animate-fade-in">
                  Disqualified
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {
        speechResults.length === 0 && (
          <div className="w-full text-center text-gray-600 italic">
            No time entries logged yet.
          </div>
        )
      }

      {
        speechResults.length > 0 && (
          <div className="w-full">
            <div className="p-6">
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-black text-white">
                    <tr className="border-b border-gray-400">
                      <th className="text-left py-2 px-4 border-b border-gray-400">Speaker</th>
                      <th className="text-left py-2 px-4 border-b border-gray-400">Time</th>
                      <th className="text-left py-2 px-4 border-b border-gray-400">Status</th>
                      <th className="text-left py-2 px-4 border-b border-gray-400">Time Stopped</th>
                    </tr>
                  </thead>
                  <tbody>
                    {speechResults.map((result, index) => (
                      <tr key={index} className={`border-b border-gray-200 hover:bg-gray-100 transition-colors duration-200`}>
                        <td className="py-2 px-4 bg-white text-black border-b border-gray-200 opacity-200">{result.name}</td>
                        <td className="py-2 px-4 bg-white text-black border-b border-gray-200 opacity-200">{formatTime(result.time)}</td>
                        <td className={`py-2 px-4 bg-white ${result.status === 'Qualified' ? 'text-green-600' : 'text-red-600'} border-b border-gray-200 opacity-200`}>
                          {result.status}
                        </td>
                        <td className="py-2 px-4 bg-white text-black border-b border-gray-200 opacity-200">{result.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }

      {/* Confirmation Dialog */}
      {isConfirmingStop && (
        <Dialog open={isConfirmingStop} onOpenChange={dismissStopTimer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Stop</DialogTitle>
            </DialogHeader>
            <p>Are you sure to stop the timer?</p>
            <div className="flex justify-end space-x-2">
              <Button onClick={confirmStopTimer} variant="outline">Yes</Button>
              <Button onClick={dismissStopTimer} variant="outline">No</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div >
  )
}

export default Timer

