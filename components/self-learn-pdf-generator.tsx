"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Coffee,
  RotateCcw,
  Code,
  Plus,
  X,
} from "lucide-react"

interface SelfLearnRequest {
  title: string
  level: string
}

interface PdfGenerationState {
  status: "idle" | "generating" | "completed" | "error"
  requests: {
    [key: string]: {
      status: "pending" | "generating" | "completed" | "error" | "retrying"
      progress: number
      error?: string
      retryCount?: number
      title: string
      level: string
    }
  }
  timeElapsed: number
  completedCount: number
  totalCount: number
}

const GLOBISH_LEVELS = [
  { code: "G1", name: "Beginner", description: "Basic phrases and simple interactions" },
  { code: "G2", name: "Elementary", description: "Simple conversations and routine tasks" },
  { code: "G3", name: "Intermediate", description: "Clear communication on familiar topics" },
  { code: "G4", name: "Upper Intermediate", description: "Complex topics and professional discussions" },
  { code: "G5", name: "Advanced", description: "Fluent and sophisticated language use" },
  { code: "G6", name: "Proficient", description: "Near-native level mastery" },
]

const motivationalTips = [
  "💡 Tip: Self-learning courses are designed to help learners study independently at their own pace!",
  "📚 Did you know? Personalized learning materials can improve retention by up to 60%.",
  "⏰ While you wait: Consider how you'll organize your self-study schedule with the generated content.",
  "🎯 Fun fact: Self-paced learning allows for better comprehension and skill mastery.",
  "✨ Almost there! The AI is creating interactive exercises and self-assessment tools.",
  "🚀 Your comprehensive self-learning PDF will include practice activities and progress tracking.",
  "📖 The generated content will be structured for effective independent study.",
  "💼 Level-specific content ensures appropriate challenge and progression.",
  "🔄 Our system automatically retries failed requests to ensure reliable delivery.",
  "⚡ Multiple retry attempts with smart delays help overcome temporary network issues.",
  "🌐 Direct API connection ensures faster response times and better reliability.",
]

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryApiCall<T>(apiCall: () => Promise<T>, maxRetries = 3, baseDelay = 2000): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error as Error

      // Don't retry on authentication errors (401) or bad request errors (400)
      if (error instanceof Error && error.message.includes("Authentication failed")) {
        throw error
      }
      if (error instanceof Error && error.message.includes("Invalid request")) {
        throw error
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries + 1} attempts. Last error: ${lastError.message}`)
      }

      // Calculate exponential backoff delay: baseDelay * 2^attempt + random jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt)
      const jitter = Math.random() * 2000 // Add up to 2 seconds of random jitter
      const totalDelay = exponentialDelay + jitter

      console.log(
        `Self-learning PDF API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(totalDelay)}ms...`,
      )
      await delay(totalDelay)
    }
  }

  throw lastError!
}

async function generateSelfLearnPdfClient(data: SelfLearnRequest): Promise<Blob> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPLEARN_API_KEY

  if (!apiKey) {
    throw new Error("API key not configured. Please contact support.")
  }

  const baseUrl = "http://localhost:8787"
  const endpoint = "/agents/self-learn-pdf-generator"

  const makeApiCall = async (): Promise<Blob> => {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        title: data.title,
        level: data.level,
      }),
    })

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Invalid request. Please check your input and try again.")
      } else if (response.status === 401) {
        throw new Error("Authentication failed. Please contact support.")
      } else if (response.status === 500) {
        throw new Error("Server error. Please try again later.")
      } else {
        throw new Error(`Request failed with status ${response.status}`)
      }
    }

    // Check if response is actually a PDF
    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/pdf")) {
      throw new Error("Invalid response format. Expected PDF file.")
    }

    const pdfBlob = await response.blob()

    // Validate that we received a valid PDF blob
    if (pdfBlob.size === 0) {
      throw new Error("Received empty PDF file")
    }

    return pdfBlob
  }

  try {
    return await retryApiCall(makeApiCall, 3, 2000)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to generate self-learning PDF after multiple attempts. Please try again.")
  }
}

export function SelfLearnPdfGenerator() {
  const [activeTab, setActiveTab] = useState<"form" | "json">("form")
  
  // Form input state
  const [formData, setFormData] = useState({
    title: "",
    level: "G1",
  })

  // JSON input state
  const [jsonInput, setJsonInput] = useState("")
  const [parsedRequests, setParsedRequests] = useState<SelfLearnRequest[]>([])

  const [generationState, setGenerationState] = useState<PdfGenerationState>({
    status: "idle",
    requests: {},
    timeElapsed: 0,
    completedCount: 0,
    totalCount: 0,
  })

  const [currentTip, setCurrentTip] = useState(0)

  // Timer for progress simulation and tips rotation
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (generationState.status === "generating") {
      interval = setInterval(() => {
        setGenerationState((prev) => {
          const newTimeElapsed = prev.timeElapsed + 1

          // Simulate progress for generating requests
          const updatedRequests = { ...prev.requests }
          Object.keys(updatedRequests).forEach((requestId) => {
            if (updatedRequests[requestId].status === "generating") {
              // Simulate progress up to 90%, then wait for actual completion
              const currentProgress = updatedRequests[requestId].progress
              if (currentProgress < 90) {
                updatedRequests[requestId] = {
                  ...updatedRequests[requestId],
                  progress: Math.min(currentProgress + Math.random() * 3, 90),
                }
              }
            }
          })

          return {
            ...prev,
            timeElapsed: newTimeElapsed,
            requests: updatedRequests,
          }
        })

        // Rotate tips every 15 seconds
        if (generationState.timeElapsed % 15 === 0) {
          setCurrentTip((prev) => (prev + 1) % motivationalTips.length)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [generationState.status, generationState.timeElapsed])

  // Prevent accidental page closure during generation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (generationState.status === "generating") {
        e.preventDefault()
        e.returnValue = "PDF generation is in progress. Are you sure you want to leave?"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [generationState.status])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const validateJsonInput = (json: string): SelfLearnRequest[] => {
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of request objects")
      }

      const requests: SelfLearnRequest[] = []
      parsed.forEach((item, index) => {
        if (!item || typeof item !== "object") {
          throw new Error(`Item at index ${index} must be an object`)
        }
        if (!item.title || typeof item.title !== "string" || !item.title.trim()) {
          throw new Error(`Item at index ${index} must have a valid title`)
        }
        if (!item.level || !GLOBISH_LEVELS.find(l => l.code === item.level)) {
          throw new Error(`Item at index ${index} must have a valid level (G1-G6)`)
        }
        requests.push({
          title: item.title.trim(),
          level: item.level,
        })
      })

      return requests
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Invalid JSON format")
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      return
    }

    const requests = [{ title: formData.title.trim(), level: formData.level }]
    await generatePdfs(requests)
  }

  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const requests = validateJsonInput(jsonInput)
      setParsedRequests(requests)
      await generatePdfs(requests)
    } catch (error) {
      setGenerationState((prev) => ({
        ...prev,
        status: "error",
      }))
      alert(error instanceof Error ? error.message : "Failed to parse JSON input")
    }
  }

  const generatePdfs = async (requests: SelfLearnRequest[]) => {
    // Initialize generation state
    const requestsState = requests.reduce((acc, request, index) => {
      const requestId = `${request.title}-${request.level}-${index}`
      return {
        ...acc,
        [requestId]: { 
          status: "generating" as const, 
          progress: 0, 
          retryCount: 0,
          title: request.title,
          level: request.level,
        },
      }
    }, {})

    setGenerationState({
      status: "generating",
      requests: requestsState,
      timeElapsed: 0,
      completedCount: 0,
      totalCount: requests.length,
    })

    // Start all PDF generations in parallel
    requests.forEach(async (request, index) => {
      const requestId = `${request.title}-${request.level}-${index}`
      let retryCount = 0

      const retryApiCallWithTracking = async <T,>(
        apiCall: () => Promise<T>,
        maxRetries = 3,
        baseDelay = 2000,
      ): Promise<T> => {
        let lastError: Error

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 0) {
              retryCount = attempt
              // Update state to show retry attempt
              setGenerationState((prev) => ({
                ...prev,
                requests: {
                  ...prev.requests,
                  [requestId]: {
                    ...prev.requests[requestId],
                    status: "retrying",
                    retryCount: attempt,
                  },
                },
              }))
            }

            return await apiCall()
          } catch (error) {
            lastError = error as Error

            // Don't retry on authentication errors (401) or bad request errors (400)
            if (error instanceof Error && error.message.includes("Authentication failed")) {
              throw error
            }
            if (error instanceof Error && error.message.includes("Invalid request")) {
              throw error
            }

            // If this was the last attempt, throw the error
            if (attempt === maxRetries) {
              throw new Error(`Failed after ${maxRetries + 1} attempts. Last error: ${lastError.message}`)
            }

            // Calculate exponential backoff delay
            const exponentialDelay = baseDelay * Math.pow(2, attempt)
            const jitter = Math.random() * 2000
            const totalDelay = exponentialDelay + jitter

            console.log(
              `Self-learning PDF API call failed for ${request.title} (${request.level}) (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(totalDelay)}ms...`,
            )
            await delay(totalDelay)
          }
        }

        throw lastError!
      }

      try {
        const pdfBlob = await retryApiCallWithTracking(
          async () => {
            return await generateSelfLearnPdfClient(request)
          },
          3,
          2000,
        )

        // Create and trigger download immediately when this PDF is ready
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${request.title.replace(/[^a-z0-9]/gi, '_')}-${request.level}-SelfLearning.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        // Update state for this specific request completion
        setGenerationState((prev) => {
          const newCompletedCount = prev.completedCount + 1
          return {
            ...prev,
            requests: {
              ...prev.requests,
              [requestId]: { 
                ...prev.requests[requestId], 
                status: "completed", 
                progress: 100, 
                retryCount: retryCount 
              },
            },
            completedCount: newCompletedCount,
            status: newCompletedCount === prev.totalCount ? "completed" : prev.status,
          }
        })
      } catch (err) {
        // Update state for this request with error
        setGenerationState((prev) => ({
          ...prev,
          requests: {
            ...prev.requests,
            [requestId]: {
              ...prev.requests[requestId],
              status: "error",
              progress: 0,
              error: err instanceof Error ? err.message : "Generation failed",
              retryCount: retryCount,
            },
          },
        }))
      }
    })
  }

  const handleReset = () => {
    setGenerationState({
      status: "idle",
      requests: {},
      timeElapsed: 0,
      completedCount: 0,
      totalCount: 0,
    })
    setFormData({
      title: "",
      level: "G1",
    })
    setJsonInput("")
    setParsedRequests([])
    setCurrentTip(0)
  }

  return (
    <div className="space-y-8">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Self-Learning Course PDF Generator
          </CardTitle>
          <CardDescription>
            Generate personalized self-learning course PDFs. Choose between single course form input or bulk JSON array input for multiple courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "form" | "json")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Single Course Form
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Bulk JSON Input
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="space-y-6">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Course Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., English for Software Engineers"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      disabled={generationState.status === "generating"}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">
                      Globish Level <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="level"
                      value={formData.level}
                      onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                      disabled={generationState.status === "generating"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {GLOBISH_LEVELS.map((level) => (
                        <option key={level.code} value={level.code}>
                          {level.code} - {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Show level description */}
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <p className="text-sm text-purple-700">
                    <strong>{GLOBISH_LEVELS.find(l => l.code === formData.level)?.name}:</strong>{' '}
                    {GLOBISH_LEVELS.find(l => l.code === formData.level)?.description}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={generationState.status === "generating"} className="flex-1">
                    {generationState.status === "generating" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Self-Learning PDF
                      </>
                    )}
                  </Button>
                  {(generationState.status === "completed" || generationState.status === "error") && (
                    <Button type="button" variant="outline" onClick={handleReset}>
                      Generate New PDFs
                    </Button>
                  )}
                </div>
              </form>
            </TabsContent>

            <TabsContent value="json" className="space-y-6">
              <form onSubmit={handleJsonSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="jsonInput">
                    JSON Array Input <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="jsonInput"
                    placeholder={`[
  {
    "title": "English for Software Engineers",
    "level": "G3"
  },
  {
    "title": "Business Communication Skills",
    "level": "G4"
  },
  {
    "title": "Academic Writing Fundamentals",
    "level": "G2"
  }
]`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    disabled={generationState.status === "generating"}
                    rows={12}
                    className="resize-none font-mono text-sm"
                    required
                  />
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Format:</strong> Array of objects with "title" and "level" fields</p>
                    <p><strong>Levels:</strong> G1 (Beginner) through G6 (Proficient)</p>
                    <p><strong>Note:</strong> All courses will be generated in parallel and downloaded automatically</p>
                  </div>
                </div>

                {/* Show parsed count */}
                {jsonInput && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      {(() => {
                        try {
                          const parsed = JSON.parse(jsonInput)
                          return Array.isArray(parsed) ? `${parsed.length} courses found in JSON` : "Invalid: Must be an array"
                        } catch {
                          return "Invalid JSON format"
                        }
                      })()}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={generationState.status === "generating"} className="flex-1">
                    {generationState.status === "generating" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDFs...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate All PDFs from JSON
                      </>
                    )}
                  </Button>
                  {(generationState.status === "completed" || generationState.status === "error") && (
                    <Button type="button" variant="outline" onClick={handleReset}>
                      Generate New PDFs
                    </Button>
                  )}
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {/* Direct API Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
            <RotateCcw className="h-4 w-4" />
            <span>Direct API connection • Auto-retry enabled (up to 3 attempts) • Parallel processing</span>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {generationState.status === "generating" && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Clock className="h-5 w-5" />
              Generating Self-Learning PDFs ({generationState.completedCount}/{generationState.totalCount} completed)
            </CardTitle>
            <CardDescription className="text-purple-700">
              Creating personalized self-learning course materials via direct API connection. Each PDF will download automatically when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">Overall Progress</span>
                <span className="text-purple-700">
                  {Math.round((generationState.completedCount / generationState.totalCount) * 100)}%
                </span>
              </div>
              <Progress value={(generationState.completedCount / generationState.totalCount) * 100} className="h-2" />
            </div>

            {/* Individual Request Progress */}
            <div className="space-y-3">
              <h4 className="font-medium text-purple-900 text-sm">Individual Course Progress</h4>
              <div className="grid gap-3">
                {Object.entries(generationState.requests).map(([requestId, requestState]) => (
                  <div key={requestId} className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {requestState.title} ({requestState.level})
                        </span>
                        {requestState.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {requestState.status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                        {requestState.status === "generating" && (
                          <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                        )}
                        {requestState.status === "retrying" && (
                          <RotateCcw className="h-4 w-4 text-orange-600 animate-spin" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {requestState.retryCount && requestState.retryCount > 0 && (
                          <span className="text-xs text-orange-600">Retry {requestState.retryCount}/3</span>
                        )}
                        <span className="text-xs text-gray-600 capitalize">
                          {requestState.status === "retrying" ? "retrying" : requestState.status}
                        </span>
                      </div>
                    </div>
                    {requestState.status === "error" && requestState.error && (
                      <p className="text-xs text-red-600 mb-2">{requestState.error}</p>
                    )}
                    <Progress value={requestState.status === "completed" ? 100 : requestState.progress} className="h-1" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700">Time elapsed: {formatTime(generationState.timeElapsed)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700">Downloads: {generationState.completedCount}/{generationState.totalCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-orange-600" />
                <span className="text-purple-700">Direct API</span>
              </div>
            </div>

            {/* Motivational Tips */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <Coffee className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-purple-900 mb-1">While You Wait...</h4>
                  <p className="text-purple-700 text-sm">{motivationalTips[currentTip]}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Section */}
      {generationState.status === "completed" && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              Self-Learning PDFs Generated Successfully!
            </CardTitle>
            <CardDescription className="text-green-700">
              All {generationState.totalCount} self-learning course PDFs have been generated via direct API connection and downloaded automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-green-700">
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{generationState.completedCount} PDFs downloaded</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Generated in {formatTime(generationState.timeElapsed)}</span>
                </div>
              </div>

              {/* Show completed requests */}
              <div className="grid gap-2">
                {Object.entries(generationState.requests).map(([requestId, requestState]) => (
                  <div
                    key={requestId}
                    className={`p-2 rounded text-xs flex items-center gap-2 ${
                      requestState.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {requestState.status === "completed" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    <span>
                      {requestState.title} ({requestState.level})
                      {requestState.retryCount && requestState.retryCount > 0 && (
                        <span className="ml-1 text-orange-600">(Retried {requestState.retryCount}x)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
