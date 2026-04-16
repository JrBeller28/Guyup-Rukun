
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, Plus, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { db, collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, Timestamp, auth, where, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function Layanan() {
  const { userData, isAdmin, isSekretaris } = useAuth();
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [isLaporanModalOpen, setIsLaporanModalOpen] = useState(false);
  const [laporan, setLaporan] = useState<any[]>([]);
  const [surat, setSurat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canManageReports = isAdmin || isSekretaris;

  // Form states
  const [letterType, setLetterType] = useState('');
  const [letterPurpose, setLetterPurpose] = useState('');
  const [laporanTitle, setLaporanTitle] = useState('');
  const [laporanDesc, setLaporanDesc] = useState('');

  const isVerified = userData?.isVerified === true;

  useEffect(() => {
    const unsubLaporan = onSnapshot(
      query(collection(db, 'laporan'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setLaporan(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'laporan')
    );

    const suratQuery = isAdmin
      ? query(collection(db, 'surat'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'surat'), where('userId', '==', auth.currentUser?.uid), orderBy('createdAt', 'desc'));

    const unsubSurat = onSnapshot(suratQuery, (snapshot) => {
      setSurat(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'surat'));

    return () => {
      unsubLaporan();
      unsubSurat();
    };
  }, [isAdmin]);

  const handleRequestLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'surat'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Warga',
        type: letterType,
        purpose: letterPurpose,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      toast.success('Permohonan surat berhasil dikirim!');
      setIsLetterModalOpen(false);
      setLetterType('');
      setLetterPurpose('');
    } catch (error) {
      toast.error('Gagal mengirim permohonan');
    }
  };

  const handleCreateLaporan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'laporan'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Warga',
        title: laporanTitle,
        description: laporanDesc,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      toast.success('Laporan berhasil dikirim!');
      setIsLaporanModalOpen(false);
      setLaporanTitle('');
      setLaporanDesc('');
    } catch (error) {
      toast.error('Gagal mengirim laporan');
    }
  };

  const handleUpdateLaporanStatus = async (id: string, newStatus: string) => {
    if (!canManageReports) return;
    try {
      await updateDoc(doc(db, 'laporan', id), {
        status: newStatus
      });
      toast.success(`Status laporan diperbarui menjadi ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'laporan');
      toast.error('Gagal memperbarui status laporan');
    }
  };

  const handleUpdateSuratStatus = async (id: string, newStatus: string) => {
    if (!isAdmin) return; // Only Ketua RT can approve letters
    try {
      await updateDoc(doc(db, 'surat', id), {
        status: newStatus
      });
      toast.success(`Status permohonan surat diperbarui menjadi ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'surat');
      toast.error('Gagal memperbarui status surat');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Layanan Warga</h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pusat Bantuan & Administrasi</p>
      </div>

      <Tabs defaultValue="laporan" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 p-1 rounded-2xl border-none shadow-sm h-12">
          <TabsTrigger value="laporan" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest flex gap-2">
            <MessageSquare size={14} /> Laporan
          </TabsTrigger>
          <TabsTrigger value="surat" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest flex gap-2">
            <FileText size={14} /> Surat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="laporan" className="mt-6 space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Laporan Masalah</h3>
              {isVerified ? (
                <Dialog open={isLaporanModalOpen} onOpenChange={setIsLaporanModalOpen}>
                  <DialogTrigger className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                    <Plus size={14} /> Buat Laporan
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black tracking-tighter">Buat Laporan</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateLaporan} className="space-y-5 py-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Judul Laporan</Label>
                        <Input value={laporanTitle} onChange={(e) => setLaporanTitle(e.target.value)} placeholder="Contoh: Lampu Jalan Mati" required className="h-12 rounded-2xl bg-slate-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Deskripsi</Label>
                        <textarea value={laporanDesc} onChange={(e) => setLaporanDesc(e.target.value)} placeholder="Jelaskan detail masalah..." required className="w-full h-32 p-4 rounded-2xl bg-slate-50 border-none resize-none text-sm" />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Kirim Laporan</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : (
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-orange-500 border-orange-100 bg-orange-50/50">
                  Verifikasi Profil untuk Lapor
                </Badge>
              )}
            </div>
            
            <div className="space-y-3">
              {laporan.length > 0 ? laporan.map((item) => (
                <Card key={item.id} className="border-none shadow-sm overflow-hidden group">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-800">{item.title}</h4>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={cn(
                          "border-none text-[8px] font-black uppercase tracking-widest h-4",
                          item.status === 'pending' ? "bg-slate-100 text-slate-600" :
                          item.status === 'proses' ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                        )}>{item.status}</Badge>
                        
                        {canManageReports && item.status !== 'selesai' && (
                          <div className="flex gap-1">
                            {item.status === 'pending' && (
                              <button 
                                onClick={() => handleUpdateLaporanStatus(item.id, 'proses')}
                                className="text-[8px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg hover:bg-orange-100 transition-colors"
                              >
                                Proses
                              </button>
                            )}
                            <button 
                              onClick={() => handleUpdateLaporanStatus(item.id, 'selesai')}
                              className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              Selesai
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-4 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-primary/50" />
                        <span>{item.createdAt?.toDate().toLocaleDateString('id-ID')}</span>
                      </div>
                      <span className="bg-slate-50 px-2 py-0.5 rounded-full">Oleh: {item.userName}</span>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-center text-xs text-slate-400 py-8">Belum ada laporan</p>
              )}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="surat" className="mt-6 space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Permohonan Surat</h3>
              {isVerified ? (
                <Dialog open={isLetterModalOpen} onOpenChange={setIsLetterModalOpen}>
                  <DialogTrigger className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                    <Plus size={14} /> Ajukan Surat
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black tracking-tighter">Ajukan Surat</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRequestLetter} className="space-y-5 py-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Jenis Surat</Label>
                        <Select value={letterType} onValueChange={setLetterType} required>
                          <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none">
                            <SelectValue placeholder="Pilih jenis surat" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-xl">
                            <SelectItem value="Surat Keterangan Domisili">Surat Keterangan Domisili</SelectItem>
                            <SelectItem value="Surat Pengantar Nikah">Surat Pengantar Nikah</SelectItem>
                            <SelectItem value="Surat Keterangan Kematian">Surat Keterangan Kematian</SelectItem>
                            <SelectItem value="Lainnya">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Keperluan</Label>
                        <Input value={letterPurpose} onChange={(e) => setLetterPurpose(e.target.value)} placeholder="Contoh: Mengurus Paspor" required className="h-12 rounded-2xl bg-slate-50 border-none" />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Kirim Permohonan</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : (
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-orange-500 border-orange-100 bg-orange-50/50">
                  Verifikasi Profil untuk Ajukan
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {surat.length > 0 ? surat.map((item) => (
                <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className="bg-blue-50 text-blue-600 p-3 h-fit rounded-2xl">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{item.type}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Untuk: {item.userName}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                          <Clock size={12} className="text-primary/50" />
                          <span>{item.createdAt?.toDate().toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-black uppercase tracking-widest h-4 px-1.5 border-slate-200",
                        item.status === 'pending' ? "text-slate-400" :
                        item.status === 'proses' ? "text-orange-500 border-orange-200" : "text-emerald-500 border-emerald-200"
                      )}>{item.status}</Badge>
                      
                      {isAdmin && item.status === 'pending' && (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleUpdateSuratStatus(item.id, 'proses')}
                            className="text-[8px] font-bold text-orange-600 border border-orange-200 px-2 py-0.5 rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            Proses
                          </button>
                          <button 
                            onClick={() => handleUpdateSuratStatus(item.id, 'selesai')}
                            className="text-[8px] font-bold text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-lg hover:bg-emerald-50 transition-colors"
                          >
                            Selesai
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-center text-xs text-slate-400 py-8">Belum ada permohonan surat</p>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
