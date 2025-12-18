import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { StatCard } from '@/components/StatCard';
import { LeadTable } from '@/components/LeadTable';
import { CampaignCard } from '@/components/CampaignCard';
import { LeadFinder } from '@/components/LeadFinder';
import { LeadDetailSheet } from '@/components/LeadDetailSheet';
import { Button } from '@/components/ui/button';
import { mockCampaigns } from '@/data/mockData';
import { Lead as LegacyLead } from '@/types/lead';
import { getLeads, Lead as ApiLead } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Send, 
  Eye, 
  TrendingUp,
  Plus,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState<LegacyLead | null>(null);
  const [dbLeads, setDbLeads] = useState<ApiLead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const { toast } = useToast();

  const loadLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const result = await getLeads();
      if (result.success && result.leads) {
        setDbLeads(result.leads);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // Convert API leads to legacy format for the table
  const convertedLeads: LegacyLead[] = dbLeads.map((lead) => ({
    id: lead.id || '',
    name: lead.name,
    email: lead.email || '',
    company: lead.company || '',
    title: lead.title || '',
    status: (lead.status as LegacyLead['status']) || 'new',
    score: lead.profile_data?.exa_score ? Math.round(lead.profile_data.exa_score * 100) : 75,
    lastContact: lead.updated_at || null,
    tags: lead.industry ? [lead.industry] : [],
    phone: lead.phone,
    linkedin: lead.linkedin_url,
    notes: lead.profile_data?.summary,
    location: lead.location,
    industry: lead.industry || '',
    createdAt: lead.created_at || new Date().toISOString(),
  }));

  const stats = {
    totalLeads: dbLeads.length,
    contacted: dbLeads.filter(l => l.status !== 'new').length,
    responses: dbLeads.filter(l => l.status === 'replied' || l.status === 'qualified').length,
    avgScore: dbLeads.length > 0 ? 75 : 0,
  };

  const handleLeadsFound = () => {
    loadLeads();
    toast({
      title: 'Leads updated',
      description: 'Your lead database has been refreshed',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="ml-64 p-8">
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Track your outreach performance and lead pipeline</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Leads"
                value={stats.totalLeads}
                change={stats.totalLeads > 0 ? 'In database' : 'Start finding leads'}
                changeType="positive"
                icon={Users}
                className="stagger-1"
              />
              <StatCard
                title="Contacted"
                value={stats.contacted}
                change={stats.contacted > 0 ? 'Outreach sent' : 'Ready to contact'}
                changeType="positive"
                icon={Send}
                className="stagger-2"
              />
              <StatCard
                title="Responses"
                value={stats.responses}
                change={stats.responses > 0 ? 'Replied' : 'Awaiting replies'}
                changeType="positive"
                icon={Eye}
                className="stagger-3"
              />
              <StatCard
                title="Conversion"
                value={stats.totalLeads > 0 ? `${Math.round((stats.responses / Math.max(stats.contacted, 1)) * 100)}%` : '0%'}
                change="Reply rate"
                changeType="positive"
                icon={TrendingUp}
                className="stagger-4"
              />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('finder')}
                >
                  <Users className="w-8 h-8 text-primary" />
                  <span className="font-medium">Find New Leads</span>
                  <span className="text-xs text-muted-foreground">Search with Exa AI</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('leads')}
                >
                  <Send className="w-8 h-8 text-primary" />
                  <span className="font-medium">View Leads</span>
                  <span className="text-xs text-muted-foreground">{dbLeads.length} in database</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('campaigns')}
                >
                  <TrendingUp className="w-8 h-8 text-primary" />
                  <span className="font-medium">Manage Campaigns</span>
                  <span className="text-xs text-muted-foreground">Track outreach</span>
                </Button>
              </div>
            </div>

            {/* Recent Leads */}
            {convertedLeads.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Recent Leads</h2>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('leads')}>
                    View All
                  </Button>
                </div>
                <LeadTable 
                  leads={convertedLeads.slice(0, 5)} 
                  onLeadClick={(lead) => setSelectedLead(lead)}
                />
              </div>
            )}

            {/* Active Campaigns */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Active Campaigns</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('campaigns')}>
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockCampaigns.filter(c => c.status === 'active').map((campaign, index) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign}
                    className={`animate-fade-in stagger-${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Leads</h1>
                <p className="text-muted-foreground">Manage and track your lead database</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadLeads} disabled={isLoadingLeads}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingLeads ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => setActiveTab('finder')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Find Leads
                </Button>
              </div>
            </div>
            {convertedLeads.length > 0 ? (
              <LeadTable 
                leads={convertedLeads}
                onLeadClick={(lead) => setSelectedLead(lead)}
              />
            ) : (
              <div className="glass rounded-xl p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No leads yet</h3>
                <p className="text-muted-foreground mb-4">Start by finding leads with our AI-powered search</p>
                <Button onClick={() => setActiveTab('finder')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Find Leads
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'finder' && (
          <div className="animate-fade-in py-8">
            <LeadFinder onLeadsFound={handleLeadsFound} />
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Campaigns</h1>
                <p className="text-muted-foreground">Create and manage your outreach campaigns</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockCampaigns.map((campaign, index) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign}
                  className={`animate-fade-in stagger-${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
              <p className="text-muted-foreground">Configure your account and preferences</p>
            </div>
            <div className="glass rounded-xl p-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-foreground mb-4">Account Settings</h3>
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </div>
          </div>
        )}
      </main>

      <LeadDetailSheet
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}
