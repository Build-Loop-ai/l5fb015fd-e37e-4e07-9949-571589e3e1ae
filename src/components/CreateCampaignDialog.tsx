import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { createCampaign, searchLeadsWithExa } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowLeft, Sparkles, Target, Search, Check } from 'lucide-react';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

type Step = 'name' | 'goal' | 'search' | 'saving';

const searchSuggestions = [
  'Marketing directors at fintech startups',
  'CTOs at Series A healthcare companies',
  'Sales VPs at B2B SaaS companies',
];

const goalSuggestions = [
  'Book demo calls for our platform',
  'Invite to our upcoming webinar',
  'Explore partnership opportunities',
];

const stepConfig = {
  name: {
    number: 1,
    title: 'Campaign Name',
    subtitle: 'Give your campaign a name that describes its purpose',
    icon: Sparkles,
  },
  goal: {
    number: 2,
    title: 'Define Your Goal',
    subtitle: 'What do you want to achieve with this outreach?',
    icon: Target,
  },
  search: {
    number: 3,
    title: 'Find Your Audience',
    subtitle: 'Describe who you want to reach',
    icon: Search,
  },
  saving: {
    number: 4,
    title: 'Creating Campaign',
    subtitle: 'Setting everything up for you',
    icon: Check,
  },
};

export function CreateCampaignDialog({ open, onOpenChange, onCreated }: CreateCampaignDialogProps) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setStep('name');
    setName('');
    setGoal('');
    setSearchQuery('');
    setIsSaving(false);
    setIsSearching(false);
    setIsTransitioning(false);
  };

  const handleClose = () => {
    if (isSaving || isSearching) return;
    resetState();
    onOpenChange(false);
  };

  const transitionTo = (nextStep: Step) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 200);
  };

  const handleNextToGoal = () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a campaign name',
        variant: 'destructive',
      });
      return;
    }
    transitionTo('goal');
  };

  const handleNextToSearch = () => {
    if (!goal.trim()) {
      toast({
        title: 'Goal required',
        description: 'Please describe your outreach goal',
        variant: 'destructive',
      });
      return;
    }
    transitionTo('search');
  };

  const handleCreateAndSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Enter a search query',
        description: 'Describe who you want to find',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    setIsSearching(true);
    transitionTo('saving');

    try {
      const campaignResult = await createCampaign({
        name: name.trim(),
        goal: goal.trim(),
        status: 'draft',
        search_query: searchQuery.trim(),
        sent_count: 0,
        reply_count: 0,
      });

      if (!campaignResult.success || !campaignResult.campaign?.id) {
        throw new Error(campaignResult.error || 'Failed to create campaign');
      }

      const searchResult = await searchLeadsWithExa({
        query: searchQuery.trim(),
        campaignId: campaignResult.campaign.id,
      });

      if (!searchResult.success) {
        throw new Error(searchResult.error || 'Failed to start lead search');
      }

      toast({
        title: 'Campaign created',
        description: 'Leads will be added automatically in 1–2 minutes.',
      });

      resetState();
      onCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Create/search error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create campaign',
        variant: 'destructive',
      });
      transitionTo('search');
    } finally {
      setIsSaving(false);
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (step === 'name') handleNextToGoal();
    if (step === 'goal') handleNextToSearch();
    if (step === 'search' && !isSaving && !isSearching) handleCreateAndSearch();
  };

  const steps: Step[] = ['name', 'goal', 'search'];
  const currentStepIndex = steps.indexOf(step);
  const config = stepConfig[step];
  const StepIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "apple-dialog max-w-2xl p-0 gap-0 border-0 overflow-hidden",
          "bg-gradient-to-b from-card to-background"
        )} 
        aria-describedby={undefined}
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted/30">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-10 pb-8">
          {/* Step indicator */}
          <div className={cn(
            "flex items-center gap-3 mb-8 transition-all duration-300",
            isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              <StepIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary/70 uppercase tracking-widest">
                  Step {config.number} of 3
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight mt-0.5">
                {config.title}
              </h2>
            </div>
          </div>

          {/* Step content */}
          <div className={cn(
            "transition-all duration-300 min-h-[280px]",
            isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          )}>
            {/* Step 1: Campaign Name */}
            {step === 'name' && (
              <div className="space-y-6">
                <p className="text-muted-foreground text-base leading-relaxed">
                  {config.subtitle}
                </p>
                <div className="space-y-3">
                  <Input
                    placeholder="Q1 Outreach - Engineering Leaders"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="apple-input h-14 text-lg"
                    autoFocus
                  />
                </div>
                <div className="pt-4">
                  <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-3">
                    Quick tips
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Be specific', 'Include timeframe', 'Target audience'].map((tip) => (
                      <span 
                        key={tip}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted/40 text-muted-foreground"
                      >
                        {tip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Goal */}
            {step === 'goal' && (
              <div className="space-y-6">
                <p className="text-muted-foreground text-base leading-relaxed">
                  {config.subtitle}
                </p>
                <Textarea
                  placeholder="Book demo calls to show our platform to engineering teams..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="apple-input min-h-[120px] text-base resize-none"
                  autoFocus
                />
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-3">
                    Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {goalSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setGoal(suggestion)}
                        className={cn(
                          "text-sm px-4 py-2 rounded-full transition-all duration-200",
                          "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground",
                          "border border-transparent hover:border-border/50"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Search */}
            {step === 'search' && (
              <div className="space-y-6">
                <p className="text-muted-foreground text-base leading-relaxed">
                  {config.subtitle}
                </p>
                <Input
                  placeholder="VPs of Engineering at SaaS companies in the US..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="apple-input h-14 text-lg"
                  autoFocus
                />
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-3">
                    Popular searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setSearchQuery(suggestion)}
                        className={cn(
                          "text-sm px-4 py-2 rounded-full transition-all duration-200",
                          "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground",
                          "border border-transparent hover:border-border/50"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex items-center gap-3 text-sm text-muted-foreground/70">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>AI will find matching profiles in real-time</span>
                </div>
              </div>
            )}

            {/* Saving state */}
            {step === 'saving' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                    <div className="apple-spinner" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Creating your campaign</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Setting up "{name}" and starting your lead search...
                </p>
                <div className="flex items-center gap-6 mt-8">
                  {['Campaign', 'Search', 'AI'].map((item, i) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500",
                        i === 0 ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                      )}>
                        {i === 0 ? <Check className="w-3 h-3" /> : <span className="text-xs">{i + 1}</span>}
                      </div>
                      <span className={cn(
                        "text-sm",
                        i === 0 ? "text-foreground" : "text-muted-foreground"
                      )}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {step !== 'saving' && (
          <div className="px-10 py-6 border-t border-border/50 bg-muted/20 flex items-center justify-between">
            <div>
              {step !== 'name' && (
                <Button 
                  variant="ghost" 
                  onClick={() => transitionTo(step === 'goal' ? 'name' : 'goal')}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={handleClose}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              {step === 'name' && (
                <Button onClick={handleNextToGoal} className="apple-button gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {step === 'goal' && (
                <Button onClick={handleNextToSearch} className="apple-button gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {step === 'search' && (
                <Button 
                  onClick={handleCreateAndSearch} 
                  disabled={isSaving || isSearching}
                  className="apple-button gap-2"
                >
                  Create Campaign
                  <Sparkles className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
