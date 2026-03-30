"use client"
import { useState, useEffect, useRef } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { uploadToImgbb } from "@/lib/imgbb"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export default function BannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const fileInputRef = useRef(null)

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, "banners"))
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.error("Error fetching banners:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const uploadPromise = new Promise(async (resolve, reject) => {
      try {
        const url = await uploadToImgbb(file)
        if (!url) throw new Error("No URL returned from API")
        
        const newBanner = { imageUrl: url, createdAt: serverTimestamp() }
        const docRef = await addDoc(collection(db, "banners"), newBanner)
        
        setBanners(prev => [{ id: docRef.id, ...newBanner }, ...prev])
        resolve(newBanner)
      } catch (error) {
        console.error("Upload error:", error)
        reject(error)
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    })

    toast.promise(uploadPromise, {
      loading: "Uploading banner...",
      success: "Banner successfully published!",
      error: (err) => `Upload failed: ${err.message || 'Network timeout. Please retry.'}`,
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
    setDeletingId(null) // Close modal immediately
    
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        await deleteDoc(doc(db, "banners", idToRemove))
        setBanners(prev => prev.filter(b => b.id !== idToRemove))
        resolve()
      } catch (error) {
        console.error("Delete error:", error)
        reject(error)
      }
    })

    toast.promise(deletePromise, {
      loading: "Deleting banner...",
      success: "Banner successfully removed.",
      error: "Failed to delete the banner.",
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
      
      {/* Premium Deletion Modal Overlay */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Dark Blurred Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            ></motion.div>
            
            {/* Modal Card */}
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
                
                <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">Delete Banner?</h3>
                <p className="text-gray-400 text-sm mb-8">This action cannot be undone. This image will be permanently removed from your active storefront.</p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors border border-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeDelete}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
        className="fixed top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-orange-600/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0"
      ></motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        className="fixed bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-rose-500/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none z-0"
      ></motion.div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 lg:mb-14 px-2 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 md:mb-3">Banners</h1>
            <p className="text-gray-400/80 text-xs md:text-sm font-medium tracking-widest uppercase">Manage Storefront Imagery</p>
          </div>

          <div>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full md:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-gray-100 text-black font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#131313] focus:ring-white disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
              {uploading ? (
                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Upload New Banner"}
            </motion.button>
          </div>
        </motion.header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map(i => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="aspect-[16/9] rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] animate-pulse"></motion.div>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2.5rem] p-12 bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] text-center flex flex-col items-center justify-center min-h-[340px]">
            <div className="w-20 h-20 mb-6 rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-500 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 tracking-tight">No Banners Yet</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Upload a promotional image. It will display in the carousel on your storefront.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence>
              {banners.map(banner => (
                <motion.div 
                  key={banner.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="group relative rounded-[2rem] overflow-hidden bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.3)] aspect-[16/9] flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banner.imageUrl} alt="Promotional Banner" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/90 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setDeletingId(banner.id)}
                    className="absolute bottom-4 md:bottom-6 right-4 md:right-6 translate-y-0 md:translate-y-4 opacity-100 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 font-bold text-[10px] md:text-xs tracking-wider transition-all duration-300 backdrop-blur-md"
                  >
                    DELETE
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
