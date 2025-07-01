"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BookOpen, Target, RotateCcw } from "lucide-react"
import { generateCourseOutline } from "@/app/actions/generate-course"
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
      const result = await generateCourseOutline(formData)
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
              <span>Automatic retry enabled (up to 3 attempts)</span>
            </div>
          </form>
        </CardContent>
      </Card>

      {courseOutline && <CourseOutlineDisplay courseOutline={courseOutline} />}
    </div>
  )
}
