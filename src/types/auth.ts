export type UserRole = 'user' | 'instructor';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface InstructorProfile extends UserProfile {
  role: 'instructor';
  bio?: string;
  certifications: string[];
  experience_years: number;
  specialties: string[];
  rating?: number;
  total_events: number;
}