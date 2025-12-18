import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { StatCard } from '@/components/StatCard';
import { LeadTable } from '@/components/LeadTable';
import { CampaignCard } from '@/components/CampaignCard';
import { LeadFinder } from '@/components/LeadFinder';
import { LeadDetailSheet } from '@/components/LeadDetailSheet';
import { CreateCampaignDialog } from '@/components/CreateCampaignDialog';
import { Button } from '@/components/ui/button';
import { 
  getLeads, 
  getCampaigns, 
  getStats, 
  Lead as ApiLead, 
  Campaign,
  updateLeadStatus,
  deleteLead,
} from '@/lib/api';
import { Lead as LegacyLead } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Send, 
  MessageSquare, 
  TrendingUp,
  Plus,
  Download,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowRight,
  Target,
  Zap
} from 'lucide-react';

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState<LegacyLead | null>(null);
  const [dbLeads, setDbLeads] = useState<ApiLead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({ totalLeads: 0, contacted: 0, replied: 0, qualified: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leadsResult, campaignsResult, statsResult] = await Promise.all([
        getLeads(),
        getCampaigns(),
        getStats(),
      ]);

      if (leadsResult.success && leadsResult.leads) {
        setDbLeads(leadsResult.leads);
      }
      if (campaignsResult.success && campaignsResult.campaigns) {
        setCampaigns(campaignsResult.campaigns);
      }
      setStats(statsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error loading data',
        description: 'Please try refreshing the page',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleLeadsFound = () => {
    loadData();
    toast({
      title: 'Leads updated',
      description: 'Your lead database has been refreshed',
    });
  };

  const handleCampaignCreated = () => {
    loadData();
    setShowCreateCampaign(false);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const result = await updateLeadStatus(leadId, newStatus);
    if (result.success) {
      loadData();
      toast({ title: 'Status updated' });
    } else {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const result = await deleteLead(leadId);
    if (result.success) {
      loadData();
      toast({ title: 'Lead deleted' });
    } else {
      toast({ title: 'Failed to delete lead', variant: 'destructive' });
    }
  };

  const replyRate = stats.contacted > 0 ? Math.round((stats.replied / stats.contacted) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="ml-72 p-10">
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Track your outreach performance and lead pipeline</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              <StatCard
                title="Total Leads"
                value={stats.totalLeads}
                change={stats.totalLeads > 0 ? 'In database' : 'Start finding leads'}
                changeType="positive"
                icon={Users}
                className="animate-fade-in stagger-1"
              />
              <StatCard
                title="Contacted"
                value={stats.contacted}
                change={stats.contacted > 0 ? 'Outreach sent' : 'Ready to contact'}
                changeType="positive"
                icon={Send}
                className="animate-fade-in stagger-2"
              />
              <StatCard
                title="Replied"
                value={stats.replied}
                change={stats.replied > 0 ? 'Got responses' : 'Awaiting replies'}
                changeType="positive"
                icon={MessageSquare}
                className="animate-fade-in stagger-3"
              />
              <StatCard
                title="Reply Rate"
                value={`${replyRate}%`}
                change={replyRate > 20 ? 'Above average' : 'Keep going'}
                changeType={replyRate > 20 ? 'positive' : 'neutral'}
                icon={TrendingUp}
                className="animate-fade-in stagger-4"
              />
            </div>

            {/* Quick Actions */}
            <div className="mb-10">
              <div className="section-header">
                <h2 className="section-title">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button
                  onClick={() => setActiveTab('finder')}
                  className="action-card text-left relative"
                >
                  <div className="relative z-10">
                    <div className="icon-badge mb-4">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-1">Find New Leads</h3>
                    <p className="text-muted-foreground text-sm">AI-powered lead discovery</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={() => setActiveTab('leads')}
                  className="action-card text-left relative"
                >
                  <div className="relative z-10">
                    <div className="icon-badge mb-4">
                      <Target className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-1">View Leads</h3>
                    <p className="text-muted-foreground text-sm">{dbLeads.length} in your database</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="action-card text-left relative"
                >
                  <div className="relative z-10">
                    <div className="icon-badge mb-4">
                      <Zap className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-1">Manage Campaigns</h3>
                    <p className="text-muted-foreground text-sm">{campaigns.length} active campaigns</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Leads */}
            {convertedLeads.length > 0 && (
              <div className="mb-10 animate-fade-in stagger-5">
                <div className="section-header">
                  <h2 className="section-title">Recent Leads</h2>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('leads')} className="rounded-lg">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <LeadTable 
                  leads={convertedLeads.slice(0, 5)} 
                  onLeadClick={(lead) => setSelectedLead(lead)}
                />
              </div>
            )}

            {/* Active Campaigns */}
            {campaigns.length > 0 && (
              <div className="animate-fade-in stagger-6">
                <div className="section-header">
                  <h2 className="section-title">Campaigns</h2>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('campaigns')} className="rounded-lg">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {campaigns.slice(0, 4).map((campaign, index) => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign}
                      onUpdate={loadData}
                      className={`animate-fade-in stagger-${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {convertedLeads.length === 0 && campaigns.length === 0 && (
              <div className="empty-state animate-fade-in-up">
                <div className="icon-badge mx-auto mb-6 w-20 h-20 rounded-3xl">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Welcome to LeadPulse</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start by finding your first leads using AI-powered search. Describe your ideal customer and we'll find them for you.
                </p>
                <Button onClick={() => setActiveTab('finder')} size="lg" className="rounded-xl">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Find Your First Leads
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-10">
              <div className="page-header mb-0">
                <h1 className="page-title">Leads</h1>
                <p className="page-subtitle">{dbLeads.length} leads in your database</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadData} className="rounded-lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" className="rounded-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => setActiveTab('finder')} className="rounded-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Find Leads
                </Button>
              </div>
            </div>
            {convertedLeads.length > 0 ? (
              <LeadTable 
                leads={convertedLeads}
                onLeadClick={(lead) => setSelectedLead(lead)}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteLead}
              />
            ) : (
              <div className="empty-state">
                <div className="icon-badge mx-auto mb-6 w-20 h-20 rounded-3xl">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">No leads yet</h3>
                <p className="text-muted-foreground mb-6">Start by finding leads with our AI-powered search</p>
                <Button onClick={() => setActiveTab('finder')} size="lg" className="rounded-xl">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Find Leads
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'finder' && (
          <div className="animate-fade-in py-6">
            <LeadFinder onLeadsFound={handleLeadsFound} />
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-10">
              <div className="page-header mb-0">
                <h1 className="page-title">Campaigns</h1>
                <p className="page-subtitle">{campaigns.length} campaigns</p>
              </div>
              <Button onClick={() => setShowCreateCampaign(true)} className="rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
            {campaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {campaigns.map((campaign, index) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign}
                    onUpdate={loadData}
                    className={`animate-fade-in stagger-${index + 1}`}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="icon-badge mx-auto mb-6 w-20 h-20 rounded-3xl">
                  <Send className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">No campaigns yet</h3>
                <p className="text-muted-foreground mb-6">Create your first outreach campaign</p>
                <Button onClick={() => setShowCreateCampaign(true)} size="lg" className="rounded-xl">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Campaign
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <div className="page-header">
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">Configure your account and preferences</p>
            </div>
            <div className="glass-strong rounded-2xl p-8 max-w-2xl card-shadow">
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

      <CreateCampaignDialog
        open={showCreateCampaign}
        onOpenChange={setShowCreateCampaign}
        onCreated={handleCampaignCreated}
      />
    </div>
  );
}
