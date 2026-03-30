"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useState, useEffect } from "react"

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  if (pathname === "/admin/login") return null

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const navItems = [
    { name: "Dashboard", href: "/admin" },
    { name: "Banners", href: "/admin/banners" },
    { name: "Categories", href: "/admin/categories" },
    { name: "Products", href: "/admin/products" },
  ]

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden w-full flex items-center justify-between p-5 bg-[#131313]/80 backdrop-blur-2xl border-b border-white/[0.05] sticky top-0 z-40">
        <div className="text-lg font-bold tracking-wider text-white">
          STORE<span className="text-orange-500">ADMIN</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay for Mobile + Desktop Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 md:w-64 min-h-screen bg-[#151515] md:bg-transparent md:backdrop-blur-none backdrop-blur-3xl border-r border-white/5 flex flex-col p-6 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        md:relative md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between mb-12 px-2 mt-2 md:mt-0">
          <div className="text-xl font-bold tracking-wider text-white">
            STORE<span className="text-orange-500">ADMIN</span>
          </div>
          {/* Mobile close button inside sidebar */}
          <button onClick={() => setIsOpen(false)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-5 py-3.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-white/[0.06] text-white border border-white/[0.08] shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
                } text-sm font-semibold tracking-wide`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full text-left px-5 py-3.5 rounded-2xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors duration-300 text-sm font-semibold tracking-wide"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-500"
        ></div>
      )}
    </>
  )
}
