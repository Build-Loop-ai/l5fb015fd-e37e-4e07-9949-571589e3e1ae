import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  DollarSign,
  Target,
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  Mail,
  Search,
  CreditCard,
  BarChart3,
  MessageSquare,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { PlanDistributionChart } from '@/components/admin/PlanDistributionChart';
import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart';
import { LeadStatusChart } from '@/components/admin/LeadStatusChart';
import {
  PulseOrb,
  SparkBurst,
  TargetRings,
  DataFlow,
  StackedBars,
  ChatBubbles,
} from '@/components/ui/visual-elements';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Animated stat card with glassmorphism
function AdminStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  visual: Visual,
  trend,
  delay = 0,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  visual?: React.ComponentType<{ className?: string }>;
  trend?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="stat-card group"
    >
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 pt-1">
              <TrendingUp className={`h-3.5 w-3.5 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className="visual-badge">
          {Visual ? (
            <Visual className="w-7 h-7" />
          ) : Icon ? (
            <Icon className="w-6 h-6 text-primary" />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// Section wrapper with animation
function AdminSection({
  title,
  description,
  children,
  delay = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}

// User row component
function UserRow({ user, index }: { user: any; index: number }) {
  const planColors: Record<string, string> = {
    free: 'bg-muted text-muted-foreground',
    starter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    growth: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    scale: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="lead-row flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
        {user.fullName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{user.fullName || 'No name'}</p>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>
      <Badge className={`${planColors[user.plan] || planColors.free} capitalize border`}>
        {user.plan}
      </Badge>
      <div className="text-right">
        <p className="text-sm font-medium">{user.creditsUsed}/{user.creditsLimit}</p>
        <p className="text-xs text-muted-foreground">credits</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{user.leadCount}</p>
        <p className="text-xs text-muted-foreground">leads</p>
      </div>
    </motion.div>
  );
}

// Contact submission card
function ContactCard({ contact, index, onMarkRead }: { contact: any; index: number; onMarkRead: (id: string) => void }) {
  const isNew = contact.status === 'new';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`relative p-5 rounded-2xl border ${isNew ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-card/30'} transition-all hover:border-primary/40`}
    >
      {isNew && (
        <div className="absolute top-4 right-4">
          <span className="flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
          {contact.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-foreground">{contact.name}</p>
            {contact.company && (
              <span className="text-sm text-muted-foreground">• {contact.company}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{contact.email}</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{contact.message}</p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
              {format(new Date(contact.created_at), 'MMM d, yyyy • h:mm a')}
            </span>
            {isNew && (
              <button
                onClick={() => onMarkRead(contact.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, session } = useAuth();
  const { isAdmin, loading, stats, refetch } = useAdminCheck();
  const { toast } = useToast();

  // Show loading while auth or admin check is in progress
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="apple-spinner" />
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

  const handleMarkRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ status: 'read' })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Marked as read",
        description: "Contact submission updated.",
      });
      refetch();
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        title: "Error",
        description: "Failed to update submission.",
        variant: "destructive",
      });
    }
  };

  // Prepare recent activity data
  const recentActivities = [
    ...stats.recentActivity.signups.slice(0, 3).map((signup: any) => ({
      type: 'signup' as const,
      title: signup.email || 'New User',
      subtitle: 'New signup',
      timestamp: signup.created_at,
    })),
    ...stats.recentActivity.leads.slice(0, 3).map((lead: any) => ({
      type: 'lead' as const,
      title: lead.name,
      subtitle: lead.company || 'Lead found',
      timestamp: lead.created_at,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)_/_0.05)_0%,_transparent_50%)]" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-muted/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                  Updated {format(new Date(stats.generatedAt), 'h:mm a')}
                </p>
              </div>
            </div>
          </div>
          <Button onClick={refetch} className="apple-button-secondary h-10">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            title="Total Users"
            value={stats.overview.totalUsers}
            subtitle={`+${stats.overview.usersLast7Days} this week`}
            trend={stats.overview.userGrowthRate}
            visual={PulseOrb}
            delay={0}
          />
          <AdminStatCard
            title="Monthly Revenue"
            value={`$${stats.overview.mrr.toLocaleString()}`}
            subtitle={`${stats.subscriptions.paidUsers} paid subscribers`}
            icon={DollarSign}
            delay={0.1}
          />
          <AdminStatCard
            title="Total Leads"
            value={stats.overview.totalLeads.toLocaleString()}
            subtitle={`+${stats.overview.leadsLast7Days} this week`}
            visual={TargetRings}
            delay={0.2}
          />
          <AdminStatCard
            title="Conversion Rate"
            value={`${stats.subscriptions.conversionRate}%`}
            subtitle="Free to Paid"
            visual={SparkBurst}
            delay={0.3}
          />
        </div>

        {/* Contact Submissions - Prominent Section */}
        {stats.contactSubmissions && stats.contactSubmissions.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="action-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="visual-badge">
                  <ChatBubbles className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Contact Submissions</h2>
                  <p className="text-sm text-muted-foreground">
                    {stats.contactSubmissions.new} new • {stats.contactSubmissions.total} total
                  </p>
                </div>
              </div>
              {stats.contactSubmissions.new > 0 && (
                <Badge className="bg-primary/20 text-primary border border-primary/30">
                  {stats.contactSubmissions.new} New
                </Badge>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {stats.contactSubmissions.items.slice(0, 4).map((contact: any, index: number) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  index={index}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Secondary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            title="Active Campaigns"
            value={stats.overview.activeCampaigns}
            subtitle={`${stats.campaigns.total} total`}
            visual={StackedBars}
            delay={0.5}
          />
          <AdminStatCard
            title="Emails Sent"
            value={stats.campaigns.emailsSent.toLocaleString()}
            subtitle={`${stats.campaigns.replyRate}% reply rate`}
            icon={Mail}
            delay={0.6}
          />
          <AdminStatCard
            title="Searches"
            value={stats.searches.completed}
            subtitle={`${stats.searches.processing} processing`}
            icon={Search}
            delay={0.7}
          />
          <AdminStatCard
            title="Credits Used"
            value={stats.credits.totalUsed.toLocaleString()}
            subtitle={`${stats.credits.utilizationRate}% utilization`}
            visual={DataFlow}
            delay={0.8}
          />
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="growth">User Growth</TabsTrigger>
            <TabsTrigger value="leads">Lead Generation</TabsTrigger>
            <TabsTrigger value="credits">Credit Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="growth" className="stat-card p-6">
            <AdminSection title="User Signups" description="New users over the last 30 days">
              <TimeSeriesChart
                data={stats.charts.dailySignups}
                color="hsl(330, 100%, 63%)"
                gradientId="signupsGradient"
              />
            </AdminSection>
          </TabsContent>
          <TabsContent value="leads" className="stat-card p-6">
            <AdminSection title="Leads Found" description="Leads generated over the last 30 days">
              <TimeSeriesChart
                data={stats.charts.dailyLeads}
                color="hsl(160, 70%, 42%)"
                gradientId="leadsGradient"
              />
            </AdminSection>
          </TabsContent>
          <TabsContent value="credits" className="stat-card p-6">
            <AdminSection title="Credits Consumed" description="Credit usage over the last 30 days">
              <TimeSeriesChart
                data={stats.charts.dailyCredits}
                color="hsl(280, 87%, 65%)"
                gradientId="creditsGradient"
              />
            </AdminSection>
          </TabsContent>
        </Tabs>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Plan Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="stat-card p-6"
          >
            <AdminSection title="Plan Distribution" description="Breakdown by subscription tier">
              <PlanDistributionChart planCounts={stats.subscriptions.planCounts} />
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">{stats.subscriptions.planCounts.free}</p>
                  <p className="text-xs text-muted-foreground">Free</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{stats.subscriptions.planCounts.starter}</p>
                  <p className="text-xs text-muted-foreground">Starter</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">{stats.subscriptions.planCounts.growth}</p>
                  <p className="text-xs text-muted-foreground">Growth</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{stats.subscriptions.planCounts.scale}</p>
                  <p className="text-xs text-muted-foreground">Scale</p>
                </div>
              </div>
            </AdminSection>
          </motion.div>

          {/* Lead Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="stat-card p-6"
          >
            <AdminSection title="Lead Funnel" description="Leads by status">
              <LeadStatusChart statusCounts={stats.leads.statusCounts} />
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Avg per user: <span className="font-medium text-foreground">{stats.leads.avgPerUser}</span>
                </span>
                <span className="text-muted-foreground">
                  Replies: <span className="font-medium text-foreground">{stats.campaigns.replies}</span>
                </span>
              </div>
            </AdminSection>
          </motion.div>
        </div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="stat-card p-6"
        >
          <AdminSection
            title="All Users"
            description={`${stats.users.length} registered users`}
          >
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {stats.users.map((user: any, index: number) => (
                <UserRow key={user.id} user={user} index={index} />
              ))}
              {stats.users.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No users yet</p>
                </div>
              )}
            </div>
          </AdminSection>
        </motion.div>

        {/* Top Users */}
        {stats.topUsers.byLeads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="stat-card p-6"
          >
            <AdminSection title="Top Users by Leads" description="Most active lead generators">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {stats.topUsers.byLeads.map((user: any, index: number) => (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{user.fullName || user.email}</p>
                      <p className="text-xs text-primary">{user.leadCount} leads</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AdminSection>
          </motion.div>
        )}
      </main>
    </div>
  );
}
