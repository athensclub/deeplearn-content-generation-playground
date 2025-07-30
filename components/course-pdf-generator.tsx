"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Coffee,
  RotateCcw,
  Building,
  FileTextIcon,
} from "lucide-react"

interface PdfGenerationState {
  status: "idle" | "generating" | "completed" | "error"
  levels: {
    [key: string]: {
      status: "pending" | "generating" | "completed" | "error" | "retrying"
      progress: number
      error?: string
      retryCount?: number
    }
  }
  timeElapsed: number
  completedCount: number
  totalCount: number
}

const CEFR_LEVELS = [
  { code: "G1", name: "Beginner", description: "Basic phrases and simple interactions" },
  { code: "G2", name: "Elementary", description: "Simple conversations and routine tasks" },
  { code: "G3", name: "Intermediate", description: "Clear communication on familiar topics" },
  { code: "G4", name: "Upper Intermediate", description: "Complex topics and professional discussions" },
  { code: "G5", name: "Advanced", description: "Fluent and sophisticated language use" },
  { code: "G6", name: "Proficient", description: "Near-native level mastery" },
]

const motivationalTips = [
  "💡 Tip: The detailed content being generated will save you hours of course preparation time!",
  "📚 Did you know? Professional course materials can significantly improve learning outcomes.",
  "⏰ While you wait: Consider how you'll structure your teaching sessions with the generated content.",
  "🎯 Fun fact: Customized course materials increase student engagement by up to 40%.",
  "✨ Almost there! The AI is crafting exercises and activities tailored to your industry.",
  "🚀 Your comprehensive course PDF will include practical examples and real-world scenarios.",
  "📖 The generated content will be professionally formatted and ready to use immediately.",
  "💼 Industry-specific vocabulary and terminology are being carefully integrated into your course.",
  "🔄 Our system automatically retries failed requests to ensure reliable delivery.",
  "⚡ Multiple retry attempts with smart delays help overcome temporary network issues.",
  "🌐 Direct API connection ensures faster response times and better reliability.",
  "📋 Custom outlines and corporate details enhance course relevance and specificity.",
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
        `PDF API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(totalDelay)}ms...`,
      )
      await delay(totalDelay)
    }
  }

  throw lastError!
}

async function generateCoursePdfClient(data: {
  industry: string
  career: string
  objective: string
  level: string
  outline?: string
  corporate?: {
    name: string
    detail: string
  }
}): Promise<Blob> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPLEARN_API_KEY

  if (!apiKey) {
    throw new Error("API key not configured. Please contact support.")
  }

  const baseUrl = "http://localhost:8787"
  const endpoint = "/pdf/course-pdf-generator"

  const makeApiCall = async (): Promise<Blob> => {
    // Build request body with optional fields
    const requestBody: any = {
      industry: data.industry,
      career: data.career,
      objective: data.objective,
      level: data.level,
    }

    // Add optional fields if provided
    if (data.outline && data.outline.trim()) {
      requestBody.outline = data.outline
    }

    if (data.corporate && data.corporate.name.trim() && data.corporate.detail.trim()) {
      requestBody.corporate = {
        name: data.corporate.name,
        detail: data.corporate.detail,
      }
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
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
    throw new Error("Failed to generate course PDF after multiple attempts. Please try again.")
  }
}

