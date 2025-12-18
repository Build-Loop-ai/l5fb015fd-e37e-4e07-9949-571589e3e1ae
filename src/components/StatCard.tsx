import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  className 
}: StatCardProps) {
  return (
    <div className={cn('stat-card group', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <p className="text-4xl font-bold text-foreground tracking-tight">{value}</p>
          {change && (
            <p className={cn(
              'text-sm mt-3 font-medium flex items-center gap-1.5',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-destructive',
              changeType === 'neutral' && 'text-muted-foreground'
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                changeType === 'positive' && 'bg-success',
                changeType === 'negative' && 'bg-destructive',
                changeType === 'neutral' && 'bg-muted-foreground'
              )} />
              {change}
            </p>
          )}
        </div>
        <div className="icon-badge group-hover:scale-105 transition-transform duration-300">
          <Icon className="w-7 h-7 text-primary" />
        </div>
      </div>
    </div>
  );
}
