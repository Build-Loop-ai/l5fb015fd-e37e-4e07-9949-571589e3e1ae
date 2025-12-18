import { useState } from 'react';
import { Campaign, updateCampaign, deleteCampaign } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RingLoader, SparkBurst } from '@/components/ui/visual-elements';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CampaignCardProps {
  campaign: Campaign;
  onUpdate?: () => void;
  onViewLeads?: (campaign: Campaign) => void;
  onFindMoreLeads?: (campaign: Campaign) => void;
  className?: string;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', color: 'bg-success/15 text-success border-success/30' },
  paused: { label: 'Paused', color: 'bg-warning/15 text-warning border-warning/30' },
  completed: { label: 'Completed', color: 'bg-primary/15 text-primary border-primary/30' },
};

export function CampaignCard({ campaign, onUpdate, onViewLeads, onFindMoreLeads, className }: CampaignCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const status = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.draft;

  const handleStatusChange = async (newStatus: string) => {
    if (!campaign.id) return;
    setIsUpdating(true);
    try {
      const result = await updateCampaign(campaign.id, { status: newStatus });
      if (result.success) {
        toast({ title: `Campaign ${newStatus}` });
        onUpdate?.();
      } else {
        toast({ title: 'Failed to update', variant: 'destructive' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign.id) return;
    setIsUpdating(true);
    try {
      const result = await deleteCampaign(campaign.id);
      if (result.success) {
        toast({ title: 'Campaign deleted' });
        onUpdate?.();
      } else {
        toast({ title: 'Failed to delete', variant: 'destructive' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const replyRate = campaign.sent_count && campaign.sent_count > 0
    ? Math.round(((campaign.reply_count || 0) / campaign.sent_count) * 100)
    : 0;

  return (
    <div className={cn('glass rounded-2xl p-7 card-shadow hover:shadow-elevated transition-all duration-500 group', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xl text-foreground truncate">{campaign.name}</h3>
          {campaign.created_at && (
            <p className="text-sm text-muted-foreground mt-1.5">
              Created {new Date(campaign.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn('border font-medium', status.color)}>{status.label}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" disabled={isUpdating}>
                {isUpdating ? (
                  <RingLoader className="w-4 h-4" />
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-current" />
                    <div className="w-1 h-1 rounded-full bg-current" />
                    <div className="w-1 h-1 rounded-full bg-current" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-border/80 w-48">
              {campaign.status !== 'active' && (
                <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                  Activate
                </DropdownMenuItem>
              )}
              {campaign.status === 'active' && (
                <DropdownMenuItem onClick={() => handleStatusChange('paused')}>
                  Pause
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Query */}
      {campaign.search_query && (
        <div className="mb-5 p-3 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-xs font-medium text-muted-foreground mb-1">Search Query</p>
          <p className="text-sm text-foreground line-clamp-2">{campaign.search_query}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className="text-xl font-bold text-foreground">{campaign.lead_count || 0}</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">Leads</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className="text-xl font-bold text-foreground">{campaign.sent_count || 0}</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">Sent</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className="text-xl font-bold text-foreground">{campaign.reply_count || 0}</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">Replies</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className="text-xl font-bold text-foreground">{replyRate}%</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">Rate</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onViewLeads && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-xl"
            onClick={() => onViewLeads(campaign)}
          >
            View Leads ({campaign.lead_count || 0})
          </Button>
        )}
        {onFindMoreLeads && (
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl gap-2"
            onClick={() => onFindMoreLeads(campaign)}
          >
            <SparkBurst className="w-3.5 h-3.5" />
            Find More
          </Button>
        )}
      </div>
    </div>
  );
}
