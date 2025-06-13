import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Target, CheckCircle, Users } from "lucide-react"

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

interface CourseOutlineDisplayProps {
  courseOutline: CourseOutline
}

export function CourseOutlineDisplay({ courseOutline }: CourseOutlineDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Course Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Course Overview
            </Badge>
          </div>
          <CardTitle className="text-2xl text-blue-900">{courseOutline.title}</CardTitle>
          <CardDescription className="text-blue-700 text-base leading-relaxed">
            {courseOutline.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-blue-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{courseOutline.units.length} Units</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>{courseOutline.units.reduce((total, unit) => total + unit.lessons.length, 0)} Lessons</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Units */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          Course Units
        </h3>

        {courseOutline.units.map((unit, unitIndex) => (
          <Card key={unitIndex} className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-gray-900 mb-2">
                    Unit {unitIndex + 1}: {unit.title}
                  </CardTitle>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <CardDescription className="text-gray-600">
                      <strong>Learning Outcome:</strong> {unit.learningOutcome}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="ml-4">
                  {unit.lessons.length} Lessons
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Lessons</h4>
                <div className="grid gap-3">
                  {unit.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lessonIndex}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {lessonIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-1">{lesson.title}</h5>
                          <p className="text-sm text-gray-600">{lesson.learningOutcome}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
