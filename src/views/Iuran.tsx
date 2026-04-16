
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Filter, Wallet, ArrowUpRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType, addDoc, updateDoc, doc, Timestamp } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function Iuran() {
  const { isBendahara, isKetuaRT } = useAuth();
  const [iuran, setIuran] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, progress: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [userName, setUserName] = useState('');
  const [amount, setAmount] = useState('50000');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState('lunas');

  const canManage = isBendahara || isKetuaRT;

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  useEffect(() => {
    const q = query(collection(db, 'iuran'), orderBy('month', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setIuran(data);
      
      const total = data.reduce((acc, curr) => curr.status === 'lunas' ? acc + curr.amount : acc, 0);
      const target = snapshot.size * 50000 || 1; // Assume 50k per resident
      setStats({
        total,
        progress: Math.round((total / target) * 100)
      });
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'iuran');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      const iuranData = {
        userId: 'manual-entry',
        userName,
        amount: Number(amount),
        month,
        year: Number(year),
        status,
        paidAt: status === 'lunas' ? Timestamp.now() : null,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'iuran'), iuranData);

      // Automatically add to Kas if lunas
      if (status === 'lunas') {
        await addDoc(collection(db, 'kas'), {
          type: 'in',
          category: 'iuran_bulanan',
          amount: Number(amount),
          description: `Iuran ${month} ${year} - ${userName}`,
          date: new Date().toISOString().split('T')[0],
          iuranId: docRef.id,
          createdAt: Timestamp.now()
        });
      }

      toast.success('Data iuran berhasil disimpan');
      setIsModalOpen(false);
      setUserName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'iuran');
      toast.error('Gagal menyimpan data iuran');
    }
  };

  const handleUpdateStatus = async (item: any, newStatus: string) => {
    if (!canManage) return;
    try {
      await updateDoc(doc(db, 'iuran', item.id), {
        status: newStatus,
        paidAt: newStatus === 'lunas' ? Timestamp.now() : null
      });

      // If changed to lunas, add to Kas
      if (newStatus === 'lunas' && item.status !== 'lunas') {
        await addDoc(collection(db, 'kas'), {
          type: 'in',
          category: 'iuran_bulanan',
          amount: item.amount,
          description: `Iuran ${item.month} ${item.year} - ${item.userName}`,
          date: new Date().toISOString().split('T')[0],
          iuranId: item.id,
          createdAt: Timestamp.now()
        });
      }
      toast.success(`Status iuran ${item.userName} diperbarui`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'iuran');
      toast.error('Gagal memperbarui status iuran');
    }
  };

  const renderList = (filterStatus?: string) => {
    const filtered = filterStatus ? iuran.filter(i => i.status === filterStatus) : iuran;
    
    if (loading) return (
      <div className="flex justify-center py-8">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );

    if (filtered.length === 0) return <p className="text-center text-xs text-slate-400 py-8">Tidak ada data iuran</p>;

    return filtered.map((item, index) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="border-none shadow-sm hover:shadow-md transition-all group">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl transition-colors",
                item.status === 'lunas' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {item.status === 'lunas' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{item.userName}</h4>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Iuran Kebersihan • {item.month}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <p className="text-sm font-black text-slate-900 tracking-tighter">Rp {item.amount.toLocaleString('id-ID')}</p>
              <div className="flex items-center gap-2">
                {canManage && item.status === 'belum' && (
                  <button 
                    onClick={() => handleUpdateStatus(item, 'lunas')}
                    className="text-[8px] font-black uppercase tracking-widest h-5 px-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    Set Lunas
                  </button>
                )}
                <Badge 
                  className={cn(
                    "text-[8px] font-black uppercase tracking-widest h-4 px-1.5 border-none",
                    item.status === 'lunas' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Iuran Warga</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Periode: {months[new Date().getMonth()]} {new Date().getFullYear()}</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger render={
                <button className="bg-primary p-2 rounded-xl shadow-sm text-white">
                  <Plus size={18} />
                </button>
              } />
              <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tighter">Input Iuran Warga</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nama Warga</Label>
                    <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nama lengkap warga" required className="h-12 rounded-2xl bg-slate-50 border-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Bulan</Label>
                      <Select value={month} onValueChange={setMonth} required>
                        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none">
                          <SelectValue placeholder="Pilih bulan" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          {months.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tahun</Label>
                      <Input value={year} onChange={(e) => setYear(e.target.value)} type="number" required className="h-12 rounded-2xl bg-slate-50 border-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Jumlah (Rp)</Label>
                    <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" required className="h-12 rounded-2xl bg-slate-50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Status</Label>
                    <Select value={status} onValueChange={setStatus} required>
                      <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-xl">
                        <SelectItem value="lunas">Lunas</SelectItem>
                        <SelectItem value="belum">Belum Lunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Simpan Data Iuran</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <button className="bg-white p-2 rounded-xl shadow-sm border text-slate-400">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-start">
            <div className="bg-white/10 p-2 rounded-xl">
              <Wallet size={20} className="text-primary" />
            </div>
            <Badge className={cn(
              "border-none text-[10px] font-black uppercase tracking-widest",
              stats.progress >= 80 ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"
            )}>
              {stats.progress >= 80 ? 'On Track' : 'In Progress'}
            </Badge>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Total Terkumpul</p>
            <h3 className="text-3xl font-black mt-1 tracking-tighter">Rp {stats.total.toLocaleString('id-ID')}</h3>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-slate-400">Progress</span>
              <span className="text-primary">{stats.progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-primary" 
              />
            </div>
          </div>
        </CardContent>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
      </Card>

      <Tabs defaultValue="semua" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/50 p-1 rounded-2xl border-none shadow-sm h-12">
          <TabsTrigger value="semua" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">Semua</TabsTrigger>
          <TabsTrigger value="lunas" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">Lunas</TabsTrigger>
          <TabsTrigger value="belum" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">Belum</TabsTrigger>
        </TabsList>
        
        <TabsContent value="semua" className="mt-6 space-y-3">
          {renderList()}
        </TabsContent>
        <TabsContent value="lunas" className="mt-6 space-y-3">
          {renderList('lunas')}
        </TabsContent>
        <TabsContent value="belum" className="mt-6 space-y-3">
          {renderList('belum')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
