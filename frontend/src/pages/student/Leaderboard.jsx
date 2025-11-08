import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Medal, Loader2 } from 'lucide-react'
import { statsAPI } from '@/services/api'

const StudentLeaderboard = () => {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [user])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      // Fetch leaderboard - if user has batch_id, use it, otherwise get all
      const data = await statsAPI.getLeaderboard(user?.batch_id || null)
      
      const processed = (data || []).map((student, index) => ({
        rank: student.rank || index + 1,
        name: student.name,
        score: `${student.score}%`,
        submissions: student.submissions || 0,
        medal: index < 3 ? ['gold', 'silver', 'bronze'][index] : null,
        isCurrentUser: student.student_id === user?.student_id
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
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Trophy className="w-8 h-8 text-yellow-500" />
        Leaderboard
      </h1>

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
                leaderboard.map((student) => (
                <TableRow 
                  key={student.rank} 
                  className={student.isCurrentUser ? 'bg-blue-50 font-semibold' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMedalIcon(student.medal)}
                      <span className="font-semibold">{student.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.isCurrentUser ? `${student.name} (You)` : student.name}
                  </TableCell>
                  <TableCell className={student.isCurrentUser ? 'text-blue-600 font-bold' : ''}>
                    {student.score}
                  </TableCell>
                  <TableCell>{student.submissions}</TableCell>
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

export default StudentLeaderboard

