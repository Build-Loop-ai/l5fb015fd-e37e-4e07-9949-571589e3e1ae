import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GlowDot } from '@/components/ui/visual-elements';
import { z } from 'zod';
import { ArrowLeft, CheckCircle, Loader2, Mail } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email address');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        toast({
          title: 'Error',
          description: resetError.message,
          variant: 'destructive',
        });
      } else {
        setSent(true);
        toast({
          title: 'Check your email',
          description: 'We sent you a password reset link.',
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center border border-primary/25 animate-pulse-glow">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/60 rotate-45" />
              </div>
              <GlowDot className="absolute -top-0.5 -right-0.5 w-3 h-3" color="success" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">LeadPulse</h1>
              <p className="text-xs text-muted-foreground font-medium">AI-Powered Outreach</p>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-8 card-shadow text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Check Your Email</h2>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => setSent(false)} 
                variant="outline" 
                className="w-full"
              >
                Try Again
              </Button>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center border border-primary/25 animate-pulse-glow">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/60 rotate-45" />
            </div>
            <GlowDot className="absolute -top-0.5 -right-0.5 w-3 h-3" color="success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">LeadPulse</h1>
            <p className="text-xs text-muted-foreground font-medium">AI-Powered Outreach</p>
          </div>
        </div>

        {/* Forgot Password Card */}
        <div className="glass-strong rounded-3xl p-8 card-shadow">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Forgot Password?</h2>
            <p className="text-muted-foreground">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className={`apple-input ${error ? 'border-destructive' : ''}`}
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full apple-button h-12"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
