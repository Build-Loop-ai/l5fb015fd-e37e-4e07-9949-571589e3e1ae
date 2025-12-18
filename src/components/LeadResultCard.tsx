import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Linkedin, 
  Loader2, 
  Mail, 
  MessageSquare, 
  Sparkles,
  User,
  Building2,
  MapPin
} from 'lucide-react';
import { Lead, scrapeLinkedInProfile, generateOutreach, OutreachMessage } from '@/lib/api';
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
  const [outreach, setOutreach] = useState<OutreachMessage | null>(null);
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
        className={`glass rounded-xl p-4 card-shadow transition-all duration-200 ${
          isSelected ? 'border-primary/50 bg-primary/5' : ''
        }`}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={onToggleSelect}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground/30 hover:border-primary/50'
            }`}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-foreground">{lead.name}</h4>
                {lead.title && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <User className="w-3 h-3" />
                    {lead.title}
                  </p>
                )}
                {lead.company && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {lead.company}
                  </p>
                )}
                {lead.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {lead.location}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.linkedin_url && (
                  <a
                    href={lead.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {lead.industry && (
                  <Badge variant="secondary" className="text-xs">
                    {lead.industry}
                  </Badge>
                )}
              </div>
            </div>

            {enrichedData && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                {enrichedData.headline && (
                  <p className="text-foreground font-medium">{enrichedData.headline}</p>
                )}
                {enrichedData.summary && (
                  <p className="text-muted-foreground mt-1 line-clamp-2">
                    {enrichedData.summary}
                  </p>
                )}
                {enrichedData.currentCompany && (
                  <p className="text-muted-foreground mt-1">
                    Currently at: {enrichedData.currentCompany}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {lead.linkedin_url && !enrichedData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnrich}
                  disabled={isEnriching}
                >
                  {isEnriching ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Linkedin className="w-3 h-3 mr-1" />
                  )}
                  Enrich Profile
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleGenerateOutreach}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Generate Outreach
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showOutreachDialog} onOpenChange={setShowOutreachDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Generated Outreach for {lead.name}
            </DialogTitle>
          </DialogHeader>

          {outreach && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Subject
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(outreach.subject, 'Subject')}
                  >
                    Copy
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-muted text-foreground">
                  {outreach.subject}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Body
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(outreach.body, 'Email body')}
                  >
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={outreach.body}
                  readOnly
                  className="min-h-[150px] bg-muted"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    LinkedIn Message
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(outreach.linkedin_message, 'LinkedIn message')}
                  >
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={outreach.linkedin_message}
                  readOnly
                  className="min-h-[80px] bg-muted"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
