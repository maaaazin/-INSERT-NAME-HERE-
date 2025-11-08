import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  LayoutDashboard,
  FileText, 
  Trophy, 
  Activity, 
  History,
  LogOut,
  User
} from 'lucide-react'

const Navbar = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const teacherNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'activity', label: 'Student Activity', icon: Activity },
  ]

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'leaderboard', label: 'View Leaderboard', icon: Trophy },
    { id: 'submissions', label: 'Recent Submissions', icon: History },
  ]

  const navItems = user?.role === 'teacher' ? teacherNavItems : studentNavItems
  const roleLabel = user?.role === 'teacher' ? 'Teacher' : 'Student'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - Left */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Codemia</h1>
          </div>

          {/* Navigation Links - Center */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`flex items-center gap-2 ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => onPageChange(item.id)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              )
            })}
          </div>

          {/* User Profile and Logout - Right */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {user?.name || 'User'}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {roleLabel}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-700 hover:text-gray-900"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

