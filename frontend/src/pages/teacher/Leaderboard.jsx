import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Medal, Download, Loader2, ChevronDown } from 'lucide-react'
import { statsAPI, batchesAPI } from '@/services/api'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const TeacherLeaderboard = () => {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [batches, setBatches] = useState([])

  useEffect(() => {
    fetchBatches()
  }, [user])

  useEffect(() => {
    if (selectedBatch) {
      fetchLeaderboard()
    }
  }, [user, selectedBatch])

  const fetchBatches = async () => {
    if (!user?.instructor_id) return
    try {
      const batchesData = await batchesAPI.getByInstructor(user.instructor_id)
      setBatches(batchesData || [])
      if (batchesData && batchesData.length > 0 && !selectedBatch) {
        setSelectedBatch(batchesData[0].batch_id)
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
    }
  }

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const data = await statsAPI.getLeaderboard(selectedBatch || null)
      
      const processed = (data || []).map((student, index) => ({
        rank: student.rank || index + 1,
        name: student.name,
        score: `${student.score}%`,
        submissions: student.submissions || 0,
        medal: index < 3 ? ['gold', 'silver', 'bronze'][index] : null
      }))
      
      setLeaderboard(processed)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLeaderboard([])
    } finally {
      setLoading(false)
    }
  }

  const getMedalIcon = (medal) => {
    if (medal === 'gold') return <Medal className="w-5 h-5 text-yellow-500" />
    if (medal === 'silver') return <Medal className="w-5 h-5 text-gray-400" />
    if (medal === 'bronze') return <Medal className="w-5 h-5 text-amber-600" />
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Leaderboard
        </h1>
        <div className="flex items-center gap-2">
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No leaderboard data available
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((student) => (
                <TableRow key={student.rank}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMedalIcon(student.medal)}
                      <span className="font-semibold">{student.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="font-semibold">{student.score}</TableCell>
                  <TableCell>{student.submissions}</TableCell>
                  <TableCell>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${parseInt(student.score)}%` }} 
                      />
                    </div>
                  </TableCell>
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

export default TeacherLeaderboard

