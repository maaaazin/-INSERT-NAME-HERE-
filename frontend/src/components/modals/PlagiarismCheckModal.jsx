import React from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

const PlagiarismCheckModal = ({ open, onOpenChange, result, submissions }) => {
  if (!result) return null

  const getSimilarityColor = (similarity) => {
    if (similarity >= 90) return 'text-red-600 bg-red-50'
    if (similarity >= 80) return 'text-orange-600 bg-orange-50'
    if (similarity >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getSimilarityIcon = (similarity) => {
    if (similarity >= 80) return <AlertTriangle className="w-5 h-5 text-red-600" />
    if (similarity >= 60) return <XCircle className="w-5 h-5 text-yellow-600" />
    return <CheckCircle2 className="w-5 h-5 text-green-600" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Plagiarism Check Result</DialogTitle>
        <DialogClose onClick={() => onOpenChange(false)} />
      </DialogHeader>
      <DialogContent className="max-w-3xl">
        <div className="space-y-6">
          {/* Similarity Score */}
          <Card className={getSimilarityColor(result.similarity)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSimilarityIcon(result.similarity)}
                  <div>
                    <p className="text-sm font-medium">Similarity Score</p>
                    <p className="text-3xl font-bold">{result.similarity}%</p>
                  </div>
                </div>
                <div>
                  {result.isPlagiarized ? (
                    <Badge className="bg-red-600">Possible Plagiarism</Badge>
                  ) : (
                    <Badge className="bg-green-600">Likely Original</Badge>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm">{result.message}</p>
              <p className="mt-2 text-xs opacity-75">
                Threshold: {result.threshold}%
              </p>
            </CardContent>
          </Card>

          {/* Submission Details */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Submission 1</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Student:</strong> {result.submission1?.student_name || 'Unknown'}
                  </p>
                  <p>
                    <strong>Roll No:</strong> {result.submission1?.roll_no || 'N/A'}
                  </p>
                  <p>
                    <strong>Email:</strong> {result.submission1?.student_email || 'N/A'}
                  </p>
                  <p>
                    <strong>Submitted:</strong>{' '}
                    {result.submission1?.submitted_at
                      ? new Date(result.submission1.submitted_at).toLocaleString()
                      : 'N/A'}
                  </p>
                  <p>
                    <strong>ID:</strong> {result.submission1?.submission_id || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Submission 2</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Student:</strong> {result.submission2?.student_name || 'Unknown'}
                  </p>
                  <p>
                    <strong>Roll No:</strong> {result.submission2?.roll_no || 'N/A'}
                  </p>
                  <p>
                    <strong>Email:</strong> {result.submission2?.student_email || 'N/A'}
                  </p>
                  <p>
                    <strong>Submitted:</strong>{' '}
                    {result.submission2?.submitted_at
                      ? new Date(result.submission2.submitted_at).toLocaleString()
                      : 'N/A'}
                  </p>
                  <p>
                    <strong>ID:</strong> {result.submission2?.submission_id || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Normalized Code Preview */}
          {(result.normalizedCode1 || result.normalizedCode2) && (
            <div className="space-y-4">
              <h4 className="font-semibold">Normalized Code Preview</h4>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                      {result.normalizedCode1 || 'N/A'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                      {result.normalizedCode2 || 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Warning */}
          {result.isPlagiarized && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">High Similarity Detected</p>
                  <p className="text-sm text-red-700 mt-1">
                    These submissions show {result.similarity}% similarity, which exceeds the
                    threshold of {result.threshold}%. Please review both submissions manually
                    to determine if plagiarism has occurred.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PlagiarismCheckModal

