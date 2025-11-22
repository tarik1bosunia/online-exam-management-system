"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/lib/redux/hooks'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  
  // Access Auth State
  const { token, user } = useAppSelector((state) => state.auth)
  const isAuthenticated = !!token
  
  // State to track if component has mounted (Client-side only)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Only redirect if mounted and authenticated
    if (isMounted && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [isMounted, isAuthenticated, user, router])

  // --- HYDRATION FIX ---
  // 1. Server & Client First Render: Render Landing Page (isMounted = false)
  // 2. Client Second Render: Render Loader (isMounted = true)
  
  if (isMounted && isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    ) 
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-blue-100 mb-8">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700">Modern Exam Management Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              Online Exam
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Management System
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Complete exam platform with auto-grading, intelligent auto-save, and seamless resume functionality
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button size="lg" className="px-8 py-6 text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                  Get Started
                </Button>
              </Link>
              
              <Link href="/signup">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-2 bg-white/80 backdrop-blur-sm hover:bg-white">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Our Platform?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built with modern technology to provide the best exam experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Auto-Save</h3>
            <p className="text-gray-600 leading-relaxed">
              Your answers are automatically saved every 30 seconds. Never lose your progress again.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Resume Anytime</h3>
            <p className="text-gray-600 leading-relaxed">
              Browser crashed? Connection lost? Resume your exam exactly where you left off.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Instant Results</h3>
            <p className="text-gray-600 leading-relaxed">
              Get your scores immediately after submission with detailed performance analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}