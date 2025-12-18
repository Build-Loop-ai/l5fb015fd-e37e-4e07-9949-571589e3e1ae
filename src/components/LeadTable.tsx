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
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LeadTableProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange?: (leadId: string, status: string) => void;
  onDelete?: (leadId: string) => void;
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
    <div className="glass rounded-xl overflow-hidden card-shadow">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-muted"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Lead
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Company</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                <button 
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Added
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No leads found
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead, index) => (
                <tr 
                  key={lead.id} 
                  className={cn(
                    'lead-row border-b border-border/50 cursor-pointer',
                    'animate-fade-in opacity-0'
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => onLeadClick(lead)}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.title}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-foreground">{lead.company || '-'}</p>
                      <p className="text-sm text-muted-foreground">{lead.industry || ''}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={statusVariants[lead.status] as any || 'new'}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {lead.email && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${lead.email}`;
                        }}>
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                      {lead.linkedin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                          e.stopPropagation();
                          window.open(lead.linkedin, '_blank');
                        }}>
                          <Linkedin className="w-4 h-4" />
                        </Button>
                      )}
                      {lead.phone && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${lead.phone}`;
                        }}>
                          <Phone className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(lead.id, 'contacted');
                            }}>
                              Mark Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(lead.id, 'replied');
                            }}>
                              Mark Replied
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(lead.id, 'qualified');
                            }}>
                              Mark Qualified
                            </DropdownMenuItem>
                          </>
                        )}
                        {onDelete && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(lead.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredLeads.length} of {leads.length} leads
        </p>
      </div>
    </div>
  );
}
