
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CreditCard, AlertTriangle, FileText, TrendingUp, Users, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { db, collection, onSnapshot, query, where, orderBy, limit, auth, handleFirestoreError, OperationType, addDoc, Timestamp } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

function MediaForm() {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'media'), {
        title,
        imageUrl,
        date,
        createdAt: Timestamp.now()
      });
      toast.success('Media berhasil ditambahkan!');
      setTitle('');
      setImageUrl('');
      setDate('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'media');
      toast.error('Gagal menambahkan media');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Judul Kegiatan</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Kerja Bakti Massal" required className="h-12 rounded-2xl bg-slate-50 border-none" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">URL Gambar</Label>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." required className="h-12 rounded-2xl bg-slate-50 border-none" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tanggal Kegiatan</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-12 rounded-2xl bg-slate-50 border-none" />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
          {loading ? 'Menyimpan...' : 'Simpan Media'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CalendarEventForm() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const eventData = {
        title,
        date,
        description,
        createdAt: Timestamp.now()
      };
      
      // Add to calendar
      await addDoc(collection(db, 'kalender'), eventData);
      
      // Also add to announcements (berita)
      await addDoc(collection(db, 'berita'), {
        title: `Kegiatan: ${title}`,
        content: `Akan dilaksanakan kegiatan "${title}" pada tanggal ${date}. ${description}`,
        category: 'Kegiatan',
        createdAt: Timestamp.now()
      });

      toast.success('Kegiatan berhasil ditambahkan ke kalender & pengumuman!');
      setTitle('');
      setDate('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'kalender');
      toast.error('Gagal menambahkan kegiatan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nama Kegiatan</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Rapat Bulanan RT" required className="h-12 rounded-2xl bg-slate-50 border-none" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tanggal</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-12 rounded-2xl bg-slate-50 border-none" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Keterangan</Label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detail kegiatan..." required className="w-full h-24 p-4 rounded-2xl bg-slate-50 border-none resize-none text-sm" />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
          {loading ? 'Menyimpan...' : 'Tambah ke Kalender'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function Dashboard({ setActiveTab }: DashboardProps) {
  const { userData, isAdmin, isSekretaris } = useAuth();
  const [stats, setStats] = useState({
    totalWarga: 0,
    lunasIuran: 0,
    totalKas: 0,
    pendingLaporan: 0,
    pendingSurat: 0
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const canAddMedia = isAdmin || isSekretaris;

  // Simple Calendar Helper
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);
  const daysArray = Array.from({ length: days }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const today = new Date();

  useEffect(() => {
    // Fetch Media
    const unsubMedia = onSnapshot(
      query(collection(db, 'media'), orderBy('createdAt', 'desc'), limit(5)),
      (snapshot) => {
        setMedia(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'media')
    );

    // Fetch Stats
    const unsubWarga = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, totalWarga: snapshot.size }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubIuran = onSnapshot(collection(db, 'iuran'), (snapshot) => {
      let total = 0;
      let lunas = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'lunas') {
          lunas++;
          total += data.amount;
        }
      });
      setStats(prev => ({ 
        ...prev, 
        lunasIuran: snapshot.size > 0 ? Math.round((lunas / snapshot.size) * 100) : 0,
        totalKas: total
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'iuran'));

    const unsubLaporan = onSnapshot(
      query(collection(db, 'laporan'), where('status', '==', 'pending')),
      (snapshot) => {
        setStats(prev => ({ ...prev, pendingLaporan: snapshot.size }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'laporan')
    );

    // Only fetch all pending surat if admin, otherwise only user's pending surat
    const suratQuery = isAdmin 
      ? query(collection(db, 'surat'), where('status', '==', 'pending'))
      : query(collection(db, 'surat'), where('status', '==', 'pending'), where('userId', '==', auth.currentUser?.uid));

    const unsubSurat = onSnapshot(suratQuery, (snapshot) => {
      setStats(prev => ({ ...prev, pendingSurat: snapshot.size }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'surat'));

    // Fetch Announcements
    const unsubAnnouncements = onSnapshot(
      query(collection(db, 'berita'), orderBy('createdAt', 'desc'), limit(3)),
      (snapshot) => {
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'berita')
    );

    const unsubEvents = onSnapshot(
      collection(db, 'kalender'),
      (snapshot) => {
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'kalender')
    );

    return () => {
      unsubMedia();
      unsubWarga();
      unsubIuran();
      unsubLaporan();
      unsubSurat();
      unsubAnnouncements();
      unsubEvents();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (media.length > 0) {
      const interval = setInterval(() => {
        setActiveMediaIndex((prev) => (prev + 1) % media.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [media]);

  const userName = userData?.name?.split(' ')[0] || 'Warga';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Halo, {userName}!</h2>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Lingkungan Harmonis, Warga Bahagia</p>
        </div>
        <div className="bg-primary/10 p-2 rounded-2xl">
          <CalendarIcon className="text-primary" size={20} />
        </div>
      </section>

      {/* Media Slider Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
            Media Kegiatan
          </h3>
          {canAddMedia && (
            <Dialog>
              <DialogTrigger render={
                <button className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                  <Plus size={14} /> Tambah Media
                </button>
              } />
              <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tighter">Tambah Media Kegiatan</DialogTitle>
                </DialogHeader>
                <MediaForm />
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="relative h-48 w-full overflow-hidden rounded-[2.5rem] shadow-xl shadow-primary/5">
          {media.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={media[activeMediaIndex].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0"
              >
                <img 
                  src={media[activeMediaIndex].imageUrl} 
                  alt={media[activeMediaIndex].title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase tracking-widest mb-2">
                    {media[activeMediaIndex].date}
                  </Badge>
                  <h4 className="text-white font-black text-lg tracking-tight line-clamp-1">
                    {media[activeMediaIndex].title}
                  </h4>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada media kegiatan</p>
            </div>
          )}
          
          {media.length > 1 && (
            <div className="absolute bottom-4 right-6 flex gap-1.5">
              {media.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    activeMediaIndex === i ? "w-4 bg-primary" : "w-1 bg-white/50"
                  )} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Calendar Section */}
      <section className="space-y-4">
        <button 
          onClick={() => setIsCalendarVisible(!isCalendarVisible)}
          className="w-full flex justify-between items-center px-1 group"
        >
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
            Kalender Kegiatan
          </h3>
          <div className="flex items-center gap-2">
            {canAddMedia && (
              <Dialog>
                <DialogTrigger render={
                  <button className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-lg">
                    <Plus size={14} /> Tambah Kegiatan
                  </button>
                } />
                <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tighter">Tambah Kegiatan Kalender</DialogTitle>
                  </DialogHeader>
                  <CalendarEventForm />
                </DialogContent>
              </Dialog>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {isCalendarVisible ? 'Sembunyikan' : 'Lihat Kalender'}
            </span>
            {isCalendarVisible ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </button>
        
        <AnimatePresence>
          {isCalendarVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (
                        <span key={i} className="text-[8px] font-black text-slate-300 uppercase">{day}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {emptyDays.map((_, i) => (
                        <div key={`empty-${i}`} className="h-8" />
                      ))}
                      {daysArray.map((day) => {
                        const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const hasEvent = events.some(e => e.date === dateStr);
                        
                        return (
                          <div 
                            key={day} 
                            className={cn(
                              "h-8 flex items-center justify-center text-[10px] font-bold rounded-xl transition-colors cursor-pointer relative",
                              isToday ? "bg-primary text-white shadow-lg shadow-primary/30" : "hover:bg-slate-50 text-slate-600",
                              hasEvent && !isToday && "text-primary bg-primary/5"
                            )}
                          >
                            {day}
                            {hasEvent && (
                              <div className={cn(
                                "absolute bottom-1 w-1 h-1 rounded-full",
                                isToday ? "bg-white" : "bg-primary"
                              )} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="col-span-2 bg-primary text-primary-foreground overflow-hidden relative border-none shadow-lg shadow-primary/20">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Kas RT Terkumpul</p>
                <h3 className="text-3xl font-black mt-1 tracking-tighter">Rp {stats.totalKas.toLocaleString('id-ID')}</h3>
              </div>
              <TrendingUp size={24} className="opacity-50" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-none text-[10px]">Update Real-time</Badge>
            </div>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        </Card>
        
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
              <Users size={18} />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Warga</p>
            <h4 className="text-xl font-black text-slate-800 tracking-tighter">{stats.totalWarga} Jiwa</h4>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
              <CreditCard size={18} />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lunas Iuran</p>
            <h4 className="text-xl font-black text-slate-800 tracking-tighter">{stats.lunasIuran}%</h4>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
            Pengumuman
          </h3>
          <button className="text-[10px] font-bold text-primary uppercase tracking-widest">Lihat Semua</button>
        </div>
        <div className="space-y-3">
          {announcements.length > 0 ? announcements.map((item, index) => (
            <motion.div key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="border-none shadow-sm overflow-hidden group">
                <CardContent className="p-0 flex h-24">
                  <div className={`w-2 ${index % 2 === 0 ? 'bg-primary' : 'bg-orange-400'}`} />
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-800 group-hover:text-primary transition-colors truncate pr-2">{item.title}</h4>
                      <Badge variant="secondary" className="text-[8px] font-black uppercase shrink-0">{item.category}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )) : (
            <p className="text-center text-xs text-slate-400 py-4">Belum ada pengumuman baru</p>
          )}
        </div>
      </section>

      {/* Action Items */}
      <section className="space-y-4">
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 px-1">
          Perlu Tindakan
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <Card 
            onClick={() => setActiveTab('layanan')}
            className="border-none shadow-sm bg-orange-50/50 hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800">{stats.pendingLaporan} Laporan Masalah Baru</h4>
                <p className="text-[10px] font-medium text-orange-600/70 uppercase tracking-wider">Segera tindak lanjuti</p>
              </div>
              <div className="text-orange-300">›</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveTab('layanan')}
            className="border-none shadow-sm bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800">{stats.pendingSurat} Permohonan Surat</h4>
                <p className="text-[10px] font-medium text-blue-600/70 uppercase tracking-wider">Menunggu persetujuan</p>
              </div>
              <div className="text-blue-300">›</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
