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

export interface Campaign {
  id?: string;
  name: string;
  status?: string;
  sent_count?: number;
  reply_count?: number;
  search_query?: string;
  lead_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OutreachMessage {
  id?: string;
  lead_id?: string;
  campaign_id?: string;
  subject?: string;
  body: string;
  status?: string;
  sent_at?: string;
  created_at?: string;
}

export interface GeneratedOutreach {
  subject: string;
  body: string;
  linkedin_message: string;
}

// Lead functions
export async function searchLeadsWithExa(params: {
  query?: string;
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
}): Promise<{ success: boolean; outreach?: GeneratedOutreach; error?: string }> {
  const { data, error } = await supabase.functions.invoke('generate-outreach', {
    body: params,
  });

  if (error) {
    console.error('Generate outreach error:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function saveLeads(leads: Lead[], campaignId?: string): Promise<{ success: boolean; error?: string }> {
  const leadsWithCampaign = leads.map(lead => ({
    ...lead,
    campaign_id: campaignId || null,
  }));

  const { error } = await supabase.from('leads').insert(leadsWithCampaign);

  if (error) {
    console.error('Save leads error:', error);
    return { success: false, error: error.message };
  }

  // Update campaign lead_count if campaign_id provided
  if (campaignId) {
    await updateCampaignLeadCount(campaignId);
  }

  return { success: true };
}

export async function updateCampaignLeadCount(campaignId: string): Promise<void> {
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  await supabase
    .from('campaigns')
    .update({ lead_count: count || 0 })
    .eq('id', campaignId);
}

export async function getLeadsByCampaign(campaignId: string): Promise<{ success: boolean; leads?: Lead[]; error?: string }> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get leads by campaign error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, leads: data };
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

export async function deleteLead(leadId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  if (error) {
    console.error('Delete lead error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Campaign functions
export async function getCampaigns(): Promise<{ success: boolean; campaigns?: Campaign[]; error?: string }> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get campaigns error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, campaigns: data };
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; campaign?: Campaign; error?: string }> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single();

  if (error) {
    console.error('Create campaign error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, campaign: data };
}

export async function updateCampaign(
  campaignId: string,
  updates: Partial<Campaign>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaignId);

  if (error) {
    console.error('Update campaign error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId);

  if (error) {
    console.error('Delete campaign error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Outreach message functions
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

export async function getOutreachMessages(leadId?: string): Promise<{ success: boolean; messages?: OutreachMessage[]; error?: string }> {
  let query = supabase
    .from('outreach_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (leadId) {
    query = query.eq('lead_id', leadId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get outreach messages error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, messages: data };
}

// Stats functions
export async function getStats(): Promise<{
  totalLeads: number;
  contacted: number;
  replied: number;
  qualified: number;
}> {
  const { data: leads } = await supabase.from('leads').select('status');
  
  const allLeads = leads || [];
  
  return {
    totalLeads: allLeads.length,
    contacted: allLeads.filter(l => l.status === 'contacted').length,
    replied: allLeads.filter(l => l.status === 'replied').length,
    qualified: allLeads.filter(l => l.status === 'qualified').length,
  };
}
