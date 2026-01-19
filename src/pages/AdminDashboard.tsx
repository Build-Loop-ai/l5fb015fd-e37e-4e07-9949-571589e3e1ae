import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminSection } from '@/components/admin/AdminSection';
import { PlanDistributionChart } from '@/components/admin/PlanDistributionChart';
import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart';
import { UserTable } from '@/components/admin/UserTable';
import { RecentActivityCard } from '@/components/admin/RecentActivityCard';
import { LeadStatusChart } from '@/components/admin/LeadStatusChart';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  DollarSign,
  Target,
  Zap,
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  Mail,
  Search,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading, stats, refetch } = useAdminCheck();

  // Show loading while auth or admin check is in progress
  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in (after loading complete)
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Will redirect via useAdminCheck if not admin
  if (!isAdmin || !stats) {
    return null;
  }

  // Prepare recent activity data
  const recentActivities = [
    ...stats.recentActivity.signups.slice(0, 3).map((signup) => ({
      type: 'signup' as const,
      title: signup.email || 'New User',
      subtitle: 'New signup',
      timestamp: signup.created_at,
    })),
    ...stats.recentActivity.leads.slice(0, 3).map((lead) => ({
      type: 'lead' as const,
      title: lead.name,
      subtitle: lead.company || 'Lead found',
      timestamp: lead.created_at,
    })),
    ...stats.recentActivity.searches.slice(0, 3).map((search) => ({
      type: 'search' as const,
      title: search.query,
      subtitle: `Status: ${search.status}`,
      timestamp: search.created_at,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Last updated: {format(new Date(stats.generatedAt), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            title="Total Users"
            value={stats.overview.totalUsers}
            subtitle={`+${stats.overview.usersLast7Days} this week`}
            change={stats.overview.userGrowthRate}
            changeLabel="vs last month"
            icon={<Users className="h-5 w-5 text-primary" />}
            variant="primary"
          />
          <AdminStatCard
            title="Monthly Revenue"
            value={`$${stats.overview.mrr.toLocaleString()}`}
            subtitle={`${stats.subscriptions.paidUsers} paid subscribers`}
            icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
            variant="success"
          />
          <AdminStatCard
            title="Total Leads"
            value={stats.overview.totalLeads.toLocaleString()}
            subtitle={`+${stats.overview.leadsLast7Days} this week`}
            icon={<Target className="h-5 w-5 text-purple-500" />}
          />
          <AdminStatCard
            title="Conversion Rate"
            value={`${stats.subscriptions.conversionRate}%`}
            subtitle="Free to Paid"
            icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
            variant="warning"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            title="Active Campaigns"
            value={stats.overview.activeCampaigns}
            subtitle={`${stats.campaigns.total} total campaigns`}
            icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
          />
          <AdminStatCard
            title="Emails Sent"
            value={stats.campaigns.emailsSent.toLocaleString()}
            subtitle={`${stats.campaigns.replyRate}% reply rate`}
            icon={<Mail className="h-5 w-5 text-muted-foreground" />}
          />
          <AdminStatCard
            title="Searches Completed"
            value={stats.searches.completed}
            subtitle={`${stats.searches.processing} processing`}
            icon={<Search className="h-5 w-5 text-muted-foreground" />}
          />
          <AdminStatCard
            title="Credits Used"
            value={stats.credits.totalUsed.toLocaleString()}
            subtitle={`${stats.credits.utilizationRate}% utilization`}
            icon={<CreditCard className="h-5 w-5 text-muted-foreground" />}
          />
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList>
            <TabsTrigger value="growth">User Growth</TabsTrigger>
            <TabsTrigger value="leads">Lead Generation</TabsTrigger>
            <TabsTrigger value="credits">Credit Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="growth" className="rounded-xl border bg-card p-6">
            <AdminSection title="User Signups" description="New users over the last 30 days">
              <TimeSeriesChart
                data={stats.charts.dailySignups}
                color="hsl(217, 91%, 60%)"
                gradientId="signupsGradient"
              />
            </AdminSection>
          </TabsContent>
          <TabsContent value="leads" className="rounded-xl border bg-card p-6">
            <AdminSection title="Leads Found" description="Leads generated over the last 30 days">
              <TimeSeriesChart
                data={stats.charts.dailyLeads}
                color="hsl(142, 71%, 45%)"
                gradientId="leadsGradient"
              />
            </AdminSection>
          </TabsContent>
          <TabsContent value="credits" className="rounded-xl border bg-card p-6">
            <AdminSection title="Credits Consumed" description="Credit usage over the last 30 days">
              <TimeSeriesChart
                data={stats.charts.dailyCredits}
                color="hsl(262, 83%, 58%)"
                gradientId="creditsGradient"
              />
            </AdminSection>
          </TabsContent>
        </Tabs>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Plan Distribution */}
          <div className="rounded-xl border bg-card p-6">
            <AdminSection title="Plan Distribution" description="Breakdown by subscription tier">
              <PlanDistributionChart planCounts={stats.subscriptions.planCounts} />
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.subscriptions.planCounts.free}</p>
                  <p className="text-xs text-muted-foreground">Free</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">{stats.subscriptions.planCounts.starter}</p>
                  <p className="text-xs text-muted-foreground">Starter</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">{stats.subscriptions.planCounts.growth}</p>
                  <p className="text-xs text-muted-foreground">Growth</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{stats.subscriptions.planCounts.scale}</p>
                  <p className="text-xs text-muted-foreground">Scale</p>
                </div>
              </div>
            </AdminSection>
          </div>

          {/* Lead Funnel */}
          <div className="rounded-xl border bg-card p-6">
            <AdminSection title="Lead Funnel" description="Leads by status">
              <LeadStatusChart statusCounts={stats.leads.statusCounts} />
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Avg leads per user: <span className="font-medium text-foreground">{stats.leads.avgPerUser}</span>
                </span>
                <span className="text-muted-foreground">
                  Replies: <span className="font-medium text-foreground">{stats.campaigns.replies}</span>
                </span>
              </div>
            </AdminSection>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border bg-card p-6">
          <AdminSection title="Recent Activity" description="Latest platform events">
            <RecentActivityCard activities={recentActivities} />
          </AdminSection>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border bg-card p-6">
          <AdminSection
            title="All Users"
            description={`${stats.users.length} registered users`}
          >
            <UserTable users={stats.users} />
          </AdminSection>
        </div>

        {/* Top Users */}
        {stats.topUsers.byLeads.length > 0 && (
          <div className="rounded-xl border bg-card p-6">
            <AdminSection title="Top Users by Leads" description="Most active lead generators">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {stats.topUsers.byLeads.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{user.fullName || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.leadCount} leads</p>
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>
          </div>
        )}
      </main>
    </div>
  );
}
