import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Sparkles,
  Loader2,
  UserPlus,
  ArrowRight,
  Wand2
} from 'lucide-react';
import { searchLeadsWithExa, saveLeads, Lead } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LeadResultCard } from './LeadResultCard';

interface LeadFinderProps {
  onLeadsFound?: (leads: Lead[]) => void;
}

const suggestions = [
  'Marketing directors at fintech startups in NYC',
  'CTOs at Series A healthcare companies',
  'Sales VPs at B2B SaaS with 50-200 employees',
];

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
        title: 'Enter a search query',
        description: 'Describe who you want to find in plain English',
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
    <div className="max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6 animate-pulse-glow border border-primary/30">
          <Wand2 className="w-10 h-10 text-primary animate-float" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Find Your Ideal Leads</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Describe who you're looking for in plain English and let AI find them
        </p>
      </div>

      {/* Search Box */}
      <div className="glass-strong rounded-3xl p-8 card-shadow mb-8 animate-fade-in stagger-2">
        <div className="search-input flex items-center gap-3 px-5 py-4">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="e.g. VPs of Engineering at SaaS companies in San Francisco"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 bg-transparent text-lg placeholder:text-muted-foreground/70 focus-visible:ring-0 px-0"
          />
        </div>

        {/* Suggestions */}
        <div className="mt-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Try these examples</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="text-sm px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent hover:border-border"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleSearch} 
          disabled={isSearching}
          className="w-full mt-6 h-14 text-base font-semibold rounded-xl"
          size="lg"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Searching with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Find Leads
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {foundLeads.length > 0 && (
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Found {foundLeads.length} leads
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedLeads.size} selected for import
              </p>
            </div>
            <Button
              onClick={handleSaveLeads}
              disabled={isSaving || selectedLeads.size === 0}
              className="rounded-xl"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Save {selectedLeads.size} Leads
            </Button>
          </div>

          <div className="space-y-4">
            {foundLeads.map((lead, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <LeadResultCard
                  lead={lead}
                  isSelected={selectedLeads.has(index)}
                  onToggleSelect={() => toggleLeadSelection(index)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
