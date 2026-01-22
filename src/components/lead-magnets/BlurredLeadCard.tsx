import { Lock, Mail, Phone, Linkedin, MapPin, Briefcase, Building } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlurredLead {
  name: string;
  title: string;
  company: string;
  location: string;
  email_available: boolean;
  linkedin_available: boolean;
  phone_available: boolean;
}

interface BlurredLeadCardProps {
  lead: BlurredLead;
  index: number;
}

export function BlurredLeadCard({ lead, index }: BlurredLeadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm group hover:border-primary/30 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-semibold text-lg shrink-0">
          {lead.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name - visible */}
          <h4 className="font-semibold text-foreground truncate">{lead.name}</h4>

          {/* Title - visible */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="truncate">{lead.title}</span>
          </div>

          {/* Company - blurred */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
            <Building className="w-3.5 h-3.5" />
            <span className="blur-[4px] select-none">{lead.company}</span>
            <Lock className="w-3 h-3 text-primary/60" />
          </div>

          {/* Location - visible */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{lead.location}</span>
          </div>
        </div>
      </div>

      {/* Contact info - locked */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
        {lead.email_available && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="blur-[4px] select-none">email@***</span>
            <Lock className="w-3 h-3 text-primary/60" />
          </div>
        )}

        {lead.linkedin_available && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Linkedin className="w-3.5 h-3.5 text-primary" />
            <span className="blur-[4px] select-none">linkedin/***</span>
            <Lock className="w-3 h-3 text-primary/60" />
          </div>
        )}

        {lead.phone_available && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span className="blur-[4px] select-none">+1 ***</span>
            <Lock className="w-3 h-3 text-primary/60" />
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 text-primary text-sm font-medium">
          <Lock className="w-4 h-4" />
          <span>Sign up to unlock</span>
        </div>
      </div>
    </motion.div>
  );
}