export function CoursePdfGenerator() {
  const [formData, setFormData] = useState({
    industry: "",
    career: "",
    objective: "",
    outline: "",
    corporate: {
      name: "",
      detail: "",
    },
  })

  const [generationState, setGenerationState] = useState<PdfGenerationState>({
    status: "idle",
    levels: CEFR_LEVELS.reduce(
      (acc, level) => ({
        ...acc,
        [level.code]: { status: "pending", progress: 0, retryCount: 0 },
      }),
      {},
    ),
    timeElapsed: 0,
    completedCount: 0,
    totalCount: 6,
  })

  const [currentTip, setCurrentTip] = useState(0)

  // Timer for progress simulation and tips rotation
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (generationState.status === "generating") {
      interval = setInterval(() => {
        setGenerationState((prev) => {
          const newTimeElapsed = prev.timeElapsed + 1

          // Simulate progress for generating levels
          const updatedLevels = { ...prev.levels }
          Object.keys(updatedLevels).forEach((levelCode) => {
            if (updatedLevels[levelCode].status === "generating") {
              // Simulate progress up to 90%, then wait for actual completion
              const currentProgress = updatedLevels[levelCode].progress
              if (currentProgress < 90) {
                updatedLevels[levelCode] = {
                  ...updatedLevels[levelCode],
                  progress: Math.min(currentProgress + Math.random() * 3, 90),
                }
              }
            }
          })

          return {
            ...prev,
            timeElapsed: newTimeElapsed,
            levels: updatedLevels,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.industry || !formData.career || !formData.objective) {
      setGenerationState((prev) => ({
        ...prev,
        status: "error",
      }))
      return
    }

    // Initialize generation state
    setGenerationState({
      status: "generating",
      levels: CEFR_LEVELS.reduce(
        (acc, level) => ({
          ...acc,
          [level.code]: { status: "generating", progress: 0, retryCount: 0 },
        }),
        {},
      ),
      timeElapsed: 0,
      completedCount: 0,
      totalCount: 6,
    })

    // Start all PDF generations in parallel immediately
    CEFR_LEVELS.forEach(async (level) => {
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
                levels: {
                  ...prev.levels,
                  [level.code]: {
                    ...prev.levels[level.code],
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
              `PDF API call failed for ${level.code} (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(totalDelay)}ms...`,
            )
            await delay(totalDelay)
          }
        }

        throw lastError!
      }

      try {
        const pdfBlob = await retryApiCallWithTracking(
          async () => {
            return await generateCoursePdfClient({
              ...formData,
              level: level.code,
              outline: formData.outline || undefined,
              corporate:
                formData.corporate.name.trim() && formData.corporate.detail.trim() ? formData.corporate : undefined,
            })
          },
          3,
          2000,
        )

        // Create and trigger download immediately when this PDF is ready
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${formData.career}-${formData.industry}-${level.code}-Course.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        // Update state for this specific level completion
        setGenerationState((prev) => {
          const newCompletedCount = prev.completedCount + 1
          return {
            ...prev,
            levels: {
              ...prev.levels,
              [level.code]: { status: "completed", progress: 100, retryCount: retryCount },
            },
            completedCount: newCompletedCount,
            status: newCompletedCount === 6 ? "completed" : prev.status,
          }
        })
      } catch (err) {
        // Update state for this level with error
        setGenerationState((prev) => ({
          ...prev,
          levels: {
            ...prev.levels,
            [level.code]: {
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
      levels: CEFR_LEVELS.reduce(
        (acc, level) => ({
          ...acc,
          [level.code]: { status: "pending", progress: 0, retryCount: 0 },
        }),
        {},
      ),
      timeElapsed: 0,
      completedCount: 0,
      totalCount: 6,
    })
    setFormData({
      industry: "",
      career: "",
      objective: "",
      outline: "",
      corporate: {
        name: "",
        detail: "",
      },
    })
    setCurrentTip(0)
  }

  return (
    <div className="space-y-8">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Course PDF Information
          </CardTitle>
          <CardDescription>
            Provide detailed information about your course requirements. Our system makes direct API calls with
            automatic retry (up to 3 attempts) for maximum reliability and timeout avoidance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Required Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="industry">
                  Industry <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="industry"
                  placeholder="e.g., Banking, Healthcare, Technology"
                  value={formData.industry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                  disabled={generationState.status === "generating"}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career">
                  Career/Role <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="career"
                  placeholder="e.g., Customer Service Representative, Sales Manager"
                  value={formData.career}
                  onChange={(e) => setFormData((prev) => ({ ...prev, career: e.target.value }))}
                  disabled={generationState.status === "generating"}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">
                Course Objective <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="objective"
                placeholder="Describe the course goals, target audience, and learning approach. Be as detailed as possible..."
                value={formData.objective}
                onChange={(e) => setFormData((prev) => ({ ...prev, objective: e.target.value }))}
                disabled={generationState.status === "generating"}
                rows={6}
                className="resize-none"
                required
              />
              <p className="text-sm text-gray-500">
                Example: "This course is designed to equip banking professionals with practical English communication
                skills essential for interacting with international customers..."
              </p>
            </div>

            {/* Optional Fields */}
            <div className="space-y-6">
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileTextIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Optional Fields</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  These fields are optional but can help create more customized and relevant course content.
                </p>

                {/* Course Outline */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="outline">Course Outline (Markdown Format)</Label>
                  <Textarea
                    id="outline"
                    placeholder="Provide a detailed course outline in markdown format. This will be used to structure the PDF content..."
                    value={formData.outline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, outline: e.target.value }))}
                    disabled={generationState.status === "generating"}
                    rows={8}
                    className="resize-none font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Example: Use markdown tables with columns like "Class | Topic | Learning Outcomes | Language Focus"
                  </p>
                </div>

                {/* Corporate Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <Label className="text-base font-medium">Corporate Information</Label>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="corporateName">Company Name</Label>
                      <Input
                        id="corporateName"
                        placeholder="e.g., TechCorp, Bank of Excellence"
                        value={formData.corporate.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            corporate: { ...prev.corporate, name: e.target.value },
                          }))
                        }
                        disabled={generationState.status === "generating"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="corporateDetail">Company Details</Label>
                      <Textarea
                        id="corporateDetail"
                        placeholder="Detailed information about the company, including relevant topics, sources, products, or services..."
                        value={formData.corporate.detail}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            corporate: { ...prev.corporate, detail: e.target.value },
                          }))
                        }
                        disabled={generationState.status === "generating"}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Corporate information helps customize the course content with company-specific examples, products,
                    and scenarios.
                  </p>
                </div>
              </div>
            </div>

            {generationState.status === "error" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-600 text-sm">Please fill in all required fields (marked with *).</p>
                </div>
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
                    Generate Course PDFs (All Levels)
                  </>
                )}
              </Button>
              {(generationState.status === "completed" || generationState.status === "error") && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Generate New PDFs
                </Button>
              )}
            </div>

            {/* Direct API Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RotateCcw className="h-4 w-4" />
              <span>Direct API connection • Auto-retry enabled (up to 3 attempts) • No server timeouts</span>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {generationState.status === "generating" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Clock className="h-5 w-5" />
              Generating Course Package ({generationState.completedCount}/{generationState.totalCount} completed)
            </CardTitle>
            <CardDescription className="text-blue-700">
              Creating comprehensive course materials for all CEFR levels via direct API connection. Each PDF will
              download automatically when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Overall Progress</span>
                <span className="text-blue-700">
                  {Math.round((generationState.completedCount / generationState.totalCount) * 100)}%
                </span>
              </div>
              <Progress value={(generationState.completedCount / generationState.totalCount) * 100} className="h-2" />
            </div>

            {/* Individual Level Progress */}
            <div className="space-y-3">
              <h4 className="font-medium text-blue-900 text-sm">Individual Level Progress</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {CEFR_LEVELS.map((level) => {
                  const levelState = generationState.levels[level.code]
                  return (
                    <div key={level.code} className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {level.code} - {level.name}
                          </span>
                          {levelState.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {levelState.status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                          {levelState.status === "generating" && (
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                          )}
                          {levelState.status === "retrying" && (
                            <RotateCcw className="h-4 w-4 text-orange-600 animate-spin" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {levelState.retryCount && levelState.retryCount > 0 && (
                            <span className="text-xs text-orange-600">Retry {levelState.retryCount}/3</span>
                          )}
                          <span className="text-xs text-gray-600 capitalize">
                            {levelState.status === "retrying" ? "retrying" : levelState.status}
                          </span>
                        </div>
                      </div>
                      {levelState.status === "error" && levelState.error && (
                        <p className="text-xs text-red-600 mb-2">{levelState.error}</p>
                      )}
                      <Progress value={levelState.status === "completed" ? 100 : levelState.progress} className="h-1" />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700">Time elapsed: {formatTime(generationState.timeElapsed)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700">Downloads: {generationState.completedCount}/6</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-orange-600" />
                <span className="text-blue-700">Direct API</span>
              </div>
            </div>

            {/* Motivational Tips */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Coffee className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">While You Wait...</h4>
                  <p className="text-blue-700 text-sm">{motivationalTips[currentTip]}</p>
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
              Course Package Generated Successfully!
            </CardTitle>
            <CardDescription className="text-green-700">
              All 6 course PDFs (A1-C2 levels) have been generated via direct API connection and downloaded
              automatically.
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

              {/* Show completed levels */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CEFR_LEVELS.map((level) => {
                  const levelState = generationState.levels[level.code]
                  return (
                    <div
                      key={level.code}
                      className={`p-2 rounded text-xs flex items-center gap-2 ${
                        levelState.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {levelState.status === "completed" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>
                        {level.code} - {level.name}
                        {levelState.retryCount && levelState.retryCount > 0 && (
                          <span className="ml-1 text-orange-600">(Retried {levelState.retryCount}x)</span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Show what was included */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Generated with:</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <div>✓ Industry: {formData.industry}</div>
                  <div>✓ Career: {formData.career}</div>
                  {formData.outline && <div>✓ Custom course outline included</div>}
                  {formData.corporate.name && <div>✓ Corporate information: {formData.corporate.name}</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
