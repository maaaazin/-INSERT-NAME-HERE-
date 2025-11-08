import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'

// Teacher pages
import TeacherDashboard from '@/pages/teacher/Dashboard'
import TeacherAssignments from '@/pages/teacher/Assignments'
import TeacherLeaderboard from '@/pages/teacher/Leaderboard'
import TeacherStudentActivity from '@/pages/teacher/StudentActivity'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import StudentAssignments from '@/pages/student/Assignments'
import StudentLeaderboard from '@/pages/student/Leaderboard'
import StudentSubmissions from '@/pages/student/Submissions'
import AttemptAssignment from '@/pages/student/AttemptAssignment'

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Teacher Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <DashboardLayout>
                  <TeacherDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/assignments"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <DashboardLayout>
                  <TeacherAssignments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/leaderboard"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <DashboardLayout>
                  <TeacherLeaderboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/activity"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <DashboardLayout>
                  <TeacherStudentActivity />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <StudentAssignments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/leaderboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <StudentLeaderboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/submissions"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <StudentSubmissions />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments/:assignmentId/attempt"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <AttemptAssignment />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
