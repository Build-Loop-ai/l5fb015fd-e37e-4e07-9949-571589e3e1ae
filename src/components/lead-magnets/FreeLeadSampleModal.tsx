import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BlurredLeadCard } from './BlurredLeadCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mail, ArrowRight, Sparkles, Users, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlurredLead {
  name: string;
  title: string;
  company: string;
  location: string;
  email_available: boolean;
  linkedin_available: boolean;
  phone_available: boolean;
}

interface FreeLeadSampleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'query' | 'email' | 'loading' | 'results';

export function FreeLeadSampleModal({ open, onOpenChange }: FreeLeadSampleModalProps) {
  const [step, setStep] = useState<Step>('query');
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [leads, setLeads] = useState<BlurredLead[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleQuerySubmit = () => {
    if (query.trim().length < 5) {
      setError('Please describe who you\'re looking for (at least 5 characters)');
      return;
    }
    setError('');
    setStep('email');
  };

  const handleEmailSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setStep('loading');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('free-lead-sample', {
        body: { email, query },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
        setStep('email');
        return;
      }

      setLeads(data?.leads || []);
      setStep('results');
    } catch (err) {
      console.error('Free lead sample error:', err);
      setError('Something went wrong. Please try again.');
      setStep('email');
      toast({
        title: "Error",
        description: "Failed to fetch leads. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  const resetModal = () => {
    setStep('query');
    setQuery('');
    setEmail('');
    setLeads([]);
    setError('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            {step === 'results' ? 'Your Free Leads' : 'Get 5 Free Leads'}
          </DialogTitle>
          <DialogDescription>
            {step === 'query' && 'Tell us who you\'re looking for and we\'ll find them instantly.'}
            {step === 'email' && 'Enter your email to receive your leads.'}
            {step === 'loading' && 'Finding your perfect leads...'}
            {step === 'results' && 'Sign up to unlock full contact details.'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'query' && (
            <motion.div
              key="query"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="query">Who are you looking for?</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="query"
                    placeholder="e.g., CTOs at fintech startups in NYC"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit()}
                    className="pl-10"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                {['SaaS founders', 'Marketing directors', 'E-commerce CEOs', 'HR managers'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <Button onClick={handleQuerySubmit} className="w-full group">
                Continue
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}

          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground">Searching for:</p>
                <p className="font-medium">{query}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Your email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    className="pl-10"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <p className="text-xs text-muted-foreground">
                We'll send your leads to this email. No spam, ever.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('query')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleEmailSubmit} className="flex-1 group">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get My Leads
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Finding your leads...</p>
                <p className="text-sm text-muted-foreground">This usually takes a few seconds</p>
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 mt-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found <span className="font-semibold text-foreground">{leads.length} leads</span> matching your criteria
                </p>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Lock className="w-3 h-3" />
                  <span>Locked</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {leads.map((lead, index) => (
                  <BlurredLeadCard key={index} lead={lead} index={index} />
                ))}
              </div>

              {leads.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No leads found. Try a different search query.</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Unlock full contact details</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Get email, phone, LinkedIn + 250 leads/month
                    </p>
                  </div>
                </div>
                <Button onClick={handleSignUp} className="w-full mt-4 group">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
