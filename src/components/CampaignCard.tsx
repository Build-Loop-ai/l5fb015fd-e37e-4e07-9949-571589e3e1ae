import { useState } from 'react';
import { Campaign, updateCampaign, deleteCampaign } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, MoreHorizontal, Mail, MessageSquare, Trash2, Loader2, TrendingUp } from 'lucide-react';
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
  className?: string;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', color: 'bg-success/15 text-success border-success/30' },
  paused: { label: 'Paused', color: 'bg-warning/15 text-warning border-warning/30' },
  completed: { label: 'Completed', color: 'bg-primary/15 text-primary border-primary/30' },
};

export function CampaignCard({ campaign, onUpdate, className }: CampaignCardProps) {
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
    <div className={cn('glass rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 group', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground truncate">{campaign.name}</h3>
          {campaign.created_at && (
            <p className="text-sm text-muted-foreground mt-1">
              Created {new Date(campaign.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('border', status.color)}>{status.label}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-border/80">
              {campaign.status !== 'active' && (
                <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                  <Play className="w-4 h-4 mr-2" />
                  Activate
                </DropdownMenuItem>
              )}
              {campaign.status === 'active' && (
                <DropdownMenuItem onClick={() => handleStatusChange('paused')}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center justify-center text-muted-foreground mb-2">
            <Mail className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-foreground">{campaign.sent_count || 0}</div>
          <div className="text-xs text-muted-foreground font-medium">Sent</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center justify-center text-muted-foreground mb-2">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-foreground">{campaign.reply_count || 0}</div>
          <div className="text-xs text-muted-foreground font-medium">Replies</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center justify-center text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-foreground">{replyRate}%</div>
          <div className="text-xs text-muted-foreground font-medium">Rate</div>
        </div>
      </div>
    </div>
  );
}
