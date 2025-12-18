import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Building2, 
  MapPin, 
  Briefcase,
  Sparkles,
  Loader2,
  UserPlus,
  Check
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
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    industry: '',
  });

  const handleSearch = async () => {
    if (!formData.jobTitle && !formData.company && !formData.location && !formData.industry) {
      toast({
        title: 'Please enter search criteria',
        description: 'Add at least one filter to find leads',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setFoundLeads([]);
    setSelectedLeads(new Set());

    try {
      const result = await searchLeadsWithExa({
        jobTitle: formData.jobTitle,
        company: formData.company,
        location: formData.location,
        industry: formData.industry,
      });

      if (result.success && result.leads) {
        setFoundLeads(result.leads);
        // Auto-select all leads
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
          Search LinkedIn profiles with Exa AI, enrich with Apify, and generate personalized outreach
        </p>
      </div>

      <div className="glass rounded-2xl p-6 card-shadow">
        <div className="grid gap-4 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Job Title
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. VP of Engineering"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="pl-10 bg-muted/50 border-muted"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. TechCorp"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="pl-10 bg-muted/50 border-muted"
                />
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="pl-10 bg-muted/50 border-muted"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Industry
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Technology, SaaS"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="pl-10 bg-muted/50 border-muted"
                />
              </div>
            </div>
          </div>
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

      {foundLeads.length === 0 && !isSearching && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Pro tip: Be specific with job titles for better results
          </p>
        </div>
      )}
    </div>
  );
}
