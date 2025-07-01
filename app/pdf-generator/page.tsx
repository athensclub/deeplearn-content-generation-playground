import { CoursePdfGenerator } from "@/components/course-pdf-generator"
import { FileText, Clock, Download, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PdfGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Course PDF Generator</h1>
                <p className="text-sm text-gray-600">Generate comprehensive course materials as PDF</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Course Builder</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Generate Complete Course Package</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create comprehensive, professionally formatted PDF course materials for all CEFR levels (A1-C2) tailored to
            your specific industry and career objectives.
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
                      Generating 6 PDFs (A1-C2 levels) can take up to 15 minutes. Please be patient and don't close this
                      page.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Multiple Downloads</h4>
                    <p className="text-amber-700 text-sm">
                      Each completed PDF will automatically download. You'll receive 6 course files total.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Complete Package</h3>
              <p className="text-gray-600 text-sm">6 comprehensive PDFs covering all CEFR levels (A1-C2)</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Download className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Progressive Learning</h3>
              <p className="text-gray-600 text-sm">Structured progression from beginner to advanced levels</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Parallel Generation</h3>
              <p className="text-gray-600 text-sm">All levels generated simultaneously for efficiency</p>
            </div>
          </div>
        </div>
      </section>

      {/* PDF Generator */}
      <section className="pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <CoursePdfGenerator />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 English Course Builder. Professional course materials at your fingertips.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
