'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { logout } from '@/lib/redux/slices/authSlice'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Settings } from 'lucide-react'
import { toast } from 'sonner'

export function Navbar() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  
  // Get Auth State from Redux
  const { user } = useAppSelector((state) => state.auth)
  const role = user?.role

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  if (!user) return null

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    router.push('/login')
  }

  // Safe fallback for name
  const displayName = user.full_name || user.email || 'User'
  
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Correct dashboard paths based on your routing structure
  const dashboardPath = role === 'admin' ? '/admin' : '/dashboard'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link href={dashboardPath} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all group-hover:scale-105">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Exam System
              </h1>
              <p className="text-xs text-gray-500 -mt-0.5">Online Management</p>
            </div>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700 capitalize">{role}</span>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-full hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all">
                  <Avatar className="h-11 w-11 border-2 border-gray-200">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-base font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-gray-200">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 overflow-hidden">
                      <p className="text-sm font-semibold leading-none truncate">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full w-fit capitalize font-medium">
                        {role}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="cursor-pointer p-3 rounded-lg">
                  <Link href={dashboardPath} className="flex items-center">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer p-3 rounded-lg">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer p-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                    <LogOut className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}