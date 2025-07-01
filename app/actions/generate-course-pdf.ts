"use server"

interface PdfRequest {
  industry: string
  career: string
  objective: string
  level: string
}

export async function generateCoursePdf(data: PdfRequest): Promise<Blob> {
  const apiKey = process.env.DEEPLEARN_API_KEY

  if (!apiKey) {
    throw new Error("API key not configured. Please contact support.")
  }

  const baseUrl = "https://deeplearn-ai-dev-440418065714.asia-southeast1.run.app"
  const endpoint = "/agents/course-pdf-generator"

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
        objective: data.objective,
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
      throw new Error("Invalid response format. Expected PDF file.Found " + response.headers)
    }

    const pdfBlob = await response.blob()

    // Validate that we received a valid PDF blob
    if (pdfBlob.size === 0) {
      throw new Error("Received empty PDF file")
    }

    return pdfBlob
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to generate course PDF. Please try again.")
  }
}
