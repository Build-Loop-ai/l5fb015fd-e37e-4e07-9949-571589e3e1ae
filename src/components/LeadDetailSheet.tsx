import { useState } from 'react';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  CheckCircle2,
  Globe,
  Users,
  Clock,
  Languages,
  ExternalLink
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
  const enrichedAt = profileData?.linkedin_enriched_at;

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return null;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-start gap-4">
            {/* Profile Picture */}
            <Avatar className="w-20 h-20 border-2 border-primary/20 shadow-lg">
              <AvatarImage src={linkedinData?.profilePicture} alt={lead.name} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-xl text-foreground truncate">
                    {linkedinData?.fullName || lead.name}
                  </SheetTitle>
                  <p className="text-muted-foreground truncate">{lead.title}</p>
                  {linkedinData?.headline && linkedinData.headline !== lead.title && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {linkedinData.headline}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 -mt-1 -mr-2">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Social Stats */}
              {isEnriched && (linkedinData?.connections || linkedinData?.followers) && (
                <div className="flex items-center gap-3 mt-2">
                  {linkedinData?.connections && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatNumber(linkedinData.connections)}+ connections
                    </span>
                  )}
                  {linkedinData?.followers && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatNumber(linkedinData.followers)} followers
                    </span>
                  )}
                </div>
              )}
            </div>
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
                      <div>
                        <span className="text-sm text-green-500 font-medium">LinkedIn Enriched</span>
                        {enrichedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(enrichedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
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
                  <span className="text-sm text-foreground flex-1">View LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
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
              
              {/* Company Website */}
              {linkedinData?.companyWebsite && (
                <a 
                  href={linkedinData.companyWebsite.startsWith('http') ? linkedinData.companyWebsite : `https://${linkedinData.companyWebsite}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 glass rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1 truncate">{linkedinData.companyWebsite}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              )}
              
              {/* Company LinkedIn */}
              {linkedinData?.companyLinkedin && (
                <a 
                  href={linkedinData.companyLinkedin}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 glass rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Linkedin className="w-4 h-4 text-[#0077B5]" />
                  <span className="text-sm text-foreground flex-1">Company LinkedIn</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              )}
              
              {/* Job Duration */}
              {linkedinData?.currentJobDuration && (
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Current role: {linkedinData.currentJobDuration}</p>
                    {linkedinData?.jobStartedOn && (
                      <p className="text-xs text-muted-foreground">
                        Started {linkedinData.jobStartedOn}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Experience (if enriched) */}
          {linkedinData?.experiences && linkedinData.experiences.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Experience ({linkedinData.experiences.length})
              </h3>
              <div className="space-y-2">
                {linkedinData.experiences.slice(0, 4).map((exp, idx) => (
                  <div key={idx} className="glass rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{exp.title}</p>
                        <p className="text-xs text-muted-foreground">{exp.companyName}</p>
                        {exp.location && (
                          <p className="text-xs text-muted-foreground">{exp.location}</p>
                        )}
                      </div>
                      {exp.duration && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{exp.duration}</span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
                {linkedinData.experiences.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{linkedinData.experiences.length - 4} more positions
                  </p>
                )}
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
                {linkedinData.educations.slice(0, 3).map((edu, idx) => (
                  <div key={idx} className="glass rounded-lg p-3">
                    <p className="text-sm font-medium text-foreground">{edu.schoolName}</p>
                    {(edu.degree || edu.fieldOfStudy) && (
                      <p className="text-xs text-muted-foreground">
                        {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {(edu.startYear || edu.endYear) && (
                      <p className="text-xs text-muted-foreground">
                        {[edu.startYear, edu.endYear].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications (if enriched) */}
          {linkedinData?.certifications && linkedinData.certifications.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                Certifications ({linkedinData.certifications.length})
              </h3>
              <div className="space-y-2">
                {linkedinData.certifications.slice(0, 4).map((cert, idx) => (
                  <div key={idx} className="glass rounded-lg p-3">
                    <p className="text-sm font-medium text-foreground">{cert.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {cert.authority && (
                        <span className="text-xs text-muted-foreground">{cert.authority}</span>
                      )}
                      {cert.authority && cert.issueDate && (
                        <span className="text-xs text-muted-foreground">·</span>
                      )}
                      {cert.issueDate && (
                        <span className="text-xs text-muted-foreground">{cert.issueDate}</span>
                      )}
                    </div>
                  </div>
                ))}
                {linkedinData.certifications.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{linkedinData.certifications.length - 4} more certifications
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Languages (if enriched) */}
          {linkedinData?.languages && linkedinData.languages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Languages className="w-4 h-4 text-muted-foreground" />
                Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {linkedinData.languages.map((lang, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {lang.name}
                    {lang.proficiency && ` · ${lang.proficiency}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Skills (if enriched) */}
          {linkedinData?.skills && linkedinData.skills.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                Skills ({linkedinData.skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {linkedinData.skills.slice(0, 12).map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {skill.title}
                  </Badge>
                ))}
                {linkedinData.skills.length > 12 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    +{linkedinData.skills.length - 12} more
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
