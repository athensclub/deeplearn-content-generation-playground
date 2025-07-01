"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BookOpen, Target, RotateCcw } from "lucide-react"
import { CourseOutlineDisplay } from "./course-outline-display"

interface CourseOutline {
  title: string
  description: string
  units: Array<{
    title: string
    learningOutcome: string
    lessons: Array<{
      title: string
      learningOutcome: string
    }>
  }>
}

const proficiencyLevels = [
  { value: "A1", label: "A1 - Beginner", description: "Basic phrases and simple interactions" },
  { value: "A2", label: "A2 - Elementary", description: "Simple conversations and routine tasks" },
  { value: "B1", label: "B1 - Intermediate", description: "Clear communication on familiar topics" },
  { value: "B2", label: "B2 - Upper Intermediate", description: "Complex topics and professional discussions" },
  { value: "C1", label: "C1 - Advanced", description: "Fluent and sophisticated language use" },
  { value: "C2", label: "C2 - Proficient", description: "Near-native level mastery" },
]

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryApiCall<T>(apiCall: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
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
      const jitter = Math.random() * 1000 // Add up to 1 second of random jitter
      const totalDelay = exponentialDelay + jitter

      console.log(
        `API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(totalDelay)}ms...`,
      )
      await delay(totalDelay)
    }
  }

  throw lastError!
}

async function generateCourseOutlineClient(data: {
  industry: string
  career: string
  level: string
}): Promise<CourseOutline> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPLEARN_API_KEY

  if (!apiKey) {
    throw new Error("API key not configured. Please contact support.")
  }

  const baseUrl = "https://deeplearn-ai-dev-440418065714.asia-southeast1.run.app"
  const endpoint = "/agents/course-outline-generator"

  const makeApiCall = async (): Promise<CourseOutline> => {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        industry: data.industry,
        career: data.career,
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

    const courseOutline: CourseOutline = await response.json()

    // Validate the response structure
    if (!courseOutline.title || !courseOutline.description || !Array.isArray(courseOutline.units)) {
      throw new Error("Invalid response format from server")
    }

    return courseOutline
  }

  try {
    return await retryApiCall(makeApiCall, 3, 1000)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to generate course outline after multiple attempts. Please try again.")
  }
}

export function CourseGenerator() {
  const [formData, setFormData] = useState({
    industry: "",
    career: "",
    level: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [courseOutline, setCourseOutline] = useState<CourseOutline | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.industry || !formData.career || !formData.level) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError(null)
    setCourseOutline(null)

    try {
      const result = await generateCourseOutlineClient(formData)
      setCourseOutline(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate course outline")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setCourseOutline(null)
    setError(null)
    setFormData({ industry: "", career: "", level: "" })
  }

  return (
    <div className="space-y-8">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Course Information
          </CardTitle>
          <CardDescription>
            Tell us about your industry, career goals, and current English level to generate a personalized course
            outline. Our system automatically retries failed requests up to 3 times for reliability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  value={formData.industry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career">Career/Role</Label>
                <Input
                  id="career"
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  value={formData.career}
                  onChange={(e) => setFormData((prev) => ({ ...prev, career: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">English Proficiency Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, level: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your current English level" />
                </SelectTrigger>
                <SelectContent>
                  {proficiencyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-gray-500">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Course...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Generate Course Outline
                  </>
                )}
              </Button>
              {courseOutline && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Create New Course
                </Button>
              )}
            </div>

            {/* Retry Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RotateCcw className="h-4 w-4" />
              <span>Automatic retry enabled (up to 3 attempts) • Direct API connection</span>
            </div>
          </form>
        </CardContent>
      </Card>

      {courseOutline && <CourseOutlineDisplay courseOutline={courseOutline} />}
    </div>
  )
}
