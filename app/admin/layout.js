import AdminGuard from "@/components/admin/AdminGuard"
import Sidebar from "@/components/admin/Sidebar"
import { Toaster } from "sonner"

export const metadata = {
  title: "Admin Dashboard",
}

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row min-h-screen bg-[#131313] text-white selection:bg-orange-500/30 antialiased font-sans flex-1">
        <Sidebar />
        <main className="flex-1 min-h-screen relative overflow-hidden">
          {children}
        </main>
      </div>
      <Toaster 
        position="top-center" 
        theme="dark" 
        toastOptions={{
          style: {
            background: "rgba(20, 20, 20, 0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#fff",
            borderRadius: "1rem",
            padding: "16px",
          }
        }} 
      />
    </AdminGuard>
  )
}
