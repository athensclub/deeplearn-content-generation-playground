"use client"
import { useState } from "react"
import { FileText, Download, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const LEVELS = ["G1", "G2", "G3", "G4", "G5", "G6"]

export default function SyllabusPdfGeneratorPage() {
  const [industry, setIndustry] = useState("")
  const [career, setCareer] = useState("")
  const [objective, setObjective] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ [level: string]: "pending" | "downloading" | "done" | "error" }>({})
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setProgress(Object.fromEntries(LEVELS.map(l => [l, "pending"])))

    const baseUrl = "http://localhost:8787"
    const endpoint = "/pdf/syllabus-pdf-generator"
    await Promise.all(
      LEVELS.map(async (level) => {
        setProgress(prev => ({ ...prev, [level]: "downloading" }))
        try {
          const res = await fetch(`${baseUrl}${endpoint}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ industry, career, objective, level })
            }
          )
          if (!res.ok) throw new Error(`Failed for ${level}`)
          const blob = await res.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `syllabus_${industry}_${career}_${level}.pdf`
          document.body.appendChild(a)
          a.click()
          a.remove()
          window.URL.revokeObjectURL(url)
          setProgress(prev => ({ ...prev, [level]: "done" }))
        } catch (err) {
          setProgress(prev => ({ ...prev, [level]: "error" }))
          setError((err as Error).message)
        }
      })
    )
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Syllabus PDF Generator</h1>
                <p className="text-sm text-gray-600">Generate Globish syllabus PDFs for all levels (G1-G6)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/pdf-generator">
                <Button variant="outline">Back to Course PDF Generator</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Back to Course Builder</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Generate Syllabus PDFs</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block font-medium mb-1">Industry</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Career</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={career}
                    onChange={e => setCareer(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Objective</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2 inline" /> : <Download className="h-5 w-5 mr-2 inline" />}
                  Generate Syllabus PDFs
                </Button>
                {error && <div className="text-red-600 mt-2">{error}</div>}
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card>
              <CardHeader>
                <CardTitle>Download Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {LEVELS.map(level => (
                    <li key={level} className="flex items-center gap-2">
                      <span className="font-semibold">{level}:</span>
                      {progress[level] === "downloading" && <Loader2 className="animate-spin h-4 w-4 text-blue-600" />}
                      {progress[level] === "done" && <span className="text-green-600">Downloaded</span>}
                      {progress[level] === "error" && <span className="text-red-600">Error</span>}
                      {progress[level] === "pending" && <span className="text-gray-400">Pending</span>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
