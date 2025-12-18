import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Sparkles,
  Loader2,
  UserPlus
} from 'lucide-react';
import { searchLeadsWithExa, saveLeads, Lead } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LeadResultCard } from './LeadResultCard';

interface LeadFinderProps {
  onLeadsFound?: (leads: Lead[]) => void;
}

export function LeadFinder({ onLeadsFound }: LeadFinderProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [foundLeads, setFoundLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Please enter a search query',
        description: 'Describe who you want to find, e.g. "VPs of Engineering at SaaS companies in San Francisco"',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setFoundLeads([]);
    setSelectedLeads(new Set());

    try {
      const result = await searchLeadsWithExa({ query: query.trim() });

      if (result.success && result.leads) {
        setFoundLeads(result.leads);
        setSelectedLeads(new Set(result.leads.map((_, i) => i)));
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
        description: 'Failed to search for leads. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
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

  const handleSaveLeads = async () => {
    const leadsToSave = foundLeads.filter((_, i) => selectedLeads.has(i));
    if (leadsToSave.length === 0) {
      toast({
        title: 'No leads selected',
        description: 'Please select at least one lead to save',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveLeads(leadsToSave);
      if (result.success) {
        toast({
          title: 'Leads saved!',
          description: `${leadsToSave.length} leads added to your database`,
        });
        onLeadsFound?.(leadsToSave);
        setFoundLeads([]);
        setSelectedLeads(new Set());
        setQuery('');
      } else {
        toast({
          title: 'Save failed',
          description: result.error || 'Failed to save leads',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save error',
        description: 'Failed to save leads. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 glow">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Find Your Ideal Leads</h2>
        <p className="text-muted-foreground">
          Describe who you're looking for in plain English
        </p>
      </div>

      <div className="glass rounded-2xl p-6 card-shadow">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="e.g. VPs of Engineering at SaaS companies in San Francisco"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-4 py-6 text-lg bg-muted/50 border-muted"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-4 mb-6">
          <span className="text-xs text-muted-foreground">Try:</span>
          {[
            'Marketing directors at fintech startups',
            'CTOs in healthcare industry NYC',
            'Sales managers at B2B companies',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setQuery(suggestion)}
              className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <Button 
          onClick={handleSearch} 
          disabled={isSearching}
          className="w-full"
          size="lg"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching with Exa AI...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Find Leads
            </>
          )}
        </Button>
      </div>

      {foundLeads.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Found {foundLeads.length} leads
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedLeads.size} selected
              </span>
              <Button
                onClick={handleSaveLeads}
                disabled={isSaving || selectedLeads.size === 0}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Save Selected
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {foundLeads.map((lead, index) => (
              <LeadResultCard
                key={index}
                lead={lead}
                isSelected={selectedLeads.has(index)}
                onToggleSelect={() => toggleLeadSelection(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
