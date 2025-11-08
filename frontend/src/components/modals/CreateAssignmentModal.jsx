import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Calendar, Plus, Loader2 } from 'lucide-react'
import { assignmentsAPI, batchesAPI } from '@/services/api'

const CreateAssignmentModal = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [showCreateBatch, setShowCreateBatch] = useState(false)
  const [newBatchName, setNewBatchName] = useState('')
  const [newBatchYear, setNewBatchYear] = useState('')
  const [creatingBatch, setCreatingBatch] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    language: 'python',
    deadline: '',
    batch_id: '',
    description: '',
    status: 'draft'
  })

  useEffect(() => {
    if (open && user?.instructor_id) {
      fetchBatches()
    }
  }, [open, user])

  const fetchBatches = async () => {
    setLoadingBatches(true)
    try {
      const data = await batchesAPI.getByInstructor(user.instructor_id)
      setBatches(data || [])
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, batch_id: data[0].batch_id }))
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
    } finally {
      setLoadingBatches(false)
    }
  }

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      alert('Please enter a batch name')
      return
    }

    if (!user?.instructor_id) {
      alert('Instructor ID not found. Please log in again.')
      return
    }

    setCreatingBatch(true)
    try {
      const newBatch = await batchesAPI.create({
        batch_name: newBatchName,
        instructor_id: user.instructor_id,
        academic_year: newBatchYear || null
      })
      
      // Refresh batches list
      await fetchBatches()
      
      // Select the newly created batch
      setFormData(prev => ({ ...prev, batch_id: newBatch.batch_id }))
      
      // Reset form
      setNewBatchName('')
      setNewBatchYear('')
      setShowCreateBatch(false)
    } catch (error) {
      console.error('Error creating batch:', error)
      const errorMessage = error.message || 'Failed to create batch. Please try again.'
      alert(errorMessage)
    } finally {
      setCreatingBatch(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.instructor_id || !formData.batch_id) {
      alert('Please select a batch')
      return
    }

    setLoading(true)
    try {
      await assignmentsAPI.create({
        title: formData.title,
        description: formData.description,
        batch_id: parseInt(formData.batch_id),
        instructor_id: user.instructor_id,
        language: formData.language,
        due_date: new Date(formData.deadline).toISOString(),
        status: formData.status
      })
      onOpenChange(false)
      if (onSuccess) onSuccess()
      // Reset form
      setFormData({
        title: '',
        language: 'python',
        deadline: '',
        batch_id: batches.length > 0 ? batches[0].batch_id : '',
        description: '',
        status: 'draft'
      })
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Create New Assignment</DialogTitle>
        <DialogClose onClick={() => onOpenChange(false)} />
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                placeholder="e.g., Array Manipulation Basics"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="c">C</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <div className="relative">
                <Input
                  id="deadline"
                  type="datetime-local"
                  placeholder="dd/mm/yyyy, --:--"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="batch">Batch</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateBatch(!showCreateBatch)}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {showCreateBatch ? 'Cancel' : 'Create Batch'}
                </Button>
              </div>
              
              {showCreateBatch ? (
                <div className="space-y-2 p-3 border rounded-md bg-gray-50">
                  <Input
                    placeholder="Batch name (e.g., Batch B1)"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                  />
                  <Input
                    placeholder="Academic year (optional, e.g., 2024-2025)"
                    value={newBatchYear}
                    onChange={(e) => setNewBatchYear(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateBatch}
                    disabled={creatingBatch || !newBatchName.trim()}
                    className="w-full"
                  >
                    {creatingBatch ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Batch'
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {loadingBatches ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading batches...
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-yellow-800">
                      No batches found. Click "Create Batch" above to create one.
                    </div>
                  ) : (
                    <Select
                      id="batch"
                      value={formData.batch_id}
                      onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                      className="border-orange-500"
                      required
                    >
                      <option value="">Select a batch</option>
                      {batches.map((batch) => (
                        <option key={batch.batch_id} value={batch.batch_id}>
                          {batch.batch_name} {batch.academic_year ? `(${batch.academic_year})` : ''}
                        </option>
                      ))}
                    </Select>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-y"
                placeholder="Assignment instructions..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? 'Creating...' : 'Create Assignment'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

export default CreateAssignmentModal

