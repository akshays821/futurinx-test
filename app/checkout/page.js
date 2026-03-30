"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { Toaster, toast } from "sonner"
import { motion } from "framer-motion"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get("product")
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null) // null | object

  useEffect(() => {
    // Dynamically mount Razorpay checkout script into document payload
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
      })
    }
    loadRazorpay()

    // Fetch Target Product Object
    const fetchProduct = async () => {
      if (!productId) {
        setError("No product selected for checkout.")
        setLoading(false)
        return
      }
      try {
        const docRef = doc(db, "products", productId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() })
        } else {
          setError("Product not found or removed from store.")
        }
      } catch (err) {
        console.error("Fetch error:", err)
        setError("Failed to fetch product details.")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  const handlePayment = async () => {
    setIsProcessing(true)

    // Razorpay environment availability check
    if (typeof window === "undefined" || !window.Razorpay) {
      toast.error("Gateway offline. Please check your connection.", {
         style: { background: "#FEF2F2", color: "#C36148", border: "1px solid #FECACA" }
      })
      setIsProcessing(false)
      return
    }

    // Prepare Checkout Object
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
      amount: Math.round(product.price * 100), // convert perfectly to valid subunits (cents/paise)
      currency: "USD",
      name: "Futurinx Storefront",
      description: `Purchase: ${product.name}`,
      image: product.imageUrl,
      handler: function (response) {
        // Success hook resolving callback parameter
        setPaymentStatus({
          id: response.razorpay_payment_id,
          date: new Date().toLocaleDateString()
        })
        setIsProcessing(false)
      },
      prefill: {
        name: "Guest Customer",
        email: "guest@futurinx.com",
        contact: "0000000000"
      },
      theme: {
        color: "#132826"
      }
    }

    const paymentObject = new window.Razorpay(options)
    paymentObject.on("payment.failed", function (response) {
      toast.error(response.error.description.split(".").shift() || "Card verification failed.", {
         description: "Check credentials or confirm the limits.",
         style: { background: "#FEF2F2", color: "#C36148", border: "1px solid #FECACA" }
      })
      setIsProcessing(false)
    })
    
    paymentObject.open()
  }

  // Pre-load Screen Animation natively inherited
  if (loading) {
    return (
      <div className="min-h-screen bg-[#132826] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-[#0A6A74] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-[#C36148] rounded-full blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        <div className="relative z-10 flex items-center gap-4 mb-10">
           <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12, stiffness: 100 }} className="w-10 h-10 rounded-lg bg-[#C36148] shadow-[0_0_30px_rgba(195,97,72,0.4)]" />
           <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-4xl font-black tracking-tighter text-white">FUTURINX</motion.h1>
        </div>

        <div className="flex gap-2.5 relative z-10">
           <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }} className="w-2.5 h-2.5 rounded-full bg-[#0A6A74]" />
           <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }} className="w-2.5 h-2.5 rounded-full bg-white/60" />
           <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} className="w-2.5 h-2.5 rounded-full bg-[#C36148]" />
        </div>
      </div>
    )
  }

  // Error Bounds
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center px-6 text-center text-[#132826]">
         <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </div>
         <h1 className="text-2xl font-black mb-2">{error || "Unknown Checkout Error"}</h1>
         <Link href="/" className="mt-8 px-6 py-3 bg-[#132826] text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#0A6A74] transition-colors shadow-md">Return to Storefront</Link>
      </div>
    )
  }

  // Post-Payment Success View Hook
  if (paymentStatus) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_10px_40px_rgba(19,40,38,0.1)] border border-gray-100 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-[#0A6A74]"></div>
           <div className="w-20 h-20 mx-auto rounded-full bg-[#E0FBFC] text-[#0A6A74] flex items-center justify-center mb-6 shadow-inner">
             <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
           </div>
           
           <h1 className="text-3xl font-black text-[#132826] tracking-tight mb-2">Payment Handled!</h1>
           <p className="text-xs md:text-sm font-medium text-gray-500 mb-8 max-w-[250px] mx-auto">Thank you for your purchase. Your order has been confirmed.</p>
           
           <div className="bg-[#F9F9F9] rounded-2xl p-5 mb-8 text-left border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest">Order ID</span>
                 <span className="text-xs font-black text-[#132826] bg-[#E0FBFC] px-2 py-1 rounded-md">{paymentStatus.id}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest">Date</span>
                 <span className="text-xs font-black text-[#132826]">{paymentStatus.date}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                 <span className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest">Total Paid</span>
                 <span className="text-lg md:text-xl font-black text-[#C36148]">${product.price}</span>
              </div>
           </div>

           <Link href="/" className="block w-full py-4 rounded-xl bg-[#132826] hover:bg-[#0A6A74] active:bg-[#C36148] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors shadow-md">
             Continue Browsing
           </Link>
        </div>
      </div>
    )
  }

  // Active Checkout Render
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#132826] font-sans antialiased pb-24">
      
      {/* Utility Header */}
      <header className="w-full bg-white px-6 py-5 border-b border-gray-100 sticky top-0 z-50 flex items-center shadow-sm">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-[#C36148] transition-colors flex items-center gap-2">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest hidden md:block">Back to Store</span>
        </button>
        <div className="mx-auto text-xs md:text-sm font-black tracking-widest uppercase text-[#132826]">Rapid Checkout</div>
        <div className="w-6 md:w-20"></div> {/* Spacer logic exclusively center-locking string context */}
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-12 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10">
         
         {/* Order Item Inspection Box */}
         <section className="bg-white p-5 md:p-10 rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
            <h2 className="text-xl md:text-3xl font-black tracking-tight mb-5 md:mb-8 text-[#132826]">Order Summary</h2>
            
            <div className="flex flex-row items-center md:items-start gap-4 md:gap-8 mb-6 md:mb-8 pb-6 md:pb-8 border-b border-gray-100">
               <div className="w-24 h-24 md:w-40 md:h-40 shrink-0 rounded-[1rem] md:rounded-2xl bg-[#E0FBFC]/50 overflow-hidden border border-[#0A6A74]/10 flex items-center justify-center p-1 md:p-2">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover mix-blend-multiply rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="flex flex-col flex-1 justify-center">
                  <span className="text-[8px] md:text-[10px] font-black text-white bg-[#0A6A74] px-2 py-0.5 md:px-2.5 md:py-1 rounded uppercase tracking-widest mb-1.5 md:mb-3 w-fit shadow-sm">{product.category}</span>
                  <h3 className="text-sm md:text-2xl font-black text-[#132826] leading-snug mb-1 md:mb-2">{product.name}</h3>
                  <p className="text-[10px] md:text-xs text-gray-600 font-medium line-clamp-3 bg-[#F9F9F9] md:p-3 rounded-xl md:border border-transparent md:border-gray-100 mt-1 md:mt-2 leading-relaxed">{product.description}</p>
               </div>
            </div>

            <div className="space-y-4 flex-1">
               <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-4 md:mb-6">Payment Details</h3>
               <div className="flex justify-between items-center text-xs md:text-sm font-medium text-gray-500 px-2 lg:px-4">
                  <span>Subtotal</span>
                  <span className="text-[#132826] font-bold">${product.price}</span>
               </div>
               <div className="flex justify-between items-center text-xs md:text-sm font-medium text-gray-500 px-2 lg:px-4">
                  <span>Shipping & Handling</span>
                  <span className="text-[#0A6A74] font-bold">Free</span>
               </div>
               <div className="pt-4 md:pt-6 border-t border-gray-100 mx-2 lg:mx-4 flex justify-between items-end mt-4 md:mt-6">
                  <span className="text-xs md:text-sm font-black uppercase tracking-widest text-[#132826]">Total</span>
                  <span className="text-3xl md:text-4xl font-black text-[#C36148]">${product.price}</span>
               </div>
            </div>
         </section>

         {/* Razorpay Gateway Node Widget Side */}
         <aside className="bg-[#132826] text-white p-6 md:p-10 rounded-2xl md:rounded-[2rem] shadow-[0_15px_40px_rgba(19,40,38,0.2)] flex flex-col justify-center relative overflow-hidden h-fit lg:sticky lg:top-28">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A6A74] blur-[50px] opacity-40 rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#C36148] blur-[60px] opacity-20 rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 text-center flex flex-col items-center">
               <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center mb-5 md:mb-6 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  <svg className="w-5 h-5 md:w-7 md:h-7 text-[#0A6A74]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               </div>
               <h3 className="text-lg md:text-xl font-black mb-2 md:mb-3">Secure Payment</h3>
               <p className="text-[10px] md:text-xs text-[#E0FBFC]/60 font-medium mb-8 md:mb-10 leading-relaxed max-w-[200px] md:max-w-[250px]">
                  Your payment is 100% secure and fully encrypted.
               </p>

               <button 
                 onClick={handlePayment} 
                 disabled={isProcessing}
                 className="w-full py-4 md:py-4.5 rounded-xl md:rounded-2xl bg-[#C36148] hover:bg-[#A8513A] disabled:bg-[#C36148]/50 text-white text-[10px] md:text-xs font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(195,97,72,0.4)] transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 md:gap-3"
               >
                 {isProcessing ? (
                   <>
                     <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                     Processing...
                   </>
                 ) : (
                   `Pay $${product.price} Now`
                 )}
               </button>

               <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 md:gap-4 opacity-50">
                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Secured by Razorpay</span>
               </div>
            </div>
         </aside>

      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            fontFamily: "var(--font-geist-sans), sans-serif",
            padding: "16px 20px",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(19,40,38,0.12)",
            fontWeight: "bold",
            letterSpacing: "0.5px"
          }
        }} 
      />
      <Suspense fallback={
         <div className="min-h-screen bg-[#132826] flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-[#0A6A74] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
           <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-[#C36148] rounded-full blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
         </div>
      }>
        <CheckoutContent />
      </Suspense>
    </>
  )
}
