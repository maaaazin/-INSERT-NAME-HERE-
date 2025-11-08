import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Code, Calendar, FileText, Clock, Loader2 } from 'lucide-react'
import { assignmentsAPI, submissionsAPI } from '@/services/api'

const StudentAssignments = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [user])

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      // Fetch all assignments
      const allAssignments = await assignmentsAPI.getAll()
      
      // Fetch student's submissions to determine status
      let submissions = []
      if (user?.student_id) {
        try {
          submissions = await submissionsAPI.getByStudent(user.student_id)
        } catch (error) {
          console.error('Error fetching submissions:', error)
        }
      }

      // Create a map of assignment_id to latest submission
      const submissionMap = new Map()
      submissions?.forEach(sub => {
        if (!submissionMap.has(sub.assignment_id) || 
            new Date(sub.submitted_at) > new Date(submissionMap.get(sub.assignment_id).submitted_at)) {
          submissionMap.set(sub.assignment_id, sub)
        }
      })

      // Process assignments
      const processedAssignments = (allAssignments || []).map(assignment => {
        const dueDate = new Date(assignment.due_date)
        const now = new Date()
        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
        const isPastDue = daysLeft < 0

        const submission = submissionMap.get(assignment.assignment_id)
        let status = 'not-started'
        let score = null

        if (submission) {
          if (submission.status === 'graded' && submission.score > 0) {
            status = 'submitted'
            score = submission.max_score ? `${Math.round((submission.score / submission.max_score) * 100)}%` : '0%'
          } else if (submission.status === 'pending') {
            status = 'in-progress'
          }
        }

        return {
          id: assignment.assignment_id,
          assignment_id: assignment.assignment_id,
          title: assignment.title,
          dueDate: dueDate.toLocaleDateString(),
          language: assignment.language,
          status,
          score,
          timeRemaining: daysLeft > 0 ? `${daysLeft} days left` : 'Past due',
          description: assignment.description || 'No description available',
          isPastDue
        }
      })

      setAssignments(processedAssignments)
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const getButtonText = (assignment) => {
    if (assignment.isPastDue) {
      return 'Closed'
    }
    if (assignment.status === 'submitted') {
      return 'View Submissions'
    }
    if (assignment.status === 'in-progress') {
      return 'Continue'
    }
    return 'Attempt'
  }

  const handleButtonClick = (assignment) => {
    if (assignment.isPastDue) {
      return // Do nothing for closed assignments
    }
    if (assignment.status === 'submitted') {
      navigate('/student/submissions')
    } else {
      navigate(`/student/assignments/${assignment.id}/attempt`)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      'submitted': { variant: 'success', label: 'Submitted' },
      'in-progress': { variant: 'secondary', label: 'In Progress' },
      'not-started': { variant: 'outline', label: 'Not Started' },
    }
    const config = variants[status] || variants['not-started']
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <BookOpen className="w-8 h-8" />
        My Assignments
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Assignments List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                No assignments available
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-xl">{assignment.title}</h3>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Code className="w-4 h-4" />
                        {assignment.language}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {assignment.dueDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {assignment.timeRemaining}
                      </span>
                    </div>
                    {assignment.score && (
                      <p className="text-sm font-medium text-green-600 mt-2">
                        Your Score: {assignment.score}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    onClick={() => handleButtonClick(assignment)}
                    disabled={assignment.isPastDue}
                    variant={assignment.isPastDue ? 'outline' : 'default'}
                  >
                    {getButtonText(assignment)}
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>

        {/* Right Column - Upcoming Deadlines */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignments
                .filter(a => a.status !== 'submitted')
                .map((assignment) => (
                  <div key={assignment.id} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm mb-1">{assignment.title}</p>
                    <p className="text-xs text-gray-600 mb-1">{assignment.timeRemaining}</p>
                    <p className="text-xs text-gray-500">Due: {assignment.dueDate}</p>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default StudentAssignments

