export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ActivityType = 'running' | 'cycling' | 'swimming' | 'yoga' | 'fitness' | 'other';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled';
export type EventChangeStatus = 'pending' | 'approved' | 'rejected';
export type MessageType = 'change_notification' | 'general' | 'cancellation' | 'private';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Event {
  id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  activity_type: ActivityType;
  difficulty: DifficultyLevel;
  date: string;
  duration: number;
  location: string;
  latitude: number;
  longitude: number;
  price: number | null;
  max_participants: number;
  requirements: string[] | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  created_at: string;
}

export interface EventMessage {
  id: string;
  event_id: string;
  from_id: string;
  to_id?: string;
  instructor_id: string;
  message: string;
  sent_at: string;
  type: MessageType;
  status: MessageStatus;
  parent_id?: string;
}

export interface EventChange {
  id: string;
  event_id: string;
  instructor_id: string;
  changes: {
    [key: string]: any;
  };
  status: EventChangeStatus;
  created_at: string;
  notification_sent: boolean;
}

export interface EventChangeResponse {
  id: string;
  change_id: string;
  user_id: string;
  response: 'accept' | 'reject';
  created_at: string;
}
export interface Rating {
  id: string;
  event_id: string;
  user_id: string;
  instructor_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}