import { CourseGenerator } from "@/components/course-generator"
import { BookOpen, Users, Target, Globe } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">English Course Builder</h1>
              <p className="text-sm text-gray-600">Personalized English courses for your career</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Build Your Professional English Course</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate customized English course outlines tailored to your industry, career goals, and current proficiency
            level. Perfect for adult learners looking to advance their professional communication skills.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Industry-Specific</h3>
              <p className="text-gray-600 text-sm">Courses tailored to your specific industry and professional needs</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Career-Focused</h3>
              <p className="text-gray-600 text-sm">Content designed for your specific career path and goals</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Globe className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Level-Appropriate</h3>
              <p className="text-gray-600 text-sm">Structured according to CEFR levels from A1 to C2</p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Generator */}
      <section className="pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <CourseGenerator />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 English Course Builder. Empowering professional communication skills.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
