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

      // Group submissions by assignment and calculate averages
      const assignmentSubmissions = new Map()
      submissions?.forEach(sub => {
        const assignmentId = sub.assignment_id
        if (!assignmentSubmissions.has(assignmentId)) {
          assignmentSubmissions.set(assignmentId, [])
        }
        assignmentSubmissions.get(assignmentId).push(sub)
      })

      // Calculate average scores per assignment
      const assignmentAverages = new Map()
      assignmentSubmissions.forEach((subs, assignmentId) => {
        const gradedSubs = subs.filter(s => s.status === 'graded' && s.score !== null)
        if (gradedSubs.length > 0) {
          const totalScore = gradedSubs.reduce((sum, s) => sum + (s.score || 0), 0)
          const maxScore = gradedSubs[0].max_score || 100
          const avgScore = Math.round(totalScore / gradedSubs.length)
          const avgPercentage = Math.round((avgScore / maxScore) * 100)
          assignmentAverages.set(assignmentId, {
            averageScore: avgPercentage,
            totalSubmissions: gradedSubs.length,
            latestSubmission: subs.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0]
          })
        }
      })

      // Process assignments
      const processedAssignments = (allAssignments || []).map(assignment => {
        const dueDate = new Date(assignment.due_date)
        const now = new Date()
        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
        const isPastDue = daysLeft < 0

        const assignmentData = assignmentAverages.get(assignment.assignment_id)
        let status = 'not-started'
        let score = null
        let submissionCount = 0

        if (assignmentData) {
            status = 'submitted'
          score = `${assignmentData.averageScore}% (avg)`
          submissionCount = assignmentData.totalSubmissions
        } else {
          // Check if there are any submissions (even if not graded)
          const subs = assignmentSubmissions.get(assignment.assignment_id)
          if (subs && subs.length > 0) {
            const hasPending = subs.some(s => s.status === 'pending')
            if (hasPending) {
            status = 'in-progress'
            } else if (subs.some(s => s.status === 'graded')) {
              status = 'submitted'
            }
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
          submissionCount,
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
    if (assignment.status === 'submitted' || assignment.status === 'in-progress') {
      return assignment.submissionCount > 0 ? 'Resubmit' : 'Continue'
    }
    return 'Attempt'
  }

  const handleButtonClick = (assignment) => {
    if (assignment.isPastDue) {
      return // Do nothing for closed assignments
    }
    // Always allow attempting/resubmitting until deadline
      navigate(`/student/assignments/${assignment.id}/attempt`)
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
                      <div className="mt-2">
                        <p className="text-sm font-medium text-green-600">
                          Average Score: {assignment.score}
                      </p>
                        {assignment.submissionCount > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Based on {assignment.submissionCount} submissions
                          </p>
                        )}
                        {!assignment.isPastDue && (
                          <p className="text-xs text-blue-600 mt-1">
                            💡 You can resubmit until the deadline to improve your average!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button 
                    className={`flex-1 ${
                      assignment.isPastDue 
                        ? '' 
                        : assignment.submissionCount > 0 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
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

