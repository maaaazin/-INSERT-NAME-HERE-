import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  Send,
  Download,
  BarChart3,
  Trophy,
  Medal,
  Eye,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'
import CreateAssignmentModal from '@/components/modals/CreateAssignmentModal'
import ViewAssignmentModal from '@/components/modals/ViewAssignmentModal'
import AnalyticsModal from '@/components/modals/AnalyticsModal'
import EditAssignmentModal from '@/components/modals/EditAssignmentModal'
import ManageTestCasesModal from '@/components/modals/ManageTestCasesModal'
import { statsAPI, assignmentsAPI, submissionsAPI } from '@/services/api'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [testCasesModalOpen, setTestCasesModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeAssignments: 0,
    studentsSubmitted: '0/0',
    averageScore: '0%',
    mightNeedHelp: 0
  })
  const [assignments, setAssignments] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [studentsNeedHelp, setStudentsNeedHelp] = useState([])

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user?.instructor_id) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Fetch stats (no batch filtering)
      const statsData = await statsAPI.getTeacherStats(user.instructor_id)
      setStats({
        activeAssignments: statsData.activeAssignments || 0,
        studentsSubmitted: statsData.studentsSubmitted || '0/0',
        averageScore: statsData.averageScore || '0%',
        mightNeedHelp: statsData.mightNeedHelp || 0
      })
      
      // Set students who need help
      setStudentsNeedHelp(statsData.studentsNeedHelp || [])

      // Fetch leaderboard (all students, no batch filtering)
      const leaderboardData = await statsAPI.getLeaderboard()
      setLeaderboard(leaderboardData || [])
      
      // Fetch recent activity (recent submissions)
      try {
        const submissions = await submissionsAPI.getAll()
        const recent = (submissions || [])
          .slice(0, 10)
          .map(sub => {
            const submittedAt = new Date(sub.submitted_at || sub.created_at)
            const now = new Date()
            const minutesAgo = Math.floor((now - submittedAt) / (1000 * 60))
            const hoursAgo = Math.floor(minutesAgo / 60)
            const daysAgo = Math.floor(hoursAgo / 24)
            
            let timeAgo = ''
            if (minutesAgo < 60) {
              timeAgo = `${minutesAgo} min ago`
            } else if (hoursAgo < 24) {
              timeAgo = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
            } else {
              timeAgo = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`
            }

            const score = sub.max_score ? Math.round((sub.score / sub.max_score) * 100) : 0
            let status = 'info'
            let action = 'attempted'
            
            if (sub.status === 'graded' && score === 100) {
              status = 'success'
              action = 'submitted'
            } else if (sub.status === 'graded' && score > 0) {
              status = 'info'
              action = 'submitted'
            } else if (sub.status === 'graded' && score === 0) {
              status = 'error'
              action = 'failed a submission'
            }

            return {
              id: sub.submission_id,
              name: sub.students?.users?.name || 'Unknown Student',
              action,
              time: timeAgo,
              status
            }
          })
        setRecentActivity(recent)
      } catch (error) {
        console.error('Error fetching recent activity:', error)
        setRecentActivity([])
      }

      // Fetch all assignments (not just active, not limited to 3)
      const assignmentsData = await assignmentsAPI.getByInstructor(user.instructor_id)
      const assignmentsWithStats = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const assignmentStats = await statsAPI.getAssignmentStats(assignment.assignment_id)
          return {
            ...assignment,
            assignment_id: assignment.assignment_id,
            title: assignment.title,
            dueDate: new Date(assignment.due_date).toLocaleDateString(),
            language: assignment.language,
            submissions: assignmentStats.submissions || '0/0',
            avgScore: assignmentStats.averageScore || '0%',
            status: assignment.status
          }
        })
      )
      // Sort by created_at descending and show all
      assignmentsWithStats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setAssignments(assignmentsWithStats)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const metrics = [
    { label: 'Active Assignments', value: stats.activeAssignments.toString(), icon: FileText, color: 'text-blue-600' },
    { label: 'Students Submitted', value: stats.studentsSubmitted, icon: Users, color: 'text-green-600' },
    { label: 'Average Score', value: stats.averageScore, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Might Need Help', value: stats.mightNeedHelp.toString(), icon: AlertCircle, color: 'text-red-600' },
  ]


  const getStatusDot = (status) => {
    const colors = {
      success: 'bg-green-500',
      info: 'bg-blue-500',
      error: 'bg-red-500',
    }
    return <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-gray-500'}`} />
  }

  const getMedalIcon = (medal) => {
    if (medal === 'gold') return <Medal className="w-5 h-5 text-yellow-500" />
    if (medal === 'silver') return <Medal className="w-5 h-5 text-gray-400" />
    if (medal === 'bronze') return <Medal className="w-5 h-5 text-amber-600" />
    return null
  }

  // Show loading state if user data is not available yet
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Show message if user doesn't have instructor_id
  if (!user?.instructor_id && !loading) {
    return (
      <div className="space-y-6">
        <header className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || 'Teacher'}!</h1>
        </header>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Instructor Profile Found</h2>
            <p className="text-gray-600">Please contact your administrator to set up your instructor profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || 'Teacher'}!</h1>
          <div className="flex items-center gap-4">
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setCreateModalOpen(true)}
            >
              + Create Assignment
            </Button>
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    {getStatusDot(activity.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.name} {activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Students Need Help */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Students might Need Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : studentsNeedHelp.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">No students need help at the moment</p>
              ) : (
                studentsNeedHelp.map((student) => (
                  <div
                    key={student.student_id}
                    className={`p-4 rounded-lg border ${
                      student.priority === 'high'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <p className="font-semibold text-sm mb-1">{student.name}</p>
                    <p className="text-xs text-gray-600 mb-2">{student.issue}</p>
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                      <Send className="w-3 h-3 mr-1" />
                      Send Mail
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* All Assignments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Assignments</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No assignments found</p>
              ) : (
                assignments.map((assignment) => (
                <div key={assignment.assignment_id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{assignment.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>Due: {assignment.dueDate}</span>
                        <span>•</span>
                        <span>{assignment.language}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {assignment.submissions} submissions • Avg Score: {assignment.avgScore}
                      </p>
                    </div>
                    <Badge variant={assignment.status === 'active' ? 'success' : 'secondary'} className="ml-4">
                      {assignment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-gray-200"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setViewModalOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-gray-200"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setAnalyticsModalOpen(true)
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Analytics
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-gray-200"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setEditModalOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-gray-200"
                        onClick={() => setTestCasesModalOpen(true)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Test Cases
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="outline-red-400 text-red-500 hover:bg-gray-200"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this assignment?')) {
                            assignmentsAPI.delete(assignment.assignment_id).then(() => {
                              fetchData()
                            }).catch(err => {
                              console.error('Error deleting assignment:', err)
                              alert('Failed to delete assignment')
                            })
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Leaderboard
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : leaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No leaderboard data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboard.slice(0, 10).map((student, index) => (
                      <TableRow key={student.student_id || index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index < 3 && getMedalIcon(['gold', 'silver', 'bronze'][index])}
                            <span className="font-semibold">{student.rank || index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.score}%</TableCell>
                        <TableCell>{student.submissions}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateAssignmentModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchData}
      />
      <ViewAssignmentModal 
        open={viewModalOpen} 
        onOpenChange={setViewModalOpen}
        assignment={selectedAssignment}
      />
      <AnalyticsModal 
        open={analyticsModalOpen} 
        onOpenChange={setAnalyticsModalOpen}
        assignment={selectedAssignment}
      />
      <EditAssignmentModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen}
        assignment={selectedAssignment}
        onSuccess={fetchData}
      />
      <ManageTestCasesModal 
        open={testCasesModalOpen} 
        onOpenChange={setTestCasesModalOpen} 
      />
    </div>
  )
}

export default TeacherDashboard

