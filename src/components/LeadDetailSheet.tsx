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
  X
} from 'lucide-react';

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

const statusVariants: Record<Lead['status'], 'new' | 'contacted' | 'responded' | 'qualified' | 'lost'> = {
  new: 'new',
  contacted: 'contacted',
  responded: 'responded',
  qualified: 'qualified',
  lost: 'lost',
};

export function LeadDetailSheet({ lead, open, onClose }: LeadDetailSheetProps) {
  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border">
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
          {/* Score & Status */}
          <div className="flex items-center gap-4">
            <div className="flex-1 glass rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Lead Score</p>
              <p className="text-2xl font-bold text-primary">{lead.score}</p>
            </div>
            <div className="flex-1 glass rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={statusVariants[lead.status]} className="mt-1">
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 glass rounded-lg">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{lead.phone}</span>
                </div>
              )}
              {lead.linkedIn && (
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  <Linkedin className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{lead.linkedIn}</span>
                </div>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Company Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 glass rounded-lg">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">{lead.company}</p>
                  <p className="text-xs text-muted-foreground">{lead.industry}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 glass rounded-lg">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{lead.location}</span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Activity</h3>
            <div className="glass rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">Added on {lead.createdAt}</p>
                  {lead.lastContacted && (
                    <p className="text-xs text-muted-foreground">
                      Last contacted: {lead.lastContacted}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border flex gap-3">
          <Button className="flex-1">
            <Send className="w-4 h-4 mr-2" />
            Send Outreach
          </Button>
          <Button variant="outline">
            <Mail className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
