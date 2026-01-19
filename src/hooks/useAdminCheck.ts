import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  overview: {
    totalUsers: number;
    usersLast7Days: number;
    usersLast30Days: number;
    userGrowthRate: number;
    mrr: number;
    totalLeads: number;
    leadsLast7Days: number;
    leadsLast30Days: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalSearches: number;
    completedSearches: number;
  };
  subscriptions: {
    planCounts: {
      free: number;
      starter: number;
      growth: number;
      scale: number;
    };
    paidUsers: number;
    conversionRate: number;
  };
  leads: {
    total: number;
    statusCounts: {
      new: number;
      contacted: number;
      replied: number;
      qualified: number;
      converted: number;
    };
    avgPerUser: number;
  };
  campaigns: {
    total: number;
    active: number;
    draft: number;
    emailsSent: number;
    replies: number;
    replyRate: number;
  };
  credits: {
    totalUsed: number;
    totalLimit: number;
    avgPerUser: number;
    utilizationRate: number;
  };
  searches: {
    total: number;
    completed: number;
    processing: number;
  };
  outreach: {
    total: number;
    sent: number;
    draft: number;
  };
  charts: {
    dailySignups: Array<{ date: string; count: number }>;
    dailyLeads: Array<{ date: string; count: number }>;
    dailyCredits: Array<{ date: string; count: number }>;
  };
  users: Array<{
    id: string;
    email: string;
    fullName: string | null;
    company: string | null;
    createdAt: string;
    plan: string;
    status: string;
    creditsUsed: number;
    creditsLimit: number;
    leadCount: number;
    campaignCount: number;
  }>;
  recentActivity: {
    signups: Array<{ user_id: string; email: string; created_at: string }>;
    leads: Array<{ id: string; name: string; company: string; created_at: string }>;
    searches: Array<{ id: string; query: string; status: string; created_at: string }>;
  };
  topUsers: {
    byLeads: Array<{ userId: string; email: string; fullName: string | null; leadCount: number }>;
  };
  generatedAt: string;
}

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchAdminStats = async () => {
    if (!session?.access_token) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke('admin-stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fetchError) {
        console.error('Admin stats error:', fetchError);
        setIsAdmin(false);
        setError(fetchError.message);
        navigate('/dashboard');
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error('Admin stats error:', data.error);
        setIsAdmin(false);
        setError(data.error);
        navigate('/dashboard');
        toast({
          title: "Access Denied",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setIsAdmin(true);
      setStats(data);
    } catch (err) {
      console.error('Admin check error:', err);
      setIsAdmin(false);
      setError('Failed to verify admin status');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && session) {
      fetchAdminStats();
    } else if (!user) {
      setLoading(false);
      navigate('/auth');
    }
  }, [user, session]);

  return { isAdmin, loading, stats, error, refetch: fetchAdminStats };
}
