import { useState } from 'react';
import { Campaign, updateCampaign, deleteCampaign } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, MoreHorizontal, Mail, MessageSquare, Trash2, Loader2 } from 'lucide-react';
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
  draft: { label: 'Draft', variant: 'secondary' as const },
  active: { label: 'Active', variant: 'success' as const },
  paused: { label: 'Paused', variant: 'warning' as const },
  completed: { label: 'Completed', variant: 'default' as const },
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
    <div className={cn('glass rounded-xl p-5 card-shadow', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{campaign.name}</h3>
          {campaign.created_at && (
            <p className="text-sm text-muted-foreground mt-1">
              Created {new Date(campaign.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center text-muted-foreground mb-1">
            <Mail className="w-4 h-4 mr-1" />
          </div>
          <div className="text-lg font-semibold text-foreground">{campaign.sent_count || 0}</div>
          <div className="text-xs text-muted-foreground">Sent</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center text-muted-foreground mb-1">
            <MessageSquare className="w-4 h-4 mr-1" />
          </div>
          <div className="text-lg font-semibold text-foreground">{campaign.reply_count || 0}</div>
          <div className="text-xs text-muted-foreground">Replies</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">{replyRate}%</div>
          <div className="text-xs text-muted-foreground">Reply Rate</div>
        </div>
      </div>
    </div>
  );
}
