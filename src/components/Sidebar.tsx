import { 
  Users, 
  Search, 
  Send, 
  BarChart3, 
  Settings,
  Zap,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'finder', label: 'Lead Finder', icon: Search },
  { id: 'campaigns', label: 'Campaigns', icon: Send },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30 glow">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success border-2 border-sidebar" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">LeadPulse</h1>
            <p className="text-xs text-muted-foreground font-medium">AI-Powered Outreach</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-3">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'nav-item',
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.id === 'finder' && (
                <Sparkles className="w-3 h-3 ml-auto text-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="glass-strong rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">Pro Plan</p>
            <span className="text-xs text-primary font-medium">Upgrade</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">2,450 / 5,000 credits used</p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: '49%',
                background: 'linear-gradient(90deg, hsl(330 100% 60%), hsl(350 100% 68%))'
              }} 
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
