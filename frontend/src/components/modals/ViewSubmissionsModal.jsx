import React, { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, CheckCircle2, XCircle, AlertCircle, Loader2, FileSearch } from 'lucide-react'
import { submissionsAPI, plagiarismAPI } from '@/services/api'
import PlagiarismCheckModal from './PlagiarismCheckModal'

const ViewSubmissionsModal = ({ open, onOpenChange, assignment }) => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [plagiarismModalOpen, setPlagiarismModalOpen] = useState(false)
  const [selectedSubmissions, setSelectedSubmissions] = useState([])
  const [plagiarismResult, setPlagiarismResult] = useState(null)
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false)

  useEffect(() => {
    if (open && assignment) {
      fetchSubmissions()
    }
  }, [open, assignment])

  const fetchSubmissions = async () => {
    if (!assignment?.assignment_id) return
    setLoading(true)
    try {
      const data = await submissionsAPI.getByAssignment(assignment.assignment_id)
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
      alert('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckPlagiarism = async (submissionId1, submissionId2) => {
    setCheckingPlagiarism(true)
    try {
      const result = await plagiarismAPI.compare(submissionId1, submissionId2)
      setPlagiarismResult(result)
      setSelectedSubmissions([
        { submission_id: submissionId1 },
        { submission_id: submissionId2 }
      ])
      setPlagiarismModalOpen(true)
    } catch (error) {
      console.error('Error checking plagiarism:', error)
      alert('Failed to check plagiarism')
    } finally {
      setCheckingPlagiarism(false)
    }
  }

  const getStatusBadge = (status, score, maxScore) => {
    const percentage = maxScore ? Math.round((score / maxScore) * 100) : 0
    
    if (status === 'graded' && percentage === 100) {
      return <Badge className="bg-green-500">Perfect</Badge>
    } else if (status === 'graded' && percentage >= 60) {
      return <Badge className="bg-blue-500">Passed</Badge>
    } else if (status === 'graded' && percentage > 0) {
      return <Badge className="bg-yellow-500">Partial</Badge>
    } else if (status === 'graded') {
      return <Badge className="bg-red-500">Failed</Badge>
    } else if (status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>
    } else {
      return <Badge className="bg-gray-500">Error</Badge>
    }
  }

  if (!assignment) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle>Submissions: {assignment.title}</DialogTitle>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No submissions found for this assignment
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Total Submissions: <strong>{submissions.length}</strong>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setCheckingPlagiarism(true)
                    try {
                      const result = await plagiarismAPI.checkAssignment(assignment.assignment_id)
                      alert(`Found ${result.pairs_found} potential plagiarism pair(s)`)
                    } catch (error) {
                      console.error('Error checking assignment plagiarism:', error)
                      alert('Failed to check plagiarism')
                    } finally {
                      setCheckingPlagiarism(false)
                    }
                  }}
                  disabled={checkingPlagiarism || submissions.length < 2}
                >
                  {checkingPlagiarism ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileSearch className="w-4 h-4 mr-2" />
                  )}
                  Check All for Plagiarism
                </Button>
              </div>

              {submissions.map((submission, index) => (
                <Card key={submission.submission_id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">
                            {submission.students?.users?.name || 'Unknown Student'}
                          </h4>
                          {getStatusBadge(submission.status, submission.score, submission.max_score)}
                          {submission.students?.roll_no && (
                            <Badge variant="outline">
                              Roll: {submission.students.roll_no}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>
                            Score: <strong>{submission.score || 0}</strong>/{submission.max_score || 100}
                          </span>
                          <span>
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </span>
                          {submission.avg_execution_time && (
                            <span>
                              Avg Time: {submission.avg_execution_time.toFixed(2)}ms
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded mt-2 max-h-32 overflow-y-auto">
                          {submission.code?.substring(0, 200)}
                          {submission.code?.length > 200 && '...'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Compare with other submissions
                            const otherSubmissions = submissions.filter(
                              s => s.submission_id !== submission.submission_id
                            )
                            if (otherSubmissions.length > 0) {
                              // Show a simple selection or compare with first other submission
                              handleCheckPlagiarism(
                                submission.submission_id,
                                otherSubmissions[0].submission_id
                              )
                            }
                          }}
                          disabled={submissions.length < 2}
                          title="Check plagiarism with other submissions"
                        >
                          <FileSearch className="w-4 h-4 mr-1" />
                          Check Plag
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Plagiarism comparison helper */}
              {submissions.length >= 2 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Quick Plagiarism Check:</p>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const pairs = []
                      const limitedSubs = submissions.slice(0, 5)
                      for (let i = 0; i < limitedSubs.length; i++) {
                        for (let j = i + 1; j < limitedSubs.length; j++) {
                          pairs.push([limitedSubs[i], limitedSubs[j]])
                        }
                      }
                      return pairs.map(([sub1, sub2]) => (
                        <Button
                          key={`${sub1.submission_id}-${sub2.submission_id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckPlagiarism(sub1.submission_id, sub2.submission_id)}
                          disabled={checkingPlagiarism}
                        >
                          {sub1.students?.users?.name?.split(' ')[0] || 'S1'} vs{' '}
                          {sub2.students?.users?.name?.split(' ')[0] || 'S2'}
                        </Button>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PlagiarismCheckModal
        open={plagiarismModalOpen}
        onOpenChange={setPlagiarismModalOpen}
        result={plagiarismResult}
        submissions={selectedSubmissions}
      />
    </>
  )
}

export default ViewSubmissionsModal

