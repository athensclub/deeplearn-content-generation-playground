"use server"

interface CourseRequest {
  industry: string
  career: string
  level: string
}

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

export async function generateCourseOutline(data: CourseRequest): Promise<CourseOutline> {
  const apiKey = process.env.DEEPLEARN_API_KEY

  if (!apiKey) {
    throw new Error("API key not configured. Please contact support.")
  }

  const baseUrl = "https://deeplearn-ai-dev-440418065714.asia-southeast1.run.app"
  const endpoint = "/agents/course-outline-generator"

  try {
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
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to generate course outline. Please try again.")
  }
}
