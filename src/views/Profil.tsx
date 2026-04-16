
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Settings, LogOut, Shield, Info, Bell, Moon, ChevronRight, User, Heart, Edit2, Phone, Mail, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { motion } from 'motion/react';
import { auth, signOut, db, doc, onSnapshot, setDoc, handleFirestoreError, OperationType, collection } from '../lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Profil() {
  const { isKetuaRT } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Edit form states
  const [editName, setEditName] = useState('');
  const [editBlock, setEditBlock] = useState('');
  const [editHouseNumber, setEditHouseNumber] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  // Upload states
  const [ktpUrl, setKtpUrl] = useState('');
  const [kkUrl, setKkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        setEditName(data.name || '');
        setEditBlock(data.block || '');
        setEditHouseNumber(data.houseNumber || '');
        setEditPhone(data.phone || '');
        setEditEmail(data.email || '');
        setKtpUrl(data.ktpUrl || '');
        setKkUrl(data.kkUrl || '');
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isKetuaRT) {
      const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
      return () => unsub();
    }
  }, [isKetuaRT]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
      toast.success('Peran berhasil diperbarui');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      toast.error('Gagal memperbarui peran');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        name: editName,
        block: editBlock,
        houseNumber: editHouseNumber,
        phone: editPhone,
        email: editEmail,
        address: `Blok ${editBlock} No. ${editHouseNumber}`
      }, { merge: true });
      toast.success('Profil berhasil diperbarui!');
      setIsEditModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      toast.error('Gagal memperbarui profil');
    }
  };

  const handleUploadDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsUploading(true);

    try {
      // Simulating upload by saving the URLs provided in the form
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        ktpUrl,
        kkUrl,
        // In a real app, an admin would verify this. 
        // For this demo, we'll set it to pending or auto-verify if needed.
        // Let's set a flag that they have uploaded docs.
        hasUploadedDocs: true,
        // We'll let the admin verify it manually, but for now let's auto-verify for testing
        isVerified: true 
      }, { merge: true });
      toast.success('Dokumen berhasil diunggah! Akun Anda kini aktif.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      toast.error('Gagal mengunggah dokumen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Berhasil keluar');
    } catch (error) {
      toast.error('Gagal keluar');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col items-center py-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="relative"
        >
          <Avatar className="h-28 w-28 border-4 border-white shadow-2xl rounded-[2.5rem]">
            <AvatarImage src={userData?.photoURL} />
            <AvatarFallback className="bg-primary text-white text-2xl font-black">
              {userData?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
            <Shield size={16} />
          </div>
        </motion.div>
        
        <div className="text-center mt-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{userData?.name}</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            {userData?.role === 'admin' ? 'Ketua RT' : 'Warga'} • {userData?.address || 'Alamat belum diisi'}
          </p>
        </div>

        <div className="flex gap-2 mt-4">
          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">
            {userData?.role || 'Warga'}
          </Badge>
          <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">Verified</Badge>
        </div>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Verifikasi Identitas</h3>
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center",
                    userData?.isVerified ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500"
                  )}>
                    <Shield size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">Status Registrasi</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {userData?.isVerified ? 'Aktif & Terverifikasi' : 'Belum Terverifikasi'}
                    </span>
                  </div>
                </div>
                {userData?.isVerified && (
                  <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase tracking-widest">Active</Badge>
                )}
              </div>

              {!userData?.isVerified && (
                <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-[10px] font-medium text-orange-800 leading-relaxed">
                    Unggah foto KTP dan KK Anda untuk mengaktifkan fitur Laporan dan Permohonan Surat. Data ini bersifat pribadi dan hanya dapat dilihat oleh Anda dan pengurus RT.
                  </p>
                </div>
              )}

              <Dialog>
                <DialogTrigger render={
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-100 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50">
                    {userData?.ktpUrl ? 'Lihat / Update Dokumen' : 'Unggah Dokumen'}
                  </Button>
                } />
                <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tighter">Verifikasi Identitas</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUploadDocs} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">URL Foto KTP</Label>
                      <Input 
                        value={ktpUrl} 
                        onChange={(e) => setKtpUrl(e.target.value)} 
                        placeholder="https://..." 
                        required 
                        className="h-12 rounded-2xl bg-slate-50 border-none" 
                      />
                      <p className="text-[8px] text-slate-400 ml-1 italic">*Masukkan link foto KTP Anda</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">URL Foto KK</Label>
                      <Input 
                        value={kkUrl} 
                        onChange={(e) => setKkUrl(e.target.value)} 
                        placeholder="https://..." 
                        required 
                        className="h-12 rounded-2xl bg-slate-50 border-none" 
                      />
                      <p className="text-[8px] text-slate-400 ml-1 italic">*Masukkan link foto KK Anda</p>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={isUploading}
                        className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                      >
                        {isUploading ? 'Mengunggah...' : 'Simpan Dokumen'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {userData?.ktpUrl && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 ml-1">KTP</span>
                    <div className="h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                      <img src={userData.ktpUrl} alt="KTP" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 ml-1">KK</span>
                    <div className="h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                      <img src={userData.kkUrl} alt="KK" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Pengaturan Akun</h3>
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <CardContent className="p-0">
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <User size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-bold text-slate-700 block">Edit Profil</span>
                      <span className="text-[10px] text-slate-400 font-medium">{userData?.email}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tighter">Edit Profil</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nama Lengkap</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="h-12 rounded-2xl bg-slate-50 border-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Blok</Label>
                        <Input value={editBlock} onChange={(e) => setEditBlock(e.target.value)} placeholder="A" required className="h-12 rounded-2xl bg-slate-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">No. Rumah</Label>
                        <Input value={editHouseNumber} onChange={(e) => setEditHouseNumber(e.target.value)} placeholder="12" required className="h-12 rounded-2xl bg-slate-50 border-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nomor HP</Label>
                      <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="0812..." className="h-12 rounded-2xl bg-slate-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                      <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" required className="h-12 rounded-2xl bg-slate-50 border-none" />
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Simpan Perubahan</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Separator className="bg-slate-50" />
              <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Bell size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Notifikasi</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
              <Separator className="bg-slate-50" />
              <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Shield size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Keamanan</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Preferensi</h3>
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Moon size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Mode Gelap</span>
                </div>
                <div className="w-10 h-5 bg-slate-100 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <Separator className="bg-slate-50" />
              <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Info size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Tentang Aplikasi</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            </CardContent>
          </Card>
        </section>

        {isKetuaRT && (
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Manajemen Peran (Ketua RT)</h3>
            <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
              <CardContent className="p-4 space-y-4">
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                  Hanya Ketua RT yang dapat memberikan hak akses peran kepada warga.
                </p>
                <div className="space-y-3">
                  {allUsers.filter(u => u.uid !== auth.currentUser?.uid).map(user => (
                    <div key={user.uid} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-xl">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback className="text-[10px] font-bold">{user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-700 block truncate">{user.name}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</span>
                        </div>
                      </div>
                      <Select 
                        value={user.role} 
                        onValueChange={(val) => handleUpdateRole(user.uid, val)}
                      >
                        <SelectTrigger className="h-8 w-28 rounded-xl bg-white border-slate-100 text-[10px] font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="warga">Warga</SelectItem>
                          <SelectItem value="bendahara">Bendahara</SelectItem>
                          <SelectItem value="sekretaris">Sekretaris</SelectItem>
                          <SelectItem value="ketua_rt">Ketua RT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-rose-50 text-rose-600 font-bold uppercase tracking-widest text-xs hover:bg-rose-100 transition-colors shadow-sm shadow-rose-100/50"
        >
          <LogOut size={18} />
          Keluar Akun
        </button>
      </div>

      <div className="text-center space-y-2 mt-8">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Guyup Rukun v1.0.0</p>
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Made with <Heart size={10} className="text-rose-300 fill-rose-300" /> for RT 04
        </div>
      </div>
    </div>
  );
}
