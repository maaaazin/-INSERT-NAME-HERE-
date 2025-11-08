import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertCircle, Send, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { submissionsAPI } from '@/services/api'

const TeacherStudentActivity = () => {
  const { user } = useAuth()
  const [recentActivity, setRecentActivity] = useState([])
  const [studentsNeedHelp, setStudentsNeedHelp] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivity()
  }, [user])

  const fetchActivity = async () => {
    setLoading(true)
    try {
      // Fetch all recent submissions
      const submissions = await submissionsAPI.getAll()
      
      // Process recent activity (last 10 submissions)
      const recent = (submissions || [])
        .slice(0, 10)
        .map(sub => {
          const submittedAt = new Date(sub.submitted_at)
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
            assignment: sub.assignments?.title || 'Unknown Assignment',
            time: timeAgo,
            status
          }
        })

      setRecentActivity(recent)

      // Students who might need help (simplified - would need more complex logic)
      setStudentsNeedHelp([])
    } catch (error) {
      console.error('Error fetching activity:', error)
      setRecentActivity([])
      setStudentsNeedHelp([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusDot = (status) => {
    const colors = {
      success: 'bg-green-500',
      info: 'bg-blue-500',
      error: 'bg-red-500',
    }
    return <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-gray-500'}`} />
  }

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (status === 'error') return <XCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-blue-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="w-8 h-8" />
          Student Activity
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
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
                <p className="text-center text-gray-500 py-8">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  {getStatusDot(activity.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      <span className="font-semibold">{activity.name}</span> {activity.action} <span className="text-gray-600">{activity.assignment}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(activity.status)}
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Students Need Help */}
        <div className="lg:col-span-1">
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
                  key={student.id}
                  className={`p-4 rounded-lg border ${
                    student.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <p className="font-semibold text-sm mb-1">{student.name}</p>
                  <p className="text-xs text-gray-600 mb-1">{student.issue}</p>
                  <p className="text-xs text-gray-500 mb-2">Last activity: {student.lastActivity}</p>
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
      </div>
    </div>
  )
}

export default TeacherStudentActivity

