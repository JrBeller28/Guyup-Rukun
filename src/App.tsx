/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Warga } from './views/Warga';
import { Iuran } from './views/Iuran';
import { Kas } from './views/Kas';
import { Layanan } from './views/Layanan';
import { Profil } from './views/Profil';
import { Toaster } from '@/components/ui/sonner';
import { signInWithGoogle } from './lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-8 text-center space-y-8">
            <div className="space-y-2">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto">
                <Home className="text-primary w-10 h-10" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Guyup Rukun</h1>
              <p className="text-muted-foreground text-sm font-medium">Sistem Informasi & Layanan Warga Digital</p>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Silakan masuk untuk melanjutkan</p>
              <Button 
                onClick={signInWithGoogle}
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex gap-3 shadow-xl shadow-slate-200"
              >
                <LogIn size={20} />
                Masuk dengan Google
              </Button>
            </div>

            <p className="text-[10px] text-slate-400 font-medium">
              Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'warga':
        return <Warga />;
      case 'kas':
        return <Kas />;
      case 'iuran':
        return <Iuran />;
      case 'layanan':
        return <Layanan />;
      case 'profil':
        return <Profil />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderView()}
      </Layout>
      <Toaster position="top-center" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
