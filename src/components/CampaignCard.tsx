import { Campaign } from '@/types/lead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, MoreHorizontal, Users, Mail, Eye, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
  className?: string;
}

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const },
  active: { label: 'Active', variant: 'success' as const },
  paused: { label: 'Paused', variant: 'warning' as const },
  completed: { label: 'Completed', variant: 'default' as const },
};

export function CampaignCard({ campaign, className }: CampaignCardProps) {
  const status = statusConfig[campaign.status];

  return (
    <div className={cn('glass rounded-xl p-5 card-shadow', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Created {new Date(campaign.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{campaign.leadsCount}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{campaign.sentCount}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{campaign.openRate}%</p>
            <p className="text-xs text-muted-foreground">Opens</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Reply className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{campaign.replyRate}%</p>
            <p className="text-xs text-muted-foreground">Replies</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-border">
        {campaign.status === 'active' ? (
          <Button variant="outline" size="sm" className="flex-1">
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </Button>
        ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
          <Button variant="default" size="sm" className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            {campaign.status === 'draft' ? 'Launch' : 'Resume'}
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
