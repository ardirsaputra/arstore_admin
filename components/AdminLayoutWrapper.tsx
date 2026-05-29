"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless open */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full md:w-auto">
        {/* Mobile Header */}
        <div className="md:hidden px-4 py-3 border-b border-gray-800/60 flex items-center justify-between bg-gray-900 sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-brand-700 flex items-center justify-center shadow-sm">
                <svg className="w-3 h-3 text-brand-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
             </div>
             <span className="font-bold text-sm text-brand-400">ArStore Admin</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        
        <footer className="px-4 md:px-6 py-3 border-t border-gray-800/60 text-xs text-gray-600 flex items-center justify-between">
          <span>ArStore Admin</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
