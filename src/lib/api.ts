import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id?: string;
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
  industry?: string;
  profile_data?: any;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OutreachMessage {
  subject: string;
  body: string;
  linkedin_message: string;
}

export async function searchLeadsWithExa(params: {
  query?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  industry?: string;
}): Promise<{ success: boolean; leads?: Lead[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke('exa-search', {
    body: params,
  });

  if (error) {
    console.error('Exa search error:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function scrapeLinkedInProfile(linkedinUrl: string): Promise<{
  success: boolean;
  profile?: any;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke('apify-scrape', {
    body: { linkedinUrl },
  });

  if (error) {
    console.error('Apify scrape error:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function generateOutreach(params: {
  lead: Lead;
  template?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal';
}): Promise<{ success: boolean; outreach?: OutreachMessage; error?: string }> {
  const { data, error } = await supabase.functions.invoke('generate-outreach', {
    body: params,
  });

  if (error) {
    console.error('Generate outreach error:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function saveLeads(leads: Lead[]): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('leads').insert(leads);

  if (error) {
    console.error('Save leads error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getLeads(): Promise<{ success: boolean; leads?: Lead[]; error?: string }> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get leads error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, leads: data };
}

export async function updateLeadStatus(
  leadId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId);

  if (error) {
    console.error('Update lead status error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function saveOutreachMessage(params: {
  lead_id: string;
  subject?: string;
  body: string;
  campaign_id?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('outreach_messages').insert(params);

  if (error) {
    console.error('Save outreach error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
