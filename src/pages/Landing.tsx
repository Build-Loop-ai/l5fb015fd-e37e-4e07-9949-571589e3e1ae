import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PulseOrb, 
  SparkBurst, 
  TargetRings, 
  DataFlow, 
  CircuitLines,
  MagnetPull,
  StackedBars,
  ChatBubbles,
  GlowDot,
  DiamondShape,
} from '@/components/ui/visual-elements';

// Animated section component
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Floating orb component
function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        y: [0, -30, 0],
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Feature card with custom visual
function FeatureCard({ visual: Visual, title, description, index }: { visual: React.ComponentType<{ className?: string }>; title: string; description: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative p-8 rounded-3xl border border-border/50 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Visual className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// Stats item
function StatItem({ value, label, index }: { value: string; label: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className="text-5xl md:text-6xl font-bold gradient-text mb-2">{value}</div>
      <div className="text-muted-foreground text-lg">{label}</div>
    </motion.div>
  );
}

// Pricing card with custom check visual
function PricingCard({ name, price, leads, features, popular, index }: { name: string; price: string; leads: string; features: string[]; popular?: boolean; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const navigate = useNavigate();
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className={`relative p-8 rounded-3xl border ${popular ? 'border-primary/50 bg-gradient-to-b from-primary/10 to-card/80' : 'border-border/50 bg-card/60'} backdrop-blur-xl overflow-hidden`}
    >
      {popular && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground">{price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <p className="text-primary mt-2 font-medium">{leads} leads/month</p>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-muted-foreground">
            <GlowDot className="w-2 h-2 flex-shrink-0" color="primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        onClick={() => navigate('/auth')}
        className={`w-full h-12 rounded-xl font-medium ${popular ? 'apple-button' : 'bg-secondary hover:bg-secondary/80'}`}
      >
        Get Started
      </Button>
    </motion.div>
  );
}

// Step item with visual number
function StepItem({ number, title, description, index }: { number: number; title: string; description: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-6"
    >
      <div className="flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
          {number}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  const features = [
    { visual: MagnetPull, title: "AI-Powered Discovery", description: "Find your ideal prospects with natural language search. Our AI understands exactly who you're looking for." },
    { visual: CircuitLines, title: "Instant Enrichment", description: "Get complete profiles with verified emails, company data, and social insights in seconds." },
    { visual: TargetRings, title: "Smart Campaigns", description: "Organize leads into campaigns, track engagement, and measure what matters." },
    { visual: StackedBars, title: "Personalized Outreach", description: "Generate compelling, personalized messages that resonate with each prospect." },
    { visual: DataFlow, title: "Data Quality", description: "Every lead is verified and enriched with the most accurate, up-to-date information." },
    { visual: SparkBurst, title: "Seamless Workflow", description: "From discovery to outreach, everything works together beautifully." },
  ];
  
  const steps = [
    { title: "Describe Your Ideal Customer", description: "Use natural language to describe who you want to reach. Our AI understands context, industry terms, and nuances." },
    { title: "AI Finds Perfect Matches", description: "Our technology searches across millions of profiles to find people who match your criteria exactly." },
    { title: "Enrich & Verify", description: "Each lead is automatically enriched with verified contact information, company data, and social profiles." },
    { title: "Personalize & Reach Out", description: "Generate tailored outreach messages and start meaningful conversations that convert." },
  ];
  
  const pricing = [
    { name: "Starter", price: "$35", leads: "250", features: ["AI-powered search", "Email enrichment", "Campaign management", "Basic analytics"] },
    { name: "Growth", price: "$99", leads: "1,000", popular: true, features: ["Everything in Starter", "Priority enrichment", "Advanced filters", "Team collaboration", "API access"] },
    { name: "Scale", price: "$199", leads: "2,500", features: ["Everything in Growth", "Dedicated support", "Custom integrations", "Unlimited campaigns", "Advanced analytics"] },
  ];
  
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/50 backdrop-blur-xl border-b border-border/30"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
              <PulseOrb className="w-5 h-5" />
            </div>
            <span className="text-xl font-semibold text-foreground">LeadFlow</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate('/dashboard')} className="apple-button gap-2">
                Dashboard
                <DiamondShape className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth')} className="apple-button gap-2">
                  Get Started
                  <DiamondShape className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.nav>
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)_/_0.08)_0%,_transparent_60%)]" />
        <FloatingOrb className="w-96 h-96 bg-primary/30 -top-48 -right-48" delay={0} />
        <FloatingOrb className="w-80 h-80 bg-primary/20 -bottom-40 -left-40" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-primary/25 top-1/3 right-1/4" delay={4} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <SparkBurst className="w-4 h-4" />
              AI-Powered Lead Generation
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight leading-[0.95] mb-8"
          >
            Find your next
            <br />
            <span className="gradient-text">best customers</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Describe who you're looking for in plain English. Our AI finds, enriches, and helps you reach your ideal prospects.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button onClick={() => navigate('/auth')} size="lg" className="apple-button h-14 px-8 text-lg gap-3">
              Start Finding Leads
              <DiamondShape className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="lg" className="h-14 px-8 text-lg text-muted-foreground hover:text-foreground gap-2">
              <ChatBubbles className="w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-16 text-sm text-muted-foreground/60"
          >
            Trusted by 2,000+ sales teams worldwide
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-2.5 rounded-full bg-primary/50" />
          </motion.div>
        </motion.div>
      </section>
      
      {/* Stats Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
            <StatItem value="10M+" label="Leads Found" index={0} />
            <StatItem value="98%" label="Data Accuracy" index={1} />
            <StatItem value="3x" label="Response Rate" index={2} />
            <StatItem value="2min" label="Avg. Enrichment" index={3} />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Everything you need to
              <br />
              <span className="gradient-text">grow your pipeline</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you find, engage, and convert your ideal customers.
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)_/_0.05)_0%,_transparent_50%)]" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              How it works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From idea to outreach in minutes, not hours.
            </p>
          </AnimatedSection>
          
          <div className="space-y-12">
            {steps.map((step, i) => (
              <StepItem key={step.title} number={i + 1} {...step} index={i} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Scale as you grow.
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <PricingCard key={plan.name} {...plan} index={i} />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--primary)_/_0.1)_0%,_transparent_60%)]" />
        
        <AnimatedSection className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-8">
            <PulseOrb className="w-10 h-10" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Ready to transform
            <br />
            <span className="gradient-text">your outreach?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-10">
            Join thousands of sales teams already using LeadFlow to find and convert their ideal customers.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg" className="apple-button h-16 px-10 text-lg gap-3">
            Start Your Free Trial
            <DiamondShape className="w-4 h-4" />
          </Button>
        </AnimatedSection>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <PulseOrb className="w-4 h-4" />
            </div>
            <span className="font-semibold text-foreground">LeadFlow</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2027 LeadFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
