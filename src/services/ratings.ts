import { supabase } from '../lib/supabase';
import type { Rating } from '../types/database';

export async function createRating(rating: Omit<Rating, 'id' | 'instructor_id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('ratings')
    .insert([rating])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRating(id: string, rating: number, comment: string | null) {
  const { data, error } = await supabase
    .from('ratings')
    .update({ rating, comment })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRating(id: string) {
  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}