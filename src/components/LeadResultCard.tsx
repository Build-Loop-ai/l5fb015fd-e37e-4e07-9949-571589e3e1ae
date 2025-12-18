import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RingLoader } from '@/components/ui/visual-elements';
import { Lead, scrapeLinkedInProfile, generateOutreach, GeneratedOutreach } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface LeadResultCardProps {
  lead: Lead;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function LeadResultCard({ lead, isSelected, onToggleSelect }: LeadResultCardProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [outreach, setOutreach] = useState<GeneratedOutreach | null>(null);
  const [showOutreachDialog, setShowOutreachDialog] = useState(false);
  const { toast } = useToast();

  const handleEnrich = async () => {
    if (!lead.linkedin_url) {
      toast({
        title: 'No LinkedIn URL',
        description: 'Cannot enrich without a LinkedIn profile URL',
        variant: 'destructive',
      });
      return;
    }

    setIsEnriching(true);
    try {
      const result = await scrapeLinkedInProfile(lead.linkedin_url);
      if (result.success && result.profile) {
        setEnrichedData(result.profile);
        toast({
          title: 'Profile enriched!',
          description: `Loaded additional data for ${lead.name}`,
        });
      } else {
        toast({
          title: 'Enrichment failed',
          description: result.error || 'Could not fetch profile data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Enrich error:', error);
      toast({
        title: 'Enrichment error',
        description: 'Failed to enrich lead. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleGenerateOutreach = async () => {
    setIsGenerating(true);
    try {
      const leadWithEnriched = {
        ...lead,
        profile_data: enrichedData ? { ...lead.profile_data, ...enrichedData } : lead.profile_data,
      };

      const result = await generateOutreach({ lead: leadWithEnriched });
      if (result.success && result.outreach) {
        setOutreach(result.outreach);
        setShowOutreachDialog(true);
        toast({
          title: 'Outreach generated!',
          description: 'Personalized message ready to send',
        });
      } else {
        toast({
          title: 'Generation failed',
          description: result.error || 'Could not generate outreach',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast({
        title: 'Generation error',
        description: 'Failed to generate outreach. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <>
      <div
        className={`glass rounded-2xl p-6 card-shadow transition-all duration-300 hover:shadow-elevated ${
          isSelected ? 'border-primary/40 ring-2 ring-primary/15' : 'hover:border-border/80'
        }`}
      >
        <div className="flex items-start gap-5">
          {/* Selection Checkbox */}
          <button
            onClick={onToggleSelect}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-1 ${
              isSelected
                ? 'bg-primary border-primary'
                : 'border-muted-foreground/30 hover:border-primary/50'
            }`}
          >
            {isSelected && (
              <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 -translate-y-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground text-lg">{lead.name}</h4>
                {lead.title && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    {lead.title}
                  </p>
                )}
                {lead.company && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    {lead.company}
                  </p>
                )}
                {lead.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    {lead.location}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 items-start">
                {lead.linkedin_url && (
                  <a
                    href={lead.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors"
                  >
                    <span className="text-xs font-bold">in</span>
                  </a>
                )}
                {lead.industry && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {lead.industry}
                  </Badge>
                )}
              </div>
            </div>

            {/* Enriched Data */}
            {enrichedData && (
              <div className="mt-5 p-5 rounded-xl bg-muted/30 border border-border/50">
                {enrichedData.headline && (
                  <p className="text-foreground font-medium">{enrichedData.headline}</p>
                )}
                {enrichedData.summary && (
                  <p className="text-muted-foreground mt-2 text-sm line-clamp-2">
                    {enrichedData.summary}
                  </p>
                )}
                {enrichedData.currentCompany && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    <span className="text-foreground font-medium">Currently at:</span> {enrichedData.currentCompany}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-5">
              {lead.linkedin_url && !enrichedData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnrich}
                  disabled={isEnriching}
                  className="rounded-xl"
                >
                  {isEnriching ? (
                    <span className="flex items-center gap-2">
                      <RingLoader className="w-3 h-3" />
                      Enriching...
                    </span>
                  ) : (
                    'Enrich Profile'
                  )}
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleGenerateOutreach}
                disabled={isGenerating}
                className="rounded-xl"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <RingLoader className="w-3 h-3" />
                    Generating...
                  </span>
                ) : (
                  'Generate Outreach'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Outreach Dialog */}
      <Dialog open={showOutreachDialog} onOpenChange={setShowOutreachDialog}>
        <DialogContent className="max-w-2xl glass-strong border-border/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="visual-badge-sm">
                <div className="w-5 h-5 relative">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-0.5 h-2 bg-gradient-to-t from-primary to-transparent origin-bottom left-1/2 -translate-x-1/2"
                      style={{ transform: `translateX(-50%) rotate(${i * 60}deg)`, transformOrigin: 'bottom center' }}
                    />
                  ))}
                  <div className="absolute inset-[35%] rounded-full bg-primary" />
                </div>
              </div>
              Outreach for {lead.name}
            </DialogTitle>
          </DialogHeader>

          {outreach && (
            <div className="space-y-6 mt-4">
              {/* Email Subject */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-foreground">Email Subject</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(outreach.subject, 'Subject')}
                    className="h-8 rounded-lg"
                  >
                    Copy
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-foreground font-medium">
                  {outreach.subject}
                </div>
              </div>

              {/* Email Body */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-foreground">Email Body</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(outreach.body, 'Email body')}
                    className="h-8 rounded-lg"
                  >
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={outreach.body}
                  readOnly
                  className="min-h-[150px] bg-muted/30 border-border/50 resize-none rounded-xl"
                />
              </div>

              {/* LinkedIn Message */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-foreground">LinkedIn Message</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(outreach.linkedin_message, 'LinkedIn message')}
                    className="h-8 rounded-lg"
                  >
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={outreach.linkedin_message}
                  readOnly
                  className="min-h-[100px] bg-muted/30 border-border/50 resize-none rounded-xl"
                />
              </div>

              {/* Open LinkedIn */}
              {lead.linkedin_url && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => window.open(lead.linkedin_url, '_blank')}
                >
                  Open LinkedIn Profile →
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
