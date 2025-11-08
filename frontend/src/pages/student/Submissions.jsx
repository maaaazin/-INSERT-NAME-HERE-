import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { History, Code, Calendar, CheckCircle2, XCircle, Clock, Loader2, Eye, FileText } from 'lucide-react'
import { submissionsAPI } from '@/services/api'

const StudentSubmissions = () => {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
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
        } else if (sub.status === 'error') {
          status = 'error'
        } else if (sub.status === 'pending') {
          status = 'pending'
        }

        // Calculate test case stats
        const testResults = sub.testResults || []
        const passedTests = testResults.filter(tr => tr.passed).length
        const totalTests = testResults.length
        const testCasesDisplay = totalTests > 0 
          ? `${passedTests}/${totalTests} passed`
          : 'N/A'

        return {
          id: sub.submission_id,
          assignment: sub.assignments?.title || 'Unknown Assignment',
          submittedAt: new Date(sub.submitted_at || sub.created_at).toLocaleString(),
          score: `${score}%`,
          status,
          language: sub.language,
          runtime: sub.avg_execution_time ? `${Math.round(sub.avg_execution_time)}ms` : 'N/A',
          code: sub.code || '',
          testResults: testResults,
          testCases: testCasesDisplay,
          passedTests,
          totalTests,
          rawScore: sub.score,
          maxScore: sub.max_score
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
      'error': { variant: 'destructive', label: 'Error', icon: XCircle },
      'pending': { variant: 'secondary', label: 'Pending', icon: Clock },
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
        My Submissions
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
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
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Submission Details Dialog */}
      {selectedSubmission && (
        <Dialog 
          open={selectedSubmission !== null} 
          onOpenChange={(open) => !open && setSelectedSubmission(null)}
          maxWidth="max-w-4xl"
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Submission Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Assignment</p>
                  <p className="font-semibold">{selectedSubmission.assignment}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Language</p>
                  <p className="font-semibold">{selectedSubmission.language}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted At</p>
                  <p className="font-semibold">{selectedSubmission.submittedAt}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="font-semibold">
                    {selectedSubmission.rawScore}/{selectedSubmission.maxScore} ({selectedSubmission.score})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Test Cases</p>
                  <p className="font-semibold">
                    {selectedSubmission.passedTests}/{selectedSubmission.totalTests} passed
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(selectedSubmission.status)}
                </div>
              </div>

              {/* Code */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Submitted Code</p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {selectedSubmission.code}
                  </pre>
                </div>
              </div>

              {/* Test Results */}
              {selectedSubmission.testResults && selectedSubmission.testResults.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Test Case Results</p>
                  <div className="space-y-2">
                    {selectedSubmission.testResults.map((testResult, index) => (
                      <Card key={index} className={testResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {testResult.passed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className="font-semibold">
                                Test Case {index + 1}
                              </span>
                            </div>
                            <Badge variant={testResult.passed ? 'success' : 'destructive'}>
                              {testResult.status || (testResult.passed ? 'Passed' : 'Failed')}
                            </Badge>
                          </div>
                          {testResult.error_message && (
                            <div className="mb-2">
                              <p className="text-sm font-semibold text-red-600">Error:</p>
                              <p className="text-sm text-gray-700">{testResult.error_message}</p>
                            </div>
                          )}
                          {testResult.actual_output && (
                            <div className="mb-2">
                              <p className="text-sm font-semibold">Actual Output:</p>
                              <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                                {testResult.actual_output}
                              </pre>
                            </div>
                          )}
                          <div className="flex gap-4 text-xs text-gray-600">
                            {testResult.execution_time && (
                              <span>Runtime: {Math.round(testResult.execution_time)}ms</span>
                            )}
                            {testResult.memory_used && (
                              <span>Memory: {testResult.memory_used}KB</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default StudentSubmissions
