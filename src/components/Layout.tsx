
import React from 'react';
import { Home, Users, CreditCard, FileText, User, Plus, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Beranda', icon: Home },
  { id: 'warga', label: 'Warga', icon: Users },
  { id: 'kas', label: 'Kas', icon: Wallet },
  { id: 'iuran', label: 'Iuran', icon: CreditCard },
  { id: 'layanan', label: 'Layanan', icon: FileText },
  { id: 'profil', label: 'Profil', icon: User },
];

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background max-w-md mx-auto relative overflow-hidden shadow-2xl border-x font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 p-4 z-20 border-b flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-primary">GUYUP RUKUN</h1>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">RT 04 / RW 02 • Digital</p>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary">
            <Plus size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-6 left-4 right-4 bg-white/90 backdrop-blur-lg border shadow-xl rounded-2xl flex justify-around items-center h-16 px-2 z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <motion.div
                animate={isActive ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}
              >
                <Icon size={20} />
              </motion.div>
              <span className={cn(
                "text-[9px] mt-1 font-bold uppercase tracking-tighter transition-opacity",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
