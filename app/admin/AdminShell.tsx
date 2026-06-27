'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthUser } from '@/lib/auth/client'
import { authLoginUrl } from '@/lib/auth/login-path'
import {
  FiHome,
  FiPackage,
  FiTag,
  FiShoppingBag,
  FiUsers,
  FiBarChart,
  FiArrowLeft,
  FiAward
} from 'react-icons/fi'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Products', href: '/admin/products', icon: FiPackage },
  { name: 'Categories', href: '/admin/categories', icon: FiTag },
  { name: 'Brands', href: '/admin/brands', icon: FiAward },
  { name: 'Orders', href: '/admin/orders', icon: FiShoppingBag },
  { name: 'Users', href: '/admin/users', icon: FiUsers },
  { name: 'Analytics', href: '/admin/analytics', icon: FiBarChart },
]

export default function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthUser()

  useEffect(() => {
    if (user === undefined) return
    if (user === null) {
      router.replace(authLoginUrl(pathname || '/admin'))
    }
  }, [user, pathname, router])

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (user === null) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar - starting point of the page */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-x-2 sm:gap-x-4 min-w-0 flex-1">
          <h1 className="text-lg font-bold text-gray-900 truncate mr-2 sm:mr-4">Admin Panel</h1>
          <nav className="flex items-center gap-x-1 sm:gap-x-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-brand" />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-x-3 sm:gap-x-4 lg:gap-x-6 flex-shrink-0">
          <Link
            href="/shop"
            className="flex items-center gap-x-1.5 sm:gap-x-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-brand" />
            <span>BACK</span>
          </Link>
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap hidden sm:inline"
          >
            View Site
          </Link>
        </div>
      </div>

      {/* Main content - starts below navbar */}
      <div className="pt-16">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
