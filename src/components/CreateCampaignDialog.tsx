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
import { createCampaign, searchLeadsWithExa, saveLeads, Lead, Campaign } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RingLoader, SparkBurst, AbstractBlob } from '@/components/ui/visual-elements';
import { LeadResultCard } from './LeadResultCard';
import { cn } from '@/lib/utils';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

type Step = 'name' | 'goal' | 'search' | 'results' | 'saving';

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
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [foundLeads, setFoundLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const resetState = () => {
    setStep('name');
    setName('');
    setGoal('');
    setSearchQuery('');
    setFoundLeads([]);
    setSelectedLeads(new Set());
  };

  const handleClose = () => {
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Enter a search query',
        description: 'Describe who you want to find',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchLeadsWithExa({ query: searchQuery.trim() });
      if (result.success && result.leads) {
        setFoundLeads(result.leads);
        setSelectedLeads(new Set(result.leads.map((_, i) => i)));
        setStep('results');
        toast({
          title: 'Search complete!',
          description: `Found ${result.leads.length} potential leads`,
        });
      } else {
        toast({
          title: 'Search failed',
          description: result.error || 'No results found',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search error',
        description: 'Failed to search for leads',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleLeadSelection = (index: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const handleCreateCampaign = async () => {
    const leadsToSave = foundLeads.filter((_, i) => selectedLeads.has(i));
    
    if (leadsToSave.length === 0) {
      toast({
        title: 'No leads selected',
        description: 'Please select at least one lead',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    setStep('saving');

    try {
      // First create the campaign with goal
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

      // Then save leads with campaign_id
      const leadsResult = await saveLeads(leadsToSave, campaignResult.campaign.id);

      if (!leadsResult.success) {
        throw new Error(leadsResult.error || 'Failed to save leads');
      }

      toast({
        title: 'Campaign created!',
        description: `${leadsToSave.length} leads added to "${name}"`,
      });

      resetState();
      onCreated();
    } catch (error: any) {
      console.error('Create campaign error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive',
      });
      setStep('results');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (step === 'name') {
        handleNextToGoal();
      } else if (step === 'goal') {
        handleNextToSearch();
      } else if (step === 'search' && !isSearching) {
        handleSearch();
      }
    }
  };

  const steps = ['name', 'goal', 'search', 'results'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "glass-strong border-border/80 transition-all duration-300",
        step === 'results' ? 'max-w-4xl max-h-[85vh] overflow-hidden' : 'max-w-lg'
      )}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {step === 'name' && 'Create New Campaign'}
            {step === 'goal' && 'What\'s Your Goal?'}
            {step === 'search' && 'Find Leads for Campaign'}
            {step === 'results' && `Found ${foundLeads.length} Leads`}
            {step === 'saving' && 'Creating Campaign...'}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-4">
          {['name', 'goal', 'search', 'results'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                currentStepIndex >= i
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {i + 1}
              </div>
              {i < 3 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  currentStepIndex > i ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

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
            <p className="text-sm text-muted-foreground mt-2">
              Give your campaign a descriptive name
            </p>
          </div>
        )}

        {/* Step 2: Campaign Goal */}
        {step === 'goal' && (
          <div className="py-4">
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-32 h-32 opacity-20">
                <AbstractBlob className="w-full h-full" />
              </div>
              
              <label className="block text-sm font-medium mb-2">What's your outreach goal?</label>
              <Textarea
                placeholder="e.g. Book demo calls to show our AI-powered analytics platform that helps engineering teams ship faster"
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
                This goal will be used to generate personalized outreach messages for each lead
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Search Query */}
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
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && (
          <div className="py-2 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-background/80 backdrop-blur-sm py-2 -mx-2 px-2">
              <p className="text-sm text-muted-foreground">
                {selectedLeads.size} of {foundLeads.length} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLeads(new Set(foundLeads.map((_, i) => i)))}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLeads(new Set())}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {foundLeads.map((lead, index) => (
                <LeadResultCard
                  key={index}
                  lead={lead}
                  isSelected={selectedLeads.has(index)}
                  onToggleSelect={() => toggleLeadSelection(index)}
                  campaignGoal={goal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Saving */}
        {step === 'saving' && (
          <div className="py-12 flex flex-col items-center">
            <RingLoader className="w-16 h-16 mb-6" />
            <p className="text-muted-foreground">Creating your campaign and saving leads...</p>
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
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <RingLoader className="w-4 h-4" />
                    Searching...
                  </span>
                ) : (
                  'Search Leads →'
                )}
              </Button>
            </>
          )}
          {step === 'results' && (
            <>
              <Button variant="outline" onClick={() => setStep('search')}>← Search Again</Button>
              <Button onClick={handleCreateCampaign} disabled={selectedLeads.size === 0}>
                Create Campaign with {selectedLeads.size} Leads
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
