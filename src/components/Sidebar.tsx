import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GlowDot, AbstractBlob } from './ui/visual-elements';
import { supabase } from '@/integrations/supabase/client';

const CREDITS_PER_LEAD = 1;
const MAX_CREDITS = 5000;

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', visual: 'bars' },
  { id: 'leads', label: 'Leads', visual: 'dots' },
  { id: 'finder', label: 'Lead Finder', visual: 'pulse' },
  { id: 'campaigns', label: 'Campaigns', visual: 'arrow' },
  { id: 'settings', label: 'Settings', visual: 'gear' },
];

function NavVisual({ type, active }: { type: string; active: boolean }) {
  const baseClass = active ? 'text-primary' : 'text-muted-foreground';
  
  switch (type) {
    case 'bars':
      return (
        <div className="w-5 h-5 flex items-end justify-center gap-0.5">
          <div className={cn('w-1 rounded-full transition-all', active ? 'h-2 bg-primary' : 'h-1.5 bg-muted-foreground/60')} />
          <div className={cn('w-1 rounded-full transition-all', active ? 'h-4 bg-primary' : 'h-3 bg-muted-foreground/60')} />
          <div className={cn('w-1 rounded-full transition-all', active ? 'h-3 bg-primary' : 'h-2 bg-muted-foreground/60')} />
          <div className={cn('w-1 rounded-full transition-all', active ? 'h-5 bg-primary' : 'h-4 bg-muted-foreground/60')} />
        </div>
      );
    case 'dots':
      return (
        <div className="w-5 h-5 grid grid-cols-2 gap-1 p-0.5">
          <div className={cn('rounded-full transition-all', active ? 'bg-primary' : 'bg-muted-foreground/60')} />
          <div className={cn('rounded-full transition-all', active ? 'bg-primary/70' : 'bg-muted-foreground/40')} />
          <div className={cn('rounded-full transition-all', active ? 'bg-primary/70' : 'bg-muted-foreground/40')} />
          <div className={cn('rounded-full transition-all', active ? 'bg-primary' : 'bg-muted-foreground/60')} />
        </div>
      );
    case 'pulse':
      return (
        <div className="w-5 h-5 relative flex items-center justify-center">
          <div className={cn('w-2.5 h-2.5 rounded-full transition-all', active ? 'bg-primary shadow-lg shadow-primary/50' : 'bg-muted-foreground/60')} />
          {active && <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />}
        </div>
      );
    case 'arrow':
      return (
        <div className="w-5 h-5 relative">
          <div className={cn('absolute top-1/2 left-0 w-3 h-0.5 rounded-full -translate-y-1/2 transition-all', active ? 'bg-primary' : 'bg-muted-foreground/60')} />
          <div className={cn('absolute top-1/2 right-0.5 w-2 h-2 border-r-2 border-t-2 rotate-45 -translate-y-1/2 transition-all', active ? 'border-primary' : 'border-muted-foreground/60')} />
        </div>
      );
    case 'gear':
      return (
        <div className="w-5 h-5 relative flex items-center justify-center">
          <div className={cn('w-2.5 h-2.5 rounded-full border-2 transition-all', active ? 'border-primary' : 'border-muted-foreground/60')} />
          {[0, 60, 120].map((deg) => (
            <div
              key={deg}
              className={cn('absolute w-full h-0.5 rounded-full transition-all', active ? 'bg-primary' : 'bg-muted-foreground/60')}
              style={{ transform: `rotate(${deg}deg)`, width: '100%' }}
            />
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [leadsCount, setLeadsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeadsCount() {
      try {
        const { count } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true });
        setLeadsCount(count || 0);
      } catch (error) {
        console.error('Failed to fetch leads count:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeadsCount();
  }, []);

  const creditsUsed = leadsCount * CREDITS_PER_LEAD;
  const creditsPercentage = Math.min((creditsUsed / MAX_CREDITS) * 100, 100);

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-7 border-b border-sidebar-border">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center border border-primary/25 animate-pulse-glow">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-primary to-primary/60 rotate-45" />
            </div>
            <GlowDot className="absolute -top-0.5 -right-0.5 w-3 h-3" color="success" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">LeadPulse</h1>
            <p className="text-xs text-muted-foreground font-medium tracking-wide">AI-Powered Outreach</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-5 space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] px-5 mb-4">Navigation</p>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'nav-item group',
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              )}
            >
              <NavVisual type={item.visual} active={isActive} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'finder' && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-sidebar-border">
        <div className="glass-strong rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 opacity-30">
            <AbstractBlob className="w-full h-full" />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Pro Plan</p>
              <span className="text-xs text-primary font-semibold tracking-wide">UPGRADE</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {isLoading ? '...' : `${creditsUsed.toLocaleString()} / ${MAX_CREDITS.toLocaleString()} credits`}
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700"
                style={{ 
                  width: `${creditsPercentage}%`,
                  background: 'linear-gradient(90deg, hsl(330 100% 63%), hsl(350 90% 65%), hsl(15 95% 60%))'
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
