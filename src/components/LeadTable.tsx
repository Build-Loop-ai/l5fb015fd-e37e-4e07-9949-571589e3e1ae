import { useState } from 'react';
import { Lead } from '@/types/lead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Linkedin,
  Phone,
  ArrowUpDown,
  Trash2,
  ExternalLink,
  CheckCircle2,
  MessageSquare,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LeadTableProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange?: (leadId: string, status: string) => void;
  onDelete?: (leadId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-primary/15 text-primary border-primary/30' },
  contacted: { label: 'Contacted', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  responded: { label: 'Responded', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  replied: { label: 'Replied', color: 'bg-success/15 text-success border-success/30' },
  qualified: { label: 'Qualified', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  unqualified: { label: 'Unqualified', color: 'bg-muted text-muted-foreground border-border' },
  lost: { label: 'Lost', color: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export function LeadTable({ leads, onLeadClick, onStatusChange, onDelete }: LeadTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Lead>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredLeads = leads
    .filter(lead => 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc' 
        ? String(aVal || '').localeCompare(String(bVal || ''))
        : String(bVal || '').localeCompare(String(aVal || ''));
    });

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="glass-strong rounded-2xl overflow-hidden card-shadow">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center gap-4">
        <div className="search-input flex items-center gap-3 px-4 py-2.5 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 px-0 h-auto"
          />
        </div>
        <Button variant="outline" size="sm" className="rounded-lg">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left p-5 text-sm font-semibold text-muted-foreground">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Lead
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="text-left p-5 text-sm font-semibold text-muted-foreground">Company</th>
              <th className="text-left p-5 text-sm font-semibold text-muted-foreground">Status</th>
              <th className="text-left p-5 text-sm font-semibold text-muted-foreground">
                <button 
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Added
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="text-left p-5 text-sm font-semibold text-muted-foreground">Contact</th>
              <th className="text-right p-5 text-sm font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-medium">No leads found</p>
                  <p className="text-sm mt-1">Try adjusting your search</p>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead, index) => {
                const status = statusConfig[lead.status] || statusConfig.new;
                return (
                  <tr 
                    key={lead.id} 
                    className={cn(
                      'lead-row border-b border-border/50 cursor-pointer',
                      'animate-fade-in opacity-0'
                    )}
                    style={{ animationDelay: `${index * 0.03}s` }}
                    onClick={() => onLeadClick(lead)}
                  >
                    <td className="p-5">
                      <div>
                        <p className="font-semibold text-foreground">{lead.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{lead.title || 'No title'}</p>
                      </div>
                    </td>
                    <td className="p-5">
                      <div>
                        <p className="text-foreground">{lead.company || '-'}</p>
                        {lead.industry && (
                          <p className="text-sm text-muted-foreground mt-0.5">{lead.industry}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <Badge className={cn('border font-medium', status.color)}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="p-5 text-muted-foreground">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-1">
                        {lead.email && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${lead.email}`;
                          }}>
                            <Mail className="w-4 h-4" />
                          </Button>
                        )}
                        {lead.linkedin && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={(e) => {
                            e.stopPropagation();
                            window.open(lead.linkedin, '_blank');
                          }}>
                            <Linkedin className="w-4 h-4" />
                          </Button>
                        )}
                        {lead.phone && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${lead.phone}`;
                          }}>
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-strong border-border/80 w-48">
                          {lead.linkedin && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(lead.linkedin, '_blank');
                            }}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View LinkedIn
                            </DropdownMenuItem>
                          )}
                          {onStatusChange && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(lead.id, 'contacted');
                              }}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark Contacted
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(lead.id, 'replied');
                              }}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Mark Replied
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(lead.id, 'qualified');
                              }}>
                                <Star className="w-4 h-4 mr-2" />
                                Mark Qualified
                              </DropdownMenuItem>
                            </>
                          )}
                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(lead.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          Showing {filteredLeads.length} of {leads.length} leads
        </p>
      </div>
    </div>
  );
}
