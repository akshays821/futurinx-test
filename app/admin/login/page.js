"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const loginPromise = new Promise(async (resolve, reject) => {
      try {
        await signInWithEmailAndPassword(auth, email, password)
        resolve()
      } catch (err) {
        console.error(err)
        reject(err)
      }
    })

    toast.promise(loginPromise, {
      loading: "Authenticating...",
      success: () => {
        router.push("/admin")
        return "Welcome back to the dashboard!"
      },
      error: "Invalid email or password.",
      style: {
        background: "#180A04",
        border: "1px solid #f97316",
        borderLeft: "6px solid #f97316",
        boxShadow: "0 0 30px rgba(249, 115, 22, 0.3)",
        color: "#fff",
      }
    })

    loginPromise.finally(() => setLoading(false)).catch(() => {})
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#131313]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[400px] h-[300px] md:w-[600px] md:h-[400px] bg-orange-600/20 rounded-full blur-[100px] md:blur-[120px] pointer-events-none"
      ></motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        className="absolute top-1/2 left-1/2 -translate-x-[20%] -translate-y-[40%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-rose-500/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none"
      ></motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        className="relative w-full max-w-[420px] p-8 md:p-10 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] shadow-2xl z-10"
      >
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm font-medium tracking-wide">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-bold text-gray-400/80 uppercase tracking-widest ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl bg-black/20 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-bold text-gray-400/80 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl bg-black/20 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-gray-100 text-black font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#131313] focus:ring-white disabled:opacity-50 flex items-center justify-center mt-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Sign In"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
