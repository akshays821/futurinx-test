"use client"
import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

const containerVariant = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState([
    { id: "products", title: "Active Products", count: 0, loading: true, glow: "bg-orange-500/20", dot: "text-orange-400" },
    { id: "categories", title: "Categories", count: 0, loading: true, glow: "bg-amber-500/20", dot: "text-amber-400" },
    { id: "banners", title: "Live Banners", count: 0, loading: true, glow: "bg-rose-500/20", dot: "text-rose-400" },
  ])

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [productsSnap, categoriesSnap, bannersSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "banners"))
        ])

        setStats(prev => prev.map(stat => {
          if (stat.id === "products") return { ...stat, count: productsSnap.size, loading: false }
          if (stat.id === "categories") return { ...stat, count: categoriesSnap.size, loading: false }
          if (stat.id === "banners") return { ...stat, count: bannersSnap.size, loading: false }
          return stat
        }))
      } catch (error) {
        console.error("Error fetching stats:", error)
        setStats(prev => prev.map(s => ({ ...s, loading: false })))
      }
    }
    fetchCounts()
  }, [])

  return (
    <div className="w-full relative min-h-full p-4 md:p-10 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-orange-600/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none"
      ></motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-rose-500/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none"
      ></motion.div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 md:mb-14 px-2"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1 md:mb-2">Dashboard Overview</h1>
          <p className="text-gray-400/80 text-xs md:text-sm font-medium tracking-widest uppercase">Real-time statistics</p>
        </motion.header>

        <motion.div 
          variants={containerVariant} initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8"
        >
          {stats.map((stat) => (
            <motion.div 
              variants={itemVariant}
              key={stat.id}
              onClick={() => router.push(`/admin/${stat.id}`)}
              className="cursor-pointer relative rounded-[2rem] p-7 md:p-8 overflow-hidden bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.3)] group hover:bg-white/[0.05] transition-all duration-500 md:hover:-translate-y-1"
            >
              <div className={`absolute -top-10 -right-10 w-32 h-32 md:w-40 md:h-40 rounded-full blur-[50px] md:blur-[60px] ${stat.glow} transition-all duration-700 md:group-hover:scale-150`}></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <h3 className="text-[10px] md:text-xs font-bold text-gray-400/80 uppercase tracking-widest mb-8 md:mb-10">
                  {stat.title}
                </h3>
                
                <div className="flex items-end justify-between">
                  {stat.loading ? (
                     <div className="h-12 w-20 md:h-16 md:w-24 bg-white/5 animate-pulse rounded-2xl"></div>
                  ) : (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="flex items-baseline text-5xl md:text-6xl font-black text-white tracking-tighter">
                      {stat.count}
                      <span className={`ml-2 text-xl md:text-2xl ${stat.dot}`}>•</span>
                    </motion.div>
                  )}
                  
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/30 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-6 md:mt-10 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] min-h-[280px] md:min-h-[340px] flex items-center justify-center relative overflow-hidden group"
        >
           <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-rose-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <div className="text-center relative z-10">
             <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 md:mb-6 rounded-[1.5rem] md:rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-orange-400/50 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
               <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
             </div>
             <h2 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 tracking-tight">System Optimized</h2>
             <p className="text-gray-400/80 text-xs md:text-sm max-w-xs md:max-w-sm mx-auto leading-relaxed">
               Your store metrics are fully synched with Firebase. The data flows seamlessly into your dashboard.
             </p>
           </div>
        </motion.div>
      </div>
    </div>
  )
}
