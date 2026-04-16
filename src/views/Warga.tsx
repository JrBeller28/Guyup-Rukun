
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Phone, MapPin, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'motion/react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from '../lib/firebase';

export function Warga() {
  const [searchTerm, setSearchTerm] = useState('');
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWarga(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredWarga = warga.filter(w => 
    (w.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (w.address?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Data Penduduk</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total: {warga.length} Warga Terdaftar</p>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
        <Input 
          placeholder="Cari nama atau alamat..." 
          className="pl-12 h-12 bg-white border-none shadow-sm rounded-2xl focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredWarga.length > 0 ? filteredWarga.map((w, index) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-2xl border-2 border-slate-50 group-hover:border-primary/20 transition-colors">
                  <AvatarFallback className="bg-primary/5 text-primary font-black text-lg">
                    {w.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 truncate">{w.name}</h4>
                    {w.role === 'admin' && (
                      <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-tighter h-4">Admin</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-1 font-medium">
                    <MapPin size={12} className="text-primary/50" />
                    <span>{w.address || 'Alamat belum diisi'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-0.5 font-medium">
                    <Phone size={12} className="text-primary/50" />
                    <span>{w.phone || 'No. HP belum diisi'}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </motion.div>
        )) : (
          <p className="text-center text-xs text-slate-400 py-8">Tidak ada data warga ditemukan</p>
        )}
      </div>
    </div>
  );
}
