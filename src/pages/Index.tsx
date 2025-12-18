import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { StatCard } from '@/components/StatCard';
import { LeadTable } from '@/components/LeadTable';
import { CampaignCard } from '@/components/CampaignCard';
import { LeadFinder } from '@/components/LeadFinder';
import { LeadDetailSheet } from '@/components/LeadDetailSheet';
import { Button } from '@/components/ui/button';
import { mockLeads, mockCampaigns } from '@/data/mockData';
import { Lead } from '@/types/lead';
import { 
  Users, 
  Send, 
  Eye, 
  TrendingUp,
  Plus,
  Download,
  Upload
} from 'lucide-react';

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const stats = {
    totalLeads: mockLeads.length,
    contacted: mockLeads.filter(l => l.status !== 'new').length,
    responses: mockLeads.filter(l => l.status === 'responded' || l.status === 'qualified').length,
    avgScore: Math.round(mockLeads.reduce((acc, l) => acc + l.score, 0) / mockLeads.length),
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
                change="+12% from last week"
                changeType="positive"
                icon={Users}
                className="stagger-1"
              />
              <StatCard
                title="Contacted"
                value={stats.contacted}
                change="+8% from last week"
                changeType="positive"
                icon={Send}
                className="stagger-2"
              />
              <StatCard
                title="Responses"
                value={stats.responses}
                change="+23% from last week"
                changeType="positive"
                icon={Eye}
                className="stagger-3"
              />
              <StatCard
                title="Avg Score"
                value={stats.avgScore}
                change="Above target"
                changeType="positive"
                icon={TrendingUp}
                className="stagger-4"
              />
            </div>

            {/* Recent Leads */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Recent Leads</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('leads')}>
                  View All
                </Button>
              </div>
              <LeadTable 
                leads={mockLeads.slice(0, 5)} 
                onLeadClick={(lead) => setSelectedLead(lead)}
              />
            </div>

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
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </div>
            <LeadTable 
              leads={mockLeads}
              onLeadClick={(lead) => setSelectedLead(lead)}
            />
          </div>
        )}

        {activeTab === 'finder' && (
          <div className="animate-fade-in py-8">
            <LeadFinder />
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
