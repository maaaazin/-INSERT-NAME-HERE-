import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { History, Code, Calendar, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { submissionsAPI } from '@/services/api'

const StudentSubmissions = () => {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    averageScore: 0,
    accepted: 0
  })

  useEffect(() => {
    fetchSubmissions()
  }, [user])

  const fetchSubmissions = async () => {
    if (!user?.student_id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await submissionsAPI.getByStudent(user.student_id)
      
      const processed = (data || []).map(sub => {
        const score = sub.max_score ? Math.round((sub.score / sub.max_score) * 100) : 0
        let status = 'failed'
        if (sub.status === 'graded' && score === 100) {
          status = 'accepted'
        } else if (sub.status === 'graded' && score > 0) {
          status = 'partial'
        }

        return {
          id: sub.submission_id,
          assignment: sub.assignments?.title || 'Unknown Assignment',
          submittedAt: new Date(sub.submitted_at).toLocaleString(),
          score: `${score}%`,
          status,
          language: sub.language,
          runtime: sub.avg_execution_time ? `${Math.round(sub.avg_execution_time)}ms` : 'N/A',
          memory: 'N/A', // Not stored in current schema
          testCases: 'N/A' // Would need to fetch from test_results
        }
      })

      setSubmissions(processed)

      // Calculate stats
      const total = processed.length
      const avgScore = total > 0 
        ? Math.round(processed.reduce((sum, s) => sum + parseInt(s.score), 0) / total)
        : 0
      const accepted = processed.filter(s => s.status === 'accepted').length

      setStats({ total, averageScore: avgScore, accepted })
    } catch (error) {
      console.error('Error fetching submissions:', error)
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      'accepted': { variant: 'success', label: 'Accepted', icon: CheckCircle2 },
      'partial': { variant: 'secondary', label: 'Partial', icon: Clock },
      'failed': { variant: 'destructive', label: 'Failed', icon: XCircle },
    }
    const config = variants[status] || variants['failed']
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <History className="w-8 h-8" />
        Recent Submissions
      </h1>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : `${stats.averageScore}%`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : stats.accepted}
                </p>
              </CardContent>
            </Card>
          </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Test Cases</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : submissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No submissions yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.assignment}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Code className="w-4 h-4" />
                      {submission.language}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {submission.submittedAt}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{submission.score}</TableCell>
                  <TableCell className="text-sm">{submission.testCases}</TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentSubmissions

