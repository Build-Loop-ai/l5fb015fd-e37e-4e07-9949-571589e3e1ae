import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { createCampaign, searchLeadsWithExa } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RingLoader, AbstractBlob } from '@/components/ui/visual-elements';
import { cn } from '@/lib/utils';

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

export function CreateCampaignDialog({ open, onOpenChange, onCreated }: CreateCampaignDialogProps) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setStep('name');
    setName('');
    setGoal('');
    setSearchQuery('');
    setIsSaving(false);
    setIsSearching(false);
  };

  const handleClose = () => {
    if (isSaving || isSearching) return;
    resetState();
    onOpenChange(false);
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
    setStep('goal');
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
    setStep('search');
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
    setStep('saving');

    try {
      const campaignResult = await createCampaign({
        name: name.trim(),
        goal: goal.trim(),
        status: 'processing',
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
        title: 'Campaign created — search started!',
        description: 'Leads will be added automatically in 1–2 minutes.',
      });

      resetState();
      onCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Create/search error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create campaign and start search',
        variant: 'destructive',
      });
      setStep('search');
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

  const steps = ['name', 'goal', 'search'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn('glass-strong border-border/80 max-w-lg')} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {step === 'name' && 'Create New Campaign'}
            {step === 'goal' && "What's Your Goal?"}
            {step === 'search' && 'Find Leads'}
            {step === 'saving' && 'Starting Search...'}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        {step !== 'saving' && (
          <div className="flex items-center gap-2 mb-4">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                    currentStepIndex >= i
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn('w-8 h-0.5 mx-1', currentStepIndex > i ? 'bg-primary' : 'bg-muted')} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Campaign Name */}
        {step === 'name' && (
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <Input
              placeholder="e.g. Q1 Outreach - Engineering Leaders"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12"
              autoFocus
            />
            <p className="text-sm text-muted-foreground mt-2">Give your campaign a descriptive name</p>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 'goal' && (
          <div className="py-4">
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-32 h-32 opacity-20">
                <AbstractBlob className="w-full h-full" />
              </div>

              <label className="block text-sm font-medium mb-2">What's your outreach goal?</label>
              <Textarea
                placeholder="e.g. Book demo calls to show our product to the right teams"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[100px] resize-none"
                autoFocus
              />

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {goalSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setGoal(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                This goal will be used to generate personalized outreach for each lead
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Search */}
        {step === 'search' && (
          <div className="py-4">
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-32 h-32 opacity-20">
                <AbstractBlob className="w-full h-full" />
              </div>

              <label className="block text-sm font-medium mb-2">Who are you looking for?</label>
              <Input
                placeholder="VPs of Engineering at SaaS companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12"
                autoFocus
              />

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setSearchQuery(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                We’ll start a background search — leads will appear in your campaign automatically.
              </p>
            </div>
          </div>
        )}

        {/* Saving */}
        {step === 'saving' && (
          <div className="py-12 flex flex-col items-center">
            <RingLoader className="w-16 h-16 mb-6" />
            <p className="text-muted-foreground text-center">Creating campaign and starting lead search…</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'name' && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleNextToGoal}>Next: Set Goal →</Button>
            </>
          )}
          {step === 'goal' && (
            <>
              <Button variant="outline" onClick={() => setStep('name')}>← Back</Button>
              <Button onClick={handleNextToSearch}>Next: Find Leads →</Button>
            </>
          )}
          {step === 'search' && (
            <>
              <Button variant="outline" onClick={() => setStep('goal')}>← Back</Button>
              <Button onClick={handleCreateAndSearch} disabled={isSaving || isSearching}>
                Start Search →
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
