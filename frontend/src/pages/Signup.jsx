import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { batchesAPI } from '@/services/api'

const API_BASE_URL = 'http://localhost:3000/api'

const Signup = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'student',
    roll_no: '',
    batch_id: ''
  })
  const [error, setError] = useState('')

  // Fetch batches when role is student
  useEffect(() => {
    if (formData.role === 'student') {
      fetchBatches()
    } else {
      setBatches([])
      setFormData(prev => ({ ...prev, batch_id: '' }))
    }
  }, [formData.role])

  const fetchBatches = async () => {
    setLoadingBatches(true)
    try {
      const data = await batchesAPI.getAll()
      setBatches(data || [])
    } catch (error) {
      console.error('Error fetching batches:', error)
      // Don't show error to user, just log it - batches are optional
    } finally {
      setLoadingBatches(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.role === 'student' && !formData.roll_no) {
      setError('Roll number is required for students')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          roll_no: formData.role === 'student' ? formData.roll_no : undefined,
          batch_id: formData.role === 'student' && formData.batch_id ? parseInt(formData.batch_id) : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Store token and user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Navigate based on role
      if (data.user.role === 'teacher') {
        navigate('/teacher/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Sign up to get started with Codemia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </Select>
            </div>

            {formData.role === 'student' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="roll_no">Roll Number</Label>
                  <Input
                    id="roll_no"
                    type="text"
                    placeholder="Enter your roll number"
                    value={formData.roll_no}
                    onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch_id">Batch (Optional)</Label>
                  {loadingBatches ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading batches...
                    </div>
                  ) : (
                    <Select
                      id="batch_id"
                      value={formData.batch_id}
                      onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    >
                      <option value="">Select a batch (optional)</option>
                      {batches.map((batch) => (
                        <option key={batch.batch_id} value={batch.batch_id}>
                          {batch.batch_name} {batch.academic_year ? `(${batch.academic_year})` : ''}
                        </option>
                      ))}
                    </Select>
                  )}
                  {batches.length === 0 && !loadingBatches && (
                    <p className="text-xs text-gray-500 mt-1">
                      No batches available. You can join a batch later or leave this empty.
                    </p>
                  )}
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Signup

