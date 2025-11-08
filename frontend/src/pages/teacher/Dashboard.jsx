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
  Mail,
  BarChart3,
  Trophy,
  Medal,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import CreateAssignmentModal from '@/components/modals/CreateAssignmentModal'
import ViewAssignmentModal from '@/components/modals/ViewAssignmentModal'
import AnalyticsModal from '@/components/modals/AnalyticsModal'
import EditAssignmentModal from '@/components/modals/EditAssignmentModal'
import ManageTestCasesModal from '@/components/modals/ManageTestCasesModal'
import { statsAPI, assignmentsAPI, batchesAPI } from '@/services/api'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [batches, setBatches] = useState([])
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

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [user, selectedBatch])

  const fetchData = async () => {
    if (!user?.instructor_id) return
    
    setLoading(true)
    try {
      // Fetch batches
      const batchesData = await batchesAPI.getByInstructor(user.instructor_id)
      setBatches(batchesData || [])
      if (batchesData && batchesData.length > 0 && !selectedBatch) {
        setSelectedBatch(batchesData[0].batch_id)
      }

      // Fetch stats
      if (selectedBatch) {
        const statsData = await statsAPI.getTeacherStats(user.instructor_id, selectedBatch)
        setStats({
          activeAssignments: statsData.activeAssignments || 0,
          studentsSubmitted: statsData.studentsSubmitted || '0/0',
          averageScore: statsData.averageScore || '0%',
          mightNeedHelp: statsData.mightNeedHelp || 0
        })

        // Fetch leaderboard
        const leaderboardData = await statsAPI.getLeaderboard(selectedBatch)
        setLeaderboard(leaderboardData || [])
      }

      // Fetch assignments
      const assignmentsData = await assignmentsAPI.getByInstructor(user.instructor_id)
      const activeAssignments = (assignmentsData || [])
        .filter(a => a.status === 'active')
        .slice(0, 3)
        .map(async (assignment) => {
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
      const resolvedAssignments = await Promise.all(activeAssignments)
      setAssignments(resolvedAssignments)
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

  const recentActivity = [] // TODO: Fetch from submissions
  const studentsNeedHelp = [] // TODO: Fetch from stats

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || 'Teacher'}!</h1>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  {selectedBatch 
                    ? `Batch ${batches.find(b => b.batch_id === selectedBatch)?.batch_name || selectedBatch}`
                    : 'Select Batch'}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {batches.map((batch) => (
                  <DropdownMenuItem 
                    key={batch.batch_id}
                    onClick={() => setSelectedBatch(batch.batch_id)}
                  >
                    {batch.batch_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
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
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  {getStatusDot(activity.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.name} {activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
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
              {studentsNeedHelp.map((student, index) => (
                <div
                  key={index}
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
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 ">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Batches
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Assignment Templates
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Full Analytics
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Bulk Email Students
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Assignments</CardTitle>
                <Button variant="link" className="text-sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active assignments</p>
              ) : (
                assignments.map((assignment, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
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
                    <Badge variant="success" className="ml-4">
                      {assignment.status}
                    </Badge>
                  </div>
                  {index === 0 && (
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
                      
                      <Button variant="outline" size="sm" className="outline-red-400 text-red-500 hover:bg-gray-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
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

