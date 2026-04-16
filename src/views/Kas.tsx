
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Wallet, Calendar as CalendarIcon, Search, Filter, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { db, collection, onSnapshot, query, orderBy, addDoc, Timestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function Kas() {
  const { isBendahara, isKetuaRT } = useAuth();
  const [kasData, setKasData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [type, setType] = useState<'in' | 'out'>('in');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const canManage = isBendahara || isKetuaRT;

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'kas'), orderBy('date', 'desc')),
      (snapshot) => {
        setKasData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'kas')
    );
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      await addDoc(collection(db, 'kas'), {
        type,
        category,
        amount: Number(amount),
        description,
        date,
        createdAt: Timestamp.now()
      });
      toast.success('Data kas berhasil disimpan');
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'kas');
      toast.error('Gagal menyimpan data kas');
    }
  };

  const totalIn = kasData.filter(k => k.type === 'in').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = kasData.filter(k => k.type === 'out').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIn - totalOut;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const categories = {
    in: [
      { id: 'iuran_bulanan', label: 'Iuran Bulanan' },
      { id: 'insentif_wifi', label: 'Insentif Wifi' },
      { id: 'dana_sosial', label: 'Dana Sosial' }
    ],
    out: [
      { id: 'iuran_security', label: 'Iuran Security' },
      { id: 'iuran_sampah', label: 'Iuran Sampah' },
      { id: 'kegiatan_rt', label: 'Kegiatan RT' }
    ]
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="px-1">
        <h2 className="text-3xl font-black tracking-tighter text-slate-900">Rekap Kas RT</h2>
        <p className="text-sm text-slate-500 font-medium">Transparansi keuangan lingkungan</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-primary text-primary-foreground border-none shadow-2xl shadow-primary/20 rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="p-8 relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Wallet className="text-white" size={24} />
              </div>
              <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Saldo Saat Ini
              </Badge>
            </div>
            <h3 className="text-4xl font-black tracking-tighter mb-1">{formatCurrency(balance)}</h3>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Total Kas Guyup Rukun</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-emerald-50 border-none rounded-[2rem]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="text-emerald-600" size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Masuk</span>
              </div>
              <p className="text-lg font-black tracking-tight text-emerald-700">{formatCurrency(totalIn)}</p>
            </CardContent>
          </Card>
          <Card className="bg-rose-50 border-none rounded-[2rem]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <TrendingDown className="text-rose-600" size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Keluar</span>
              </div>
              <p className="text-lg font-black tracking-tight text-rose-700">{formatCurrency(totalOut)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger render={
            <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2">
              <Plus size={20} /> Input Transaksi Baru
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter">Input Transaksi</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setType('in'); setCategory(''); }}
                  className={cn(
                    "h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    type === 'in' ? "bg-white shadow-sm text-primary" : "text-slate-500"
                  )}
                >
                  Dana Masuk
                </button>
                <button
                  type="button"
                  onClick={() => { setType('out'); setCategory(''); }}
                  className={cn(
                    "h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    type === 'out' ? "bg-white shadow-sm text-rose-600" : "text-slate-500"
                  )}
                >
                  Dana Keluar
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Kategori</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    {categories[type].map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Jumlah (Rp)</Label>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0" 
                  required 
                  className="h-12 rounded-2xl bg-slate-50 border-none" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Keterangan</Label>
                <Input 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Detail transaksi..." 
                  className="h-12 rounded-2xl bg-slate-50 border-none" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tanggal</Label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required 
                  className="h-12 rounded-2xl bg-slate-50 border-none" 
                />
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                  Simpan Transaksi
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* History */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Riwayat Transaksi</h3>
          <button className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
            <Filter size={14} /> Filter
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : kasData.length > 0 ? (
            kasData.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-none bg-white shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      item.type === 'in' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {item.type === 'in' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 truncate">
                          {categories[item.type as 'in' | 'out'].find(c => c.id === item.category)?.label || item.category}
                        </h4>
                        <span className={cn(
                          "font-black tracking-tight",
                          item.type === 'in' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {item.description && (
                          <>
                            <span className="text-slate-200">•</span>
                            <span className="text-[10px] text-slate-400 font-medium truncate italic">
                              "{item.description}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-[2rem]">
              <Wallet className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500 font-medium">Belum ada transaksi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
