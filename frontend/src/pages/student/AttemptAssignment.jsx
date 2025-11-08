import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import { Play, Send, ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { assignmentsAPI, testCasesAPI, submissionsAPI } from '@/services/api'

const AttemptAssignment = () => {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [assignment, setAssignment] = useState(null)
  const [testCases, setTestCases] = useState([])
  const [loading, setLoading] = useState(true)

  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState([])
  const [submissionCount, setSubmissionCount] = useState(0)

  useEffect(() => {
    fetchAssignment()
  }, [assignmentId])

  const fetchAssignment = async () => {
    setLoading(true)
    try {
      const assignmentData = await assignmentsAPI.getById(assignmentId)
      setAssignment(assignmentData)
      
      // Set default code based on language
      const defaultCode = assignmentData.language === 'python' 
        ? '# Write your solution here\n\n'
        : assignmentData.language === 'javascript'
        ? '// Write your solution here\n\n'
        : '// Write your solution here\n\n'
      setCode(defaultCode)

      // Fetch test cases - show all public test cases
      const testCasesData = await testCasesAPI.getByAssignment(assignmentId)
      const publicTestCases = (testCasesData || []).filter(tc => tc.is_public)
      setTestCases(publicTestCases)

      // Fetch current submission count
      if (user?.student_id) {
        try {
          const submissions = await submissionsAPI.getByStudent(user.student_id)
          const count = (submissions || []).filter(s => s.assignment_id === parseInt(assignmentId)).length
          setSubmissionCount(count)
        } catch (error) {
          console.error('Error fetching submission count:', error)
        }
      }
    } catch (error) {
      console.error('Error fetching assignment:', error)
      alert('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleRunCode = async () => {
    if (!code.trim()) {
      alert('Please write some code first')
      return
    }

    setIsRunning(true)
    setOutput('Running code...')
    
    try {
      const result = await submissionsAPI.executeAndSubmit({
        assignment_id: parseInt(assignmentId),
        code,
        language: assignment.language,
        runOnly: true
      })
      setOutput(result.output || result.error || 'No output')
    } catch (error) {
      console.error('Error running code:', error)
      setOutput(`Error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code first')
      return
    }

    if (!user?.student_id) {
      alert('Student ID not found')
      return
    }

    setIsRunning(true)
    setOutput('Submitting...')
    
    try {
      const result = await submissionsAPI.executeAndSubmit({
        assignment_id: parseInt(assignmentId),
        student_id: user.student_id,
        code,
        language: assignment.language,
        runOnly: false
      })

      // Handle queue mode response
      if (result.status === 'queued' && result.jobId) {
        setOutput(`⏳ Submission queued for processing (Job ID: ${result.jobId})\n\nYour submission is being processed. Please check back in a moment.`)
        // Optionally poll for status (can be implemented later)
        return
      }
      
      // Update test results with detailed information (synchronous mode)
      if (result.testResults && result.testResults.testResults) {
        const detailedResults = result.testResults.testResults.map(tr => ({
          testCaseId: tr.testCaseId,
          passed: tr.passed,
          input: tr.input,
          expectedOutput: tr.expectedOutput,
          actualOutput: tr.actualOutput,
          error: tr.error,
          comparisonDetails: tr.comparisonDetails,
          runtime: tr.runtime,
          memory: tr.memory
        }))
        setTestResults(detailedResults)
        
        // Update output with detailed status including average score
        const passedCount = result.testResults.passedTests || 0
        const totalCount = result.testResults.totalTests || 0
        const status = result.testResults.status || 'failed'
        const score = result.score || 0
        const averagePercentage = result.averagePercentage || score
        const totalSubmissions = result.totalSubmissions || 1
        setSubmissionCount(totalSubmissions) // Update submission count
        
        let outputMessage = ''
        if (status === 'accepted') {
          outputMessage = `✅ All ${totalCount} test cases passed!`
        } else {
          outputMessage = `❌ ${passedCount}/${totalCount} test cases passed.`
        }
        
        outputMessage += `\n📊 This submission: ${score}%`
        
        if (totalSubmissions > 1) {
          outputMessage += `\n📈 Average score: ${averagePercentage}% (from ${totalSubmissions} submissions)`
          const remainingSubmissions = Math.max(0, 3 - totalSubmissions)
          if (remainingSubmissions > 0) {
            outputMessage += `\n💡 You have ${remainingSubmissions} resubmission(s) remaining (max 3 total)`
          } else {
            outputMessage += `\n⚠️ You have reached the maximum of 3 submissions for this assignment.`
          }
        } else {
          outputMessage += `\n💡 You have 2 resubmission(s) remaining (max 3 total)`
        }
        
        setOutput(outputMessage)
      } else {
        setOutput(result.message || 'Submission completed')
      }

      // Don't auto-navigate - let user see the results
      // User can manually navigate to submissions page if needed
    } catch (error) {
      console.error('Error submitting:', error)
      // Check if it's a rate limit error
      if (error.message && (error.message.includes('Too many') || error.message.includes('rate limit'))) {
        setOutput(`⏱️ ${error.message}\n\nPlease wait a moment before submitting again.`)
      } else if (error.message && error.message.includes('Maximum resubmission limit')) {
        setOutput(`❌ ${error.message}\n\nYou have reached the maximum of 3 submissions for this assignment.`)
      } else {
      setOutput(`Error: ${error.message}`)
      }
    } finally {
      setIsRunning(false)
    }
  }

  const getLanguageForEditor = (lang) => {
    const langMap = {
      'python': 'python',
      'javascript': 'javascript',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c'
    }
    return langMap[lang?.toLowerCase()] || 'python'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Assignment not found</p>
          <Button onClick={() => navigate('/student/assignments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/student/assignments')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{assignment.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{assignment.language}</Badge>
                {submissionCount > 0 && (
                  <Badge variant={submissionCount >= 3 ? "destructive" : "outline"}>
                    {submissionCount}/3 submissions
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRunCode}
              disabled={isRunning}
            >
              <Play className="w-4 h-4 mr-2" />
              Run Code
            </Button>
            <Button
              className={`${
                submissionCount >= 3 
                  ? 'bg-gray-500 hover:bg-gray-600 cursor-not-allowed' 
                  : submissionCount > 0 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-green-600 hover:bg-green-700'
              } text-white`}
              onClick={handleSubmit}
              disabled={isRunning || submissionCount >= 3}
              title={submissionCount >= 3 ? "Maximum of 3 submissions reached" : ""}
            >
              <Send className="w-4 h-4 mr-2" />
              {submissionCount >= 3 ? "Limit Reached" : submissionCount > 0 ? "Resubmit" : "Submit"}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Problem Description */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Problem Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{assignment.description || 'No description provided'}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Code Editor */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Code Editor</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] border-t">
                  <Editor
                    height="500px"
                    language={getLanguageForEditor(assignment.language || 'python')}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-light"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Output */}
            {output && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
                    {output}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Test Cases - Below both columns */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testCases.length === 0 ? (
                <p className="text-center text-gray-500 col-span-2 py-4">No test cases available</p>
              ) : (
                testCases.map((testCase, index) => {
                const result = testResults.find(r => r.testCaseId === testCase.test_case_id)
                return (
                  <div key={testCase.test_case_id || index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Test Case {testCase.test_case_id || index + 1}</h4>
                      {result ? (
                        result.passed ? (
                          <Badge className="bg-green-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Passed
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </Badge>
                        )
                      ) : (
                        <Badge variant="secondary">Not Tested</Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Input:</p>
                        <pre className="bg-gray-100 p-2 rounded text-xs font-mono whitespace-pre-wrap">
                          {testCase.input_data}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Expected Output:</p>
                        <pre className="bg-gray-100 p-2 rounded text-xs font-mono whitespace-pre-wrap">
                          {testCase.expected_output}
                        </pre>
                      </div>
                      {result && (
                        <>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Your Output:</p>
                            <pre className={`p-2 rounded text-xs font-mono whitespace-pre-wrap ${
                              result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                            }`}>
                              {result.actualOutput || result.error || 'No output'}
                            </pre>
                          </div>
                          {result.error && (
                            <div>
                              <p className="text-xs text-red-600 mb-1">Error:</p>
                              <pre className="bg-red-50 p-2 rounded text-xs font-mono whitespace-pre-wrap text-red-700">
                                {result.error}
                              </pre>
                            </div>
                          )}
                          {result.runtime && (
                            <p className="text-xs text-gray-500">Runtime: {Math.round(result.runtime)}ms</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              }))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AttemptAssignment

