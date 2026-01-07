// src/utils/api.ts
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

// --- Initialisation du client Supabase ---
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// --------------------------- TRANSACTIONS ---------------------------

export async function getTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addTransaction(transaction: any) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction]);

  if (error) throw error;
  return data;
}

// --------------------------- CATEGORIES ---------------------------

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*');

  if (error) throw error;
  return data;
}

export async function addCategory(category: any) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category]);

  if (error) throw error;
  return data;
}

// --------------------------- EVENTS ---------------------------

export async function getEvents(userId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function addEvent(event: any) {
  const { data, error } = await supabase
    .from('events')
    .insert([event]);

  if (error) throw error;
  return data;
}

// --------------------------- BUDGET RULES ---------------------------

export async function getBudgetRules() {
  const { data, error } = await supabase
    .from('budget_rules')
    .select('*');

  if (error) throw error;
  return data;
}

export async function addBudgetRule(rule: any) {
  const { data, error } = await supabase
    .from('budget_rules')
    .insert([rule]);

  if (error) throw error;
  return data;
}

// --------------------------- URL EXTRACTION ---------------------------

export function urlExtractionAPI(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }
  


// --------------------------- UTILS ---------------------------

// Tu peux créer ici des fonctions pour les autres fichiers utils,
// par exemple : format, categorization, memory-monitor, etc.

