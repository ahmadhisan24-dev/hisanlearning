
export type UserRole = 'Siswa' | 'Teacher' | 'Admin';
export type QuestionType = 'Pilihan Ganda' | 'Benar/Salah' | 'Isian Singkat';

export interface User {
  name: string;
  nip: string;
  unit: string;
  phone: string;
  level: string;
  role: UserRole;
  points: number;
  badges: number;
  activeModuleName: string;
  activeModuleSub: string;
  progressPercent: number;
  completedModules: number;
  lastScore?: number; // Score for the active module
  password?: string;
}

export interface Training {
  id: number;
  title: string;
  desc: string;
  students: number;
  img: string;
  hasCertificate?: boolean;
}

export interface ModuleMaterial {
  id: number;
  title: string;
  type: string;
  completed?: boolean;
  locked?: boolean;
}

export type Page = 'register' | 'login' | 'choose-training' | 'dashboard' | 'paths' | 'module' | 'community' | 'profile' | 'manage-users' | 'manage-certificates';
