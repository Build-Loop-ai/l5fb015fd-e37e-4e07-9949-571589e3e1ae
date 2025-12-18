import { useState } from 'react';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Mail, 
  Phone, 
  Linkedin, 
  Building2, 
  MapPin,
  Calendar,
  Send,
  X,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { enrichLeadWithLinkedIn, LinkedInProfile } from '@/lib/api';
import { toast } from 'sonner';

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

const statusVariants: Record<string, string> = {
  new: 'new',
  contacted: 'contacted',
  responded: 'responded',
  qualified: 'qualified',
  replied: 'replied',
  unqualified: 'unqualified',
  lost: 'lost',
};

export function LeadDetailSheet({ lead, open, onClose, onLeadUpdated }: LeadDetailSheetProps) {
  const [isEnriching, setIsEnriching] = useState(false);

  if (!lead) return null;

  // Support both snake_case (from DB) and camelCase (from type)
  const profileData = lead.profile_data || lead.profileData;
  const linkedinData: LinkedInProfile | null = profileData?.linkedin || null;
  const isEnriched = !!linkedinData;
  const linkedinUrl = lead.linkedin || profileData?.linkedin?.linkedinUrl;

  const handleEnrich = async () => {
    if (!linkedinUrl) {
      toast.error('No LinkedIn URL available for this lead');
      return;
    }

    setIsEnriching(true);
    try {
      const result = await enrichLeadWithLinkedIn(lead.id, linkedinUrl);
      if (result.success) {
        toast.success('LinkedIn profile enriched successfully');
        onLeadUpdated?.();
      } else {
        toast.error(result.error || 'Failed to enrich profile');
      }
    } catch (error) {
      toast.error('Failed to enrich LinkedIn profile');
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl text-foreground">{lead.name}</SheetTitle>
              <p className="text-muted-foreground">{lead.title}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Enrichment Status & Action */}
          {linkedinUrl && (
            <div className="glass rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isEnriched ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500 font-medium">LinkedIn Enriched</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">LinkedIn data available</span>
                    </>
                  )}
                </div>
                {!isEnriched && (
                  <Button 
                    size="sm" 
                    onClick={handleEnrich}
                    disabled={isEnriching}
                    className="gap-2"
                  >
                    {isEnriching ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Enriching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Enrich Profile
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Score & Status */}
          <div className="flex items-center gap-4">
            <div className="flex-1 glass rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Lead Score</p>
              <p className="text-2xl font-bold text-primary">{lead.score}</p>
            </div>
            <div className="flex-1 glass rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={statusVariants[lead.status] as any || 'new'} className="mt-1">
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* LinkedIn Summary (if enriched) */}
          {linkedinData?.summary && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-[#0077B5]" />
                About
              </h3>
              <div className="glass rounded-lg p-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {linkedinData.summary}
                </p>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Contact Information</h3>
            <div className="space-y-2">
              {(lead.email || linkedinData?.email) && (
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{lead.email || linkedinData?.email}</span>
                  {linkedinData?.email && !lead.email && (
                    <Badge variant="outline" className="text-xs">from LinkedIn</Badge>
                  )}
                </div>
              )}
              {(lead.phone || linkedinData?.mobileNumber) && (
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{lead.phone || linkedinData?.mobileNumber}</span>
                  {linkedinData?.mobileNumber && !lead.phone && (
                    <Badge variant="outline" className="text-xs">from LinkedIn</Badge>
                  )}
                </div>
              )}
              {linkedinUrl && (
                <a 
                  href={linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 glass rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Linkedin className="w-4 h-4 text-[#0077B5]" />
                  <span className="text-sm text-foreground">View LinkedIn Profile</span>
                  {linkedinData?.connections && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {linkedinData.connections}+ connections
                    </span>
                  )}
                </a>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Company Details</h3>
            <div className="space-y-2">
              {(lead.company || linkedinData?.companyName) && (
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{lead.company || linkedinData?.companyName}</p>
                    {(lead.industry || linkedinData?.companyIndustry) && (
                      <p className="text-xs text-muted-foreground">
                        {lead.industry || linkedinData?.companyIndustry}
                        {linkedinData?.companySize && ` · ${linkedinData.companySize} employees`}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {(lead.location || linkedinData?.jobLocation) && (
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{lead.location || linkedinData?.jobLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Experience (if enriched) */}
          {linkedinData?.experiences && linkedinData.experiences.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Experience
              </h3>
              <div className="space-y-2">
                {linkedinData.experiences.slice(0, 3).map((exp, idx) => (
                  <div key={idx} className="glass rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{exp.title}</p>
                        <p className="text-xs text-muted-foreground">{exp.companyName}</p>
                      </div>
                      {exp.duration && (
                        <span className="text-xs text-muted-foreground">{exp.duration}</span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education (if enriched) */}
          {linkedinData?.educations && linkedinData.educations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                Education
              </h3>
              <div className="space-y-2">
                {linkedinData.educations.slice(0, 2).map((edu, idx) => (
                  <div key={idx} className="glass rounded-lg p-3">
                    <p className="text-sm font-medium text-foreground">{edu.schoolName}</p>
                    {(edu.degree || edu.fieldOfStudy) && (
                      <p className="text-xs text-muted-foreground">
                        {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills (if enriched) */}
          {linkedinData?.skills && linkedinData.skills.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {linkedinData.skills.slice(0, 10).map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {skill.title}
                  </Badge>
                ))}
                {linkedinData.skills.length > 10 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    +{linkedinData.skills.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Activity</h3>
            <div className="glass rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">
                    Added on {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                  {lead.lastContact && (
                    <p className="text-xs text-muted-foreground">
                      Last contact: {new Date(lead.lastContact).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Notes</h3>
              <div className="glass rounded-lg p-3">
                <p className="text-sm text-muted-foreground">{lead.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border flex gap-3">
          <Button className="flex-1">
            <Send className="w-4 h-4 mr-2" />
            Send Outreach
          </Button>
          {(lead.email || linkedinData?.email) && (
            <Button variant="outline" onClick={() => window.location.href = `mailto:${lead.email || linkedinData?.email}`}>
              <Mail className="w-4 h-4" />
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
