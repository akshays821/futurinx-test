"use client"
import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, "categories"))
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setAdding(true)

    const addPromise = new Promise(async (resolve, reject) => {
      try {
        const name = newCategoryName.trim()
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
        
        // Ensure strictly no duplicate slug
        if (categories.some(c => c.slug === slug)) {
          throw new Error("Category already exists.")
        }

        const newCat = { name, slug, createdAt: serverTimestamp() }
        const docRef = await addDoc(collection(db, "categories"), newCat)
        
        setCategories(prev => [{ id: docRef.id, ...newCat }, ...prev])
        resolve()
      } catch (error) {
        reject(error)
      } finally {
        setAdding(false)
        setNewCategoryName("")
      }
    })

    toast.promise(addPromise, {
      loading: "Creating category...",
      success: "Category successfully added!",
      error: (err) => `Failed: ${err.message}`,
      style: {
        background: "#180A04",
        border: "1px solid #f97316",
        borderLeft: "6px solid #f97316",
        boxShadow: "0 0 30px rgba(249, 115, 22, 0.3)",
        color: "#fff",
      }
    })
  }

  const executeDelete = async () => {
    if (!deletingId) return
    const idToRemove = deletingId
    const categoryToRemove = categories.find(c => c.id === idToRemove)
    setDeletingId(null) // Instantly hide modal
    
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        // Query the products collection to verify if the category actively correlates mapping to product references
        const q = query(collection(db, "products"), where("category", "==", categoryToRemove.slug))
        const productsSnap = await getDocs(q)
        
        if (!productsSnap.empty) {
          throw new Error("Cannot delete. Products are currently dynamically linked to this category index.")
        }

        await deleteDoc(doc(db, "categories", idToRemove))
        setCategories(prev => prev.filter(c => c.id !== idToRemove))
        resolve()
      } catch (error) {
        reject(error)
      }
    })

    toast.promise(deletePromise, {
      loading: "Deleting category...",
      success: "Category systematically removed.",
      error: (err) => err.message || "Failed to delete the category.",
      style: {
        background: "#1C0505",
        border: "1px solid #ef4444",
        borderLeft: "6px solid #ef4444",
        boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)",
        color: "#fff",
      }
    })
  }

  return (
    <div className="w-full relative min-h-full p-4 md:p-10 overflow-hidden">
      
      {/* Reductive Action Premium Modal Overlay */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm rounded-[2rem] bg-[#1a1a1a]/90 backdrop-blur-3xl border border-white/10 p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-red-500/20 rounded-full blur-[40px] pointer-events-none"></div>

              <div className="relative z-10 text-center">
                <div className="mx-auto w-16 h-16 rounded-[1.25rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">Delete Category?</h3>
                <p className="text-gray-400 text-sm mb-8">This action is permanent. Any products still mapped using this category will cause the deletion to gracefully fail.</p>
                
                <div className="flex gap-3">
                  <button onClick={() => setDeletingId(null)} className="flex-1 py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors border border-white/5 focus:outline-none focus:ring-2 focus:ring-white/20">
                    Cancel
                  </button>
                  <button onClick={executeDelete} className="flex-1 py-3.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] focus:outline-none focus:ring-2 focus:ring-red-500/50">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="fixed top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-orange-600/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0"></motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} className="fixed bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-amber-500/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none z-0"></motion.div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-8 md:gap-10">
        
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="px-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 md:mb-3">Categories</h1>
          <p className="text-gray-400/80 text-xs md:text-sm font-medium tracking-widest uppercase">Admin Classification Management</p>
        </motion.header>

        {/* Form Container - Glassmorphism Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }} className="w-full rounded-[2rem] p-6 md:p-8 bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
          
          <form onSubmit={handleAddCategory} className="relative z-10 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                placeholder="Ex. Wireless Headphones"
                className="w-full px-6 py-4 rounded-2xl bg-black/20 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm font-medium shadow-inner"
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={adding}
              className="md:w-auto w-full px-8 py-4 rounded-2xl bg-white hover:bg-gray-100 text-black font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#131313] focus:ring-white disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] whitespace-nowrap"
            >
              {adding ? (
                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Create Category"}
            </motion.button>
          </form>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="h-20 rounded-2xl bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] animate-pulse"></motion.div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2.5rem] p-12 bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] text-center flex flex-col items-center justify-center min-h-[250px]">
            <div className="w-16 h-16 mb-5 md:mb-6 rounded-[1.25rem] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-500 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 md:mb-3 tracking-tight">No Categories Found</h3>
            <p className="text-gray-400 text-xs md:text-sm max-w-xs mx-auto">Input a classification terminology sequentially above to start constructing filters for customers.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {categories.map(category => (
                <motion.div 
                  key={category.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="group relative rounded-2xl p-5 bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-between hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm md:text-base tracking-tight">{category.name}</h3>
                      <p className="text-gray-500 text-[10px] md:text-xs font-medium tracking-wide">/{category.slug}</p>
                    </div>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setDeletingId(category.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
