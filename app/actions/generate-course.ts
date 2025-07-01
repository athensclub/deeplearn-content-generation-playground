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

export async function generateCourseOutline(data: CourseRequest): Promise<CourseOutline> {
  const apiKey = process.env.DEEPLEARN_API_KEY

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
