import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Download,
  Plus,
  Loader2
} from 'lucide-react'
import CreateAssignmentModal from '@/components/modals/CreateAssignmentModal'
import ViewAssignmentModal from '@/components/modals/ViewAssignmentModal'
import AnalyticsModal from '@/components/modals/AnalyticsModal'
import EditAssignmentModal from '@/components/modals/EditAssignmentModal'
import ManageTestCasesModal from '@/components/modals/ManageTestCasesModal'
import ViewSubmissionsModal from '@/components/modals/ViewSubmissionsModal'
import { assignmentsAPI, statsAPI } from '@/services/api'

const TeacherAssignments = () => {
  const { user } = useAuth()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [testCasesModalOpen, setTestCasesModalOpen] = useState(false)
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [user])

  const fetchAssignments = async () => {
    if (!user || user.role !== 'teacher') return
    setLoading(true)
    try {
      // Teachers can see all assignments, not just their own
      const data = await assignmentsAPI.getAll()
      const assignmentsWithStats = await Promise.all(
        (data || []).map(async (assignment) => {
          const stats = await statsAPI.getAssignmentStats(assignment.assignment_id)
          return {
            ...assignment,
            submissions: stats.submissions || '0/0',
            avgScore: stats.averageScore || '0%',
            dueDate: new Date(assignment.due_date).toLocaleDateString(),
            createdAt: new Date(assignment.created_at).toLocaleDateString()
          }
        })
      )
      setAssignments(assignmentsWithStats)
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    try {
      await assignmentsAPI.delete(assignmentId)
      fetchAssignments()
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment')
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No assignments found. Create your first assignment!
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.assignment_id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-xl">{assignment.title}</h3>
                    <Badge variant={assignment.status === 'active' ? 'success' : 'secondary'}>
                      {assignment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                    <span>Language: {assignment.language}</span>
                    <span>Due: {assignment.dueDate}</span>
                    <span>Created: {assignment.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-700">
                      <strong>{assignment.submissions}</strong> submissions
                    </span>
                    <span className="text-gray-700">
                      Average Score: <strong>{assignment.avgScore}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setViewModalOpen(true)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    size="sm"
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setSubmissionsModalOpen(true)
                    }}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Submissions
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
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
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setTestCasesModalOpen(true)
                    }}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Test Cases
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(assignment.assignment_id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <CreateAssignmentModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchAssignments}
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
        onSuccess={fetchAssignments}
      />
      <ManageTestCasesModal 
        open={testCasesModalOpen} 
        onOpenChange={setTestCasesModalOpen} 
      />
      <ViewSubmissionsModal 
        open={submissionsModalOpen} 
        onOpenChange={setSubmissionsModalOpen}
        assignment={selectedAssignment}
      />
    </div>
  )
}

export default TeacherAssignments

