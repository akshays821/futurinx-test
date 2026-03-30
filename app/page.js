"use client"
import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { motion } from "framer-motion"

export default function Storefront() {
  const [dbBanners, setDbBanners] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "banners")),
          getDocs(collection(db, "products"))
        ])
        setDbBanners(bannersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })).reverse())
      } catch (error) {
        console.error("Fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const bannersCount = dbBanners.length > 0 ? dbBanners.length : 1;
    if (bannersCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bannersCount);
    }, 1500);
    return () => clearInterval(interval);
  }, [dbBanners.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#132826] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Dynamic Dark Mode Glow Effects */}
        <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-[#0A6A74] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-[#C36148] rounded-full blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        {/* Brand Reveal Animation */}
        <div className="relative z-10 flex items-center gap-4 mb-10">
           <motion.div 
             initial={{ scale: 0, rotate: -90 }}
             animate={{ scale: 1, rotate: 0 }}
             transition={{ type: "spring", damping: 12, stiffness: 100 }}
             className="w-10 h-10 rounded-lg bg-[#C36148] shadow-[0_0_30px_rgba(195,97,72,0.4)]"
           />
           <motion.h1 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2, duration: 0.8 }}
             className="text-4xl font-black tracking-tighter text-white"
           >
             FUTURINX
           </motion.h1>
        </div>

        {/* Animated Triple Dots Loader */}
        <div className="flex gap-2.5 relative z-10">
           <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }} className="w-2.5 h-2.5 rounded-full bg-[#0A6A74]" />
           <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }} className="w-2.5 h-2.5 rounded-full bg-white/60" />
           <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} className="w-2.5 h-2.5 rounded-full bg-[#C36148]" />
        </div>
      </div>
    )
  }

  // Practical single placeholder when no images are uploaded
  const activeBanners = dbBanners.length > 0 ? dbBanners : [
    { id: "p1", isPlaceholder: true, text: "Welcome to Futurinx", sub: "Discover our latest premium collection." }
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#132826] font-sans antialiased">
      
      {/* Sensible Practical Header */}
      <header className="w-full bg-[#132826] text-white px-6 py-4 flex items-center justify-center md:justify-start sticky top-0 z-50 shadow-md">
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[#C36148]"></div>
          FUTURINX
        </Link>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        
        {/* Controlled, Fixed-Height Banner Carousel */}
        <section className="relative w-full h-[250px] md:h-[400px] rounded-2xl overflow-hidden bg-[#132826] shadow-sm mb-10 md:mb-16">
          {activeBanners.map((banner, idx) => (
             <div 
               key={banner.id}
               className={`absolute inset-0 w-full h-full transition-opacity duration-1000 flex items-center justify-center ${idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
             >
               {banner.isPlaceholder ? (
                 <div className="text-center px-6">
                   <h2 className="text-3xl md:text-5xl font-black text-white mb-3 md:mb-4">{banner.text}</h2>
                   <p className="text-white/80 text-sm md:text-lg">{banner.sub}</p>
                 </div>
               ) : (
                 <img src={banner.imageUrl} alt="Banner Component" className="w-full h-full object-cover" />
               )}
             </div>
          ))}
          
          {/* Practical UI Controls */}
          {activeBanners.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentSlide((currentSlide - 1 + activeBanners.length) % activeBanners.length)} 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="Previous slide"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                onClick={() => setCurrentSlide((currentSlide + 1) % activeBanners.length)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="Next slide"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {activeBanners.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentSlide(idx)} 
                    className={`h-2 rounded-full transition-all ${idx === currentSlide ? "w-8 bg-[#C36148]" : "w-2 bg-white/60 hover:bg-white"}`} 
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Practical Grid Product Layout */}
        <section className="mb-20">
          <div className="mb-8 flex items-center gap-3">
             <div className="w-1.5 h-8 bg-[#0A6A74] rounded-sm"></div>
             <h2 className="text-2xl md:text-3xl font-black text-[#132826] tracking-tight">New Arrivals</h2>
          </div>

          {products.length === 0 ? (
            <div className="w-full py-16 bg-white rounded-2xl border border-gray-200 text-center">
              <p className="text-gray-500 font-medium">Shop is currently empty. More items dropping soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl p-3 md:p-4 flex flex-col shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group">
                  
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] w-full bg-gray-50 rounded-xl overflow-hidden mb-4 border border-gray-100/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-[#0A6A74] text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-sm">
                      {product.category}
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="flex flex-col flex-1 px-1">
                    <h3 className="font-bold text-sm md:text-base leading-snug line-clamp-2 text-[#132826] mb-1">{product.name}</h3>
                    <p className="text-gray-600 text-xs md:text-sm line-clamp-2 mb-4 flex-1">{product.description}</p>
                    
                    {/* Footer / CTA */}
                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 md:pt-4">
                      <span className="font-black text-lg md:text-xl text-[#132826]">${product.price}</span>
                      <Link href={`/checkout?product=${product.id}`} className="px-4 py-2 md:px-5 md:py-2.5 rounded-lg bg-[#C36148] hover:bg-[#A8513A] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors shadow-sm active:scale-95">
                        Buy Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Practical Clean Footer */}
      <footer className="w-full bg-[#132826] text-white py-12 text-center border-t-4 border-[#0A6A74]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-sm bg-[#C36148]"></div>
            <span className="font-black tracking-widest uppercase text-sm">Futurinx</span>
          </div>
          <p className="text-xs font-medium opacity-60 mb-2 max-w-sm">Curated goods for your modern lifestyle.</p>
          <p className="text-[10px] uppercase tracking-widest opacity-40 mt-6">© {new Date().getFullYear()} All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}
