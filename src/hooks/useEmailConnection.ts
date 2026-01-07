import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EmailConnection {
  id: string;
  provider: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export function useEmailConnection() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<EmailConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchConnection = useCallback(async () => {
    if (!user) {
      setConnection(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_connections')
        .select('id, provider, email, is_active, created_at')
        .eq('user_id', user.id)
        .eq('provider', 'gmail')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setConnection(data);
    } catch (error) {
      console.error('Error fetching email connection:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const connect = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to connect your Gmail');
      return;
    }

    setIsConnecting(true);

    try {
      // Get the OAuth URL from edge function
      const redirectUri = `${window.location.origin}/settings`;
      
      const { data, error } = await supabase.functions.invoke('gmail-auth', {
        body: { action: 'authorize', redirectUri },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Open Google OAuth in a popup
        const popup = window.open(
          data.authUrl,
          'gmail-oauth',
          'width=600,height=700,left=200,top=100'
        );

        if (!popup) {
          toast.error('Please allow popups to connect your Gmail');
          setIsConnecting(false);
          return;
        }

        // Listen for the OAuth callback
        const checkPopup = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(checkPopup);
              setIsConnecting(false);
              // Refresh connection status after popup closes
              await fetchConnection();
              return;
            }

            // Check if popup has redirected to our callback URL
            const popupUrl = popup.location.href;
            if (popupUrl.includes(window.location.origin) && popupUrl.includes('code=')) {
              clearInterval(checkPopup);
              
              const urlParams = new URLSearchParams(new URL(popupUrl).search);
              const code = urlParams.get('code');
              
              popup.close();

              if (code) {
                // Exchange code for tokens
                const { data: callbackData, error: callbackError } = await supabase.functions.invoke('gmail-auth', {
                  body: { action: 'callback', code, redirectUri },
                });

                if (callbackError) throw callbackError;

                if (callbackData?.success) {
                  toast.success(`Gmail connected: ${callbackData.email}`);
                  await fetchConnection();
                }
              }
              
              setIsConnecting(false);
            }
          } catch (e) {
            // Cross-origin errors are expected until the popup redirects back
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('Gmail connect error:', error);
      toast.error(error.message || 'Failed to connect Gmail');
      setIsConnecting(false);
    }
  }, [user, fetchConnection]);

  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('gmail-auth', {
        body: { action: 'disconnect' },
      });

      if (error) throw error;

      // Also delete locally
      await supabase
        .from('email_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'gmail');

      setConnection(null);
      toast.success('Gmail disconnected');
    } catch (error: any) {
      console.error('Gmail disconnect error:', error);
      toast.error(error.message || 'Failed to disconnect Gmail');
    }
  }, [user]);

  const sendEmail = useCallback(async (params: {
    leadId?: string;
    to: string;
    subject: string;
    body: string;
    campaignId?: string;
  }) => {
    if (!connection) {
      toast.error('Please connect your Gmail account first');
      return { success: false, error: 'No email connection' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          leadId: params.leadId,
          to: params.to,
          subject: params.subject,
          emailBody: params.body,
          campaignId: params.campaignId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Email sent successfully!');
        return { success: true, messageId: data.messageId };
      } else {
        throw new Error(data?.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Send email error:', error);
      toast.error(error.message || 'Failed to send email');
      return { success: false, error: error.message };
    }
  }, [connection]);

  return {
    connection,
    isConnected: !!connection,
    isLoading,
    isConnecting,
    connect,
    disconnect,
    sendEmail,
    refresh: fetchConnection,
  };
}
