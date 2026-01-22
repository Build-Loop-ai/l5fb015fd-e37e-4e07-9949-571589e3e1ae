import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineAlert, FieldError } from '@/components/ui/inline-alert';
import { supabase } from '@/integrations/supabase/client';
import { GlowDot } from '@/components/ui/visual-elements';
import { mapAuthError } from '@/hooks/useInlineError';
import { z } from 'zod';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're in password recovery mode
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    // Validate password
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setFieldError(passwordResult.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      setFieldError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(mapAuthError(updateError));
      } else {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isRecoveryMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-3xl p-8 card-shadow"
          >
            <InlineAlert
              variant="warning"
              title="Invalid Reset Link"
              message="This password reset link is invalid or has expired. Please request a new one."
              className="mb-6"
            />
            <Button onClick={() => navigate('/auth')} className="apple-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-3xl p-8 card-shadow"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Password Reset!</h2>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully updated. Redirecting to dashboard...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </motion.div>
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

        {/* Reset Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-8 card-shadow"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Set New Password</h2>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          {/* Inline Error */}
          <AnimatePresence>
            {error && (
              <div className="mb-6">
                <InlineAlert
                  variant="error"
                  message={error}
                  onDismiss={() => setError(null)}
                />
              </div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                  setFieldError(null);
                }}
                className="apple-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                  setFieldError(null);
                }}
                className="apple-input"
              />
              <FieldError message={fieldError || undefined} />
            </div>

            <Button
              type="submit"
              className="w-full apple-button h-12"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Reset Password'
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
        </motion.div>
      </div>
    </div>
  );
}
