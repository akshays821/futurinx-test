"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function AdminGuard({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (pathname !== "/admin/login") {
          router.push("/admin/login")
        } else {
          setChecking(false)
        }
      } else {
        if (pathname === "/admin/login") {
          router.push("/admin")
        } else {
          setChecking(false)
        }
      }
    })
    return () => unsub()
  }, [pathname, router])

  if (checking) return null

  return children
}
