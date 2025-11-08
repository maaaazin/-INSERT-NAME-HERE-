import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  BookOpen, 
  Clock, 
  CheckCircle2,
  TrendingUp,
  FileText,
  Code,
  Calendar,
  Award,
  Loader2
} from 'lucide-react'
import { statsAPI, assignmentsAPI, submissionsAPI } from '@/services/api'
import { useNavigate } from 'react-router-dom'

const StudentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    assignmentsCompleted: 0,
    averageScore: '0%',
    pendingAssignments: 0,
    currentRank: null
  })
  const [activeAssignments, setActiveAssignments] = useState([])
  const [recentSubmissions, setRecentSubmissions] = useState([])

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user?.student_id) return
    
    setLoading(true)
    try {
      // Fetch stats
      const statsData = await statsAPI.getStudentStats(user.student_id)
      setStats({
        assignmentsCompleted: statsData.assignmentsCompleted || 0,
        averageScore: statsData.averageScore || '0%',
        pendingAssignments: statsData.pendingAssignments || 0,
        currentRank: statsData.currentRank || null
      })

      // Fetch all assignments and filter active ones
      const allAssignments = await assignmentsAPI.getAll()
      const active = (allAssignments || [])
        .filter(a => a.status === 'active')
        .slice(0, 3)
        .map(assignment => {
          const dueDate = new Date(assignment.due_date)
          const now = new Date()
          const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
          
          return {
            assignment_id: assignment.assignment_id,
            title: assignment.title,
            dueDate: dueDate.toLocaleDateString(),
            language: assignment.language,
            status: 'not-started', // Will be updated based on submissions
            score: null,
            timeRemaining: daysLeft > 0 ? `${daysLeft} days left` : 'Past due',
            isPastDue: daysLeft < 0
          }
        })
      setActiveAssignments(active)

      // Fetch recent submissions
      const submissionsData = await submissionsAPI.getByStudent(user.student_id)
      const recent = (submissionsData || [])
        .slice(0, 3)
        .map(sub => ({
          assignment: sub.assignments?.title || 'Unknown',
          submittedAt: new Date(sub.submitted_at).toLocaleDateString(),
          score: sub.max_score ? `${Math.round((sub.score / sub.max_score) * 100)}%` : '0%',
          status: sub.status === 'graded' && sub.score > 0 ? 'accepted' : 'pending',
          language: sub.language
        }))
      setRecentSubmissions(recent)

      // Update assignment statuses based on submissions
      const submissionMap = new Map()
      submissionsData?.forEach(sub => {
        if (!submissionMap.has(sub.assignment_id) || 
            new Date(sub.submitted_at) > new Date(submissionMap.get(sub.assignment_id).submitted_at)) {
          submissionMap.set(sub.assignment_id, sub)
        }
      })

      setActiveAssignments(prev => prev.map(assignment => {
        const submission = submissionMap.get(assignment.assignment_id)
        if (submission) {
          const score = submission.max_score ? Math.round((submission.score / submission.max_score) * 100) : 0
          return {
            ...assignment,
            status: 'submitted',
            score: `${score}%`
          }
        }
        return assignment
      }))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { label: 'Assignments Completed', value: stats.assignmentsCompleted.toString(), icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Average Score', value: stats.averageScore, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Pending Assignments', value: stats.pendingAssignments.toString(), icon: Clock, color: 'text-yellow-600' },
    { label: 'Current Rank', value: stats.currentRank ? `#${stats.currentRank}` : 'N/A', icon: Award, color: 'text-purple-600' },
  ]

  const getStatusBadge = (status) => {
    const variants = {
      'submitted': { variant: 'success', label: 'Submitted' },
      'in-progress': { variant: 'secondary', label: 'In Progress' },
      'not-started': { variant: 'outline', label: 'Not Started' },
      'accepted': { variant: 'success', label: 'Accepted' },
    }
    const config = variants[status] || variants['not-started']
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || 'Student'}!</h1>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Active Assignments
              </CardTitle>
            </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : activeAssignments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No active assignments</p>
                  ) : (
                    activeAssignments.map((assignment, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{assignment.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {assignment.dueDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          {assignment.language}
                        </span>
                      </div>
                      {assignment.score && (
                        <p className="text-sm font-medium text-green-600">
                          Score: {assignment.score}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{assignment.timeRemaining}</p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(assignment.status)}
                    </div>
                  </div>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/student/assignments/${assignment.assignment_id}/attempt`)}
                        >
                          {assignment.status === 'not-started' ? 'Start Assignment' : assignment.status === 'submitted' ? 'View Submission' : 'Continue'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                    ))
                  )}
                </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : recentSubmissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No submissions yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentSubmissions.map((submission, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{submission.assignment}</TableCell>
                      <TableCell>{submission.language}</TableCell>
                      <TableCell>{submission.submittedAt}</TableCell>
                      <TableCell className="font-semibold">{submission.score}</TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeAssignments
                .filter(a => a.status !== 'submitted')
                .map((assignment, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm mb-1">{assignment.title}</p>
                    <p className="text-xs text-gray-600">{assignment.timeRemaining}</p>
                    <p className="text-xs text-gray-500 mt-1">Due: {assignment.dueDate}</p>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-semibold">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overall</span>
                  <span className="font-semibold">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard

