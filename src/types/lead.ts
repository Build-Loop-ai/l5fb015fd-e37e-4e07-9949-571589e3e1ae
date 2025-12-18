export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  industry: string;
  location: string;
  linkedIn?: string;
  phone?: string;
  status: 'new' | 'contacted' | 'responded' | 'qualified' | 'lost';
  lastContacted?: string;
  score: number;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  leadsCount: number;
  sentCount: number;
  openRate: number;
  replyRate: number;
  createdAt: string;
}
