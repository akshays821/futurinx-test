"use client"
import { useState, useEffect, useRef } from "react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { uploadToImgbb } from "@/lib/imgbb"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI Flow State
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  
  // Form State
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [existingImageUrl, setExistingImageUrl] = useState("")
  
  // Interaction State
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [catsSnap, prodsSnap] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "products"))
        ])
        
        const fetchedCats = catsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setCategories(fetchedCats)
        if (fetchedCats.length > 0) setCategory(fetchedCats[0].slug)
        
        // Sort newest first by implicitly reversing array or simply mapped
        const fetchedProds = prodsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        // If sorting needed, do it here. We'll simply reverse to show newest added roughly
        setProducts(fetchedProds.reverse())
      } catch (error) {
        console.error("Fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setPrice("")
    setDescription("")
    if (categories.length > 0) setCategory(categories[0].slug)
    setExistingImageUrl("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setName(product.name || "")
    setPrice(product.price || "")
    setDescription(product.description || "")
    setCategory(product.category || (categories[0]?.slug || ""))
    setExistingImageUrl(product.imageUrl || "")
    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsFormVisible(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const closeForm = () => {
    resetForm()
    setIsFormVisible(false)
  }

  const openNewForm = () => {
    resetForm()
    setIsFormVisible(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !price || !category) return

    setSubmitting(true)

    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        let imageUrl = existingImageUrl
        const file = fileInputRef.current?.files?.[0]
        
        if (file) {
          imageUrl = await uploadToImgbb(file)
          if (!imageUrl) throw new Error("Image upload failed.")
        } else if (!editingId && !imageUrl) {
          throw new Error("Product image is strictly required.")
        }

        const productData = {
          name: name.trim(),
          price: parseFloat(price),
          description: description.trim(),
          category,
          imageUrl,
          updatedAt: serverTimestamp()
        }

        if (editingId) {
          await updateDoc(doc(db, "products", editingId), productData)
          setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...productData } : p))
        } else {
          productData.createdAt = serverTimestamp()
          const docRef = await addDoc(collection(db, "products"), productData)
          setProducts(prev => [{ id: docRef.id, ...productData }, ...prev])
        }
        
        resolve(editingId ? "Updated" : "Created")
      } catch (error) {
        reject(error)
      } finally {
        setSubmitting(false)
        closeForm()
      }
    })

    toast.promise(submitPromise, {
      loading: editingId ? "Updating product..." : "Publishing product...",
      success: (data) => `Product ${data} Successfully!`,
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
    setDeletingId(null)
    
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        await deleteDoc(doc(db, "products", idToRemove))
        setProducts(prev => prev.filter(p => p.id !== idToRemove))
        
        if (editingId === idToRemove) closeForm()
        
        // Ensure pagination doesn't break if we delete the last item on a page
        const newTotalPages = Math.ceil((products.length - 1) / itemsPerPage)
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages)
        }
        resolve()
      } catch (error) {
        reject(error)
      }
    })

    toast.promise(deletePromise, {
      loading: "Deleting product from DB...",
      success: "Product permanently removed.",
      error: (err) => err.message || "Failed to delete the product.",
      style: {
        background: "#1C0505",
        border: "1px solid #ef4444",
        borderLeft: "6px solid #ef4444",
        boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)",
        color: "#fff",
      }
    })
  }

  // Pagination Math
  const totalPages = Math.ceil(products.length / itemsPerPage)
  const paginatedProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="w-full relative min-h-full p-4 md:p-10 overflow-hidden">
      
      {/* Deletion Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md"></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm rounded-[2rem] bg-[#1a1a1a]/90 backdrop-blur-3xl border border-white/10 p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-red-500/20 rounded-full blur-[40px] pointer-events-none"></div>
              <div className="relative z-10 text-center">
                <div className="mx-auto w-16 h-16 rounded-[1.25rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">Delete Product?</h3>
                <p className="text-gray-400 text-sm mb-8">This action is permanent. The product will be unlisted seamlessly from the active storefront.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeletingId(null)} className="flex-1 py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm border border-white/5 transition-colors">Cancel</button>
                  <button onClick={executeDelete} className="flex-1 py-3.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-colors">Delete</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="fixed top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-orange-600/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0"></motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.2 }} className="fixed bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-amber-500/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none z-0"></motion.div>

      <div className="relative z-10 max-w-[85rem] mx-auto flex flex-col gap-6 md:gap-10">
        
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="px-2 flex justify-between items-end">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1 md:mb-2">Products</h1>
            <p className="text-gray-400/80 text-[10px] md:text-sm font-medium tracking-widest uppercase">Admin Inventory Management</p>
          </div>
          
          <AnimatePresence>
            {!isFormVisible && (
              <motion.button 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={openNewForm}
                className="px-4 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl bg-white hover:bg-gray-100 text-black font-bold text-xs md:text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all whitespace-nowrap"
              >
                + Add Product
              </motion.button>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Dynamic Product Submission Form Component */}
        <AnimatePresence>
          {isFormVisible && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.98 }} 
              animate={{ opacity: 1, height: "auto", scale: 1 }} 
              exit={{ opacity: 0, height: 0, scale: 0.98, transition: { duration: 0.3 } }}
              transition={{ duration: 0.5, ease: "easeInOut" }} 
              className="w-full origin-top"
            >
              <div className="w-full rounded-[2rem] p-6 md:p-10 bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] pointer-events-none transition-transform duration-1000"></div>
                
                <div className="relative z-10 mb-6 md:mb-8 flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">{editingId ? "Edit Active Product" : "Publish New Product"}</h2>
                  <button type="button" onClick={closeForm} className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">Close</button>
                </div>

                {categories.length === 0 && !loading ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium">Please construct a Category framework first before attempting to publish a product!</div>
                ) : (
                  <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5 md:gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-bold text-gray-400/80 uppercase tracking-widest ml-1">Product Title</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex. Premium Headphones" className="w-full px-5 py-4 rounded-2xl bg-black/20 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm font-medium shadow-inner" />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-bold text-gray-400/80 uppercase tracking-widest ml-1">Retail Price ($)</label>
                        <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="99.99" className="w-full px-5 py-4 rounded-2xl bg-black/20 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm font-medium shadow-inner" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-bold text-gray-400/80 uppercase tracking-widest ml-1">Category Classification</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full px-5 py-4 rounded-2xl bg-[#1C1C1C] border border-white/5 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm font-medium shadow-inner appearance-none cursor-pointer">
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-bold text-gray-400/80 uppercase tracking-widest ml-1">Product Imagery <span className="text-gray-600 text-[9px] md:text-[10px] lowercase tracking-normal font-normal ml-1">{editingId ? "(Optional override)" : "(Required)"}</span></label>
                        <input type="file" ref={fileInputRef} accept="image/*" required={!editingId} className="w-full px-5 py-3.5 rounded-2xl bg-black/20 border border-white/5 text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] md:file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all text-xs md:text-sm cursor-pointer shadow-inner focus:outline-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] md:text-xs font-bold text-gray-400/80 uppercase tracking-widest ml-1">Description Details</label>
                      <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe the product specifications and marketing copy..." className="w-full px-5 py-4 rounded-2xl bg-black/20 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm font-medium shadow-inner resize-none"></textarea>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      type="submit" disabled={submitting || categories.length === 0}
                      className="w-full mt-2 md:mt-4 px-8 py-4 rounded-2xl bg-white hover:bg-gray-100 text-black font-bold text-sm transition-all focus:outline-none disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                    >
                      {submitting ? "Processing..." : (editingId ? "Update Product" : "Publish Product")}
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {[1, 2, 3, 4, 5].map(i => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="aspect-[3/4] rounded-2xl md:rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] animate-pulse"></motion.div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2.5rem] p-12 bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] text-center flex flex-col items-center justify-center min-h-[300px]">
             <div className="w-16 h-16 mb-5 md:mb-6 rounded-[1.25rem] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-500 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Empty Inventory</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Click $+ Add Product$ above to launch your first item into the storefront.</p>
          </motion.div>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              <AnimatePresence>
                {paginatedProducts.map(p => {
                  const isEditing = editingId === p.id;
                  return (
                    <motion.div 
                      key={p.id} layout initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }} transition={{ duration: 0.4, ease: "easeOut" }}
                      className={`group relative rounded-2xl md:rounded-[2rem] overflow-hidden bg-white/[0.03] backdrop-blur-3xl border shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col transition-colors ${isEditing ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/[0.06] hover:bg-white/[0.05]'}`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" />
                        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 hidden md:block">
                          <span className="px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[8px] md:text-[9px] font-bold tracking-widest uppercase text-white shadow-lg">
                            {p.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 md:p-5 flex flex-col flex-1 relative z-10 bg-gradient-to-t from-[#131313]/90 via-[#131313]/50 to-transparent">
                        <div className="flex flex-col mb-1 md:mb-2 gap-1 md:gap-1.5">
                          <h3 className="text-white font-bold text-xs md:text-[15px] leading-snug line-clamp-1">{p.name}</h3>
                          <span className="text-orange-400 font-extrabold text-[11px] md:text-sm whitespace-nowrap">${p.price}</span>
                        </div>
                        <p className="text-gray-400 text-[9px] md:text-xs line-clamp-2 mb-3 md:mb-6 flex-1">{p.description}</p>
                        
                        <div className="flex gap-1.5 md:gap-2 mt-auto">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleEdit(p)} className={`flex-1 py-1.5 md:py-2.5 rounded-lg md:rounded-xl font-bold text-[9px] md:text-[10px] tracking-widest transition-all border shadow-sm ${isEditing ? 'bg-orange-500 text-black border-orange-500' : 'bg-white/5 hover:bg-white/10 text-white border-white/5'}`}>
                            EDIT
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDeletingId(p.id)} className="flex-1 py-1.5 md:py-2.5 rounded-lg md:rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-[9px] md:text-[10px] tracking-widest transition-all border border-red-500/10 shadow-sm">
                            DEL
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div layout className="flex justify-center items-center gap-3 mt-8 md:mt-12">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/10"
                >
                  Prev
                </button>
                <div className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest px-2">
                  Page {currentPage} of {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/10"
                >
                  Next
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
