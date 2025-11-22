'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupMutation } from '@/lib/redux/services/authApi';
import Link from 'next/link';

export default function SignupForm() {
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student', // Default role
  });

  // Redux Hook
  const [signup, { isLoading, error }] = useSignupMutation();
  const router = useRouter();

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(formData).unwrap();
      // Redirect to login on success
      router.push('/login?registered=true');
    } catch (err) {
      // Error already handled by toast in the catch block
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md border border-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="text-sm text-gray-500 mt-2">Join to start taking exams</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded border border-red-100">
          Registration failed. Email might already be in use.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="name@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        {/* Role Selection (For Demo Purposes) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            *Select 'Admin' to create exams, 'Student' to take them.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 text-white bg-primary rounded hover:bg-primary/90 disabled:bg-primary/30 transition-colors font-medium"
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      {/* Link to Login */}
      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Log in here
        </Link>
      </div>
    </div>
  );
}