import { SelfLearnPdfGenerator } from "@/components/self-learn-pdf-generator"
import { FileText, Clock, Download, AlertTriangle, BookOpen, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SelfLearnPdfGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Self-Learning PDF Generator</h1>
                <p className="text-sm text-gray-600">Generate personalized self-learning course materials</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/pdf-generator">
                <Button variant="outline">Course PDF Generator</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Generate Self-Learning Course Materials</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create comprehensive, self-paced learning PDFs for any course topic. Choose between single course form input
            or bulk generation from JSON array for multiple courses.
          </p>

          {/* Important Notice */}
          <Card className="bg-amber-50 border-amber-200 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Processing Time</h4>
                    <p className="text-amber-700 text-sm">
                      Self-learning PDFs are generated quickly, typically within 1-3 minutes per course. Multiple courses are processed in parallel.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Automatic Downloads</h4>
                    <p className="text-amber-700 text-sm">
                      Each completed PDF will automatically download. For bulk generation, you'll receive multiple files.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Self-Paced Learning</h3>
              <p className="text-gray-600 text-sm">Materials designed for independent study with clear progression</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Flexible Input</h3>
              <p className="text-gray-600 text-sm">Single course form or bulk JSON array for multiple courses</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Parallel Processing</h3>
              <p className="text-gray-600 text-sm">Multiple courses generated simultaneously for efficiency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Self-Learning PDF Generator */}
      <section className="pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <SelfLearnPdfGenerator />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 English Course Builder. Self-learning materials at your fingertips.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
