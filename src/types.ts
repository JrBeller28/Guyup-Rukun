
export type UserRole = 'admin' | 'warga';

export interface Resident {
  id: string;
  name: string;
  address: string;
  phone: string;
  role: UserRole;
  kkNumber: string;
  nik: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: 'umum' | 'kegiatan' | 'darurat';
}

export interface Payment {
  id: string;
  residentId: string;
  residentName: string;
  amount: number;
  month: string;
  year: number;
  status: 'lunas' | 'belum';
  datePaid?: string;
}

export interface Report {
  id: string;
  residentId: string;
  residentName: string;
  title: string;
  description: string;
  status: 'pending' | 'proses' | 'selesai';
  date: string;
  category: 'keamanan' | 'kebersihan' | 'infrastruktur' | 'lainnya';
}

export interface LetterRequest {
  id: string;
  residentId: string;
  residentName: string;
  type: 'domisili' | 'pengantar_nikah' | 'kematian' | 'lainnya';
  purpose: string;
  status: 'pending' | 'disetujui' | 'ditolak';
  date: string;
}
