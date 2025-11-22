'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ClipboardList,
  GraduationCap,
  BookOpen,
  BarChart3,
} from 'lucide-react'

type UserRole = 'admin' | 'student'

interface SidebarProps {
  role: UserRole
}

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  description?: string
}

const adminNav: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: 'Overview & stats',
  },
  {
    label: 'Exams',
    href: '/admin/exams',
    icon: <ClipboardList className="w-4 h-4" />,
    description: 'Create & manage exams',
  },
  {
    label: 'Question Bank',
    href: '/admin/questions',
    icon: <BookOpen className="w-4 h-4" />,
    description: 'MCQ, written & pools',
  },
  {
    label: 'Students',
    href: '/admin/students',
    icon: <Users className="w-4 h-4" />,
    description: 'Enrolled students',
  },
  {
    label: 'Results & Analytics',
    href: '/admin/results',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Grades & reports',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings className="w-4 h-4" />,
    description: 'System configuration',
  },
]

const studentNav: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/student',
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: 'Your exam overview',
  },
  {
    label: 'My Exams',
    href: '/student/exams',
    icon: <ClipboardList className="w-4 h-4" />,
    description: 'Assigned & active exams',
  },
  {
    label: 'Results',
    href: '/student/results',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Scores & feedback',
  },
  {
    label: 'Courses',
    href: '/student/courses',
    icon: <GraduationCap className="w-4 h-4" />,
    description: 'Enrolled courses',
  },
  {
    label: 'Profile & Settings',
    href: '/student/settings',
    icon: <Settings className="w-4 h-4" />,
    description: 'Account & preferences',
  },
]

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const navItems = role === 'admin' ? adminNav : studentNav
  const title = role === 'admin' ? 'Admin Panel' : 'Student Portal'

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/student') {
      return pathname === href
    }
    return pathname?.startsWith(href) ?? false
  }

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-4 border-b border-sidebar-border">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          {title}
        </p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'group flex items-start gap-3 rounded-xl px-3 py-2 text-sm transition-all',
                active
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              ].join(' ')}
            >
              <div
                className={[
                  'mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border',
                  active
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-sidebar-border bg-sidebar text-sidebar-foreground/70 group-hover:border-primary/20 group-hover:text-primary',
                ].join(' ')}
              >
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span
                  className={[
                    'font-medium',
                    active ? 'text-primary' : 'text-sidebar-foreground',
                  ].join(' ')}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-xs text-sidebar-foreground/60">
                    {item.description}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border text-xs text-sidebar-foreground/70">
        <p className="font-medium">
          Online Exam System
        </p>
        <p className="text-[11px] text-sidebar-foreground/50">
          {role === 'admin'
            ? 'Manage exams, students & analytics.'
            : 'Take exams and track your progress.'}
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
