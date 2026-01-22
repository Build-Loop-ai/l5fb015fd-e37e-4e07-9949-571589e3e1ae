import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { ArrowRight, Sparkles, Target, Zap, Shield } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

// Animated floating element
function FloatingShape({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Feature item for signup side
function FeatureItem({ icon: Icon, text, delay }: { icon: React.ElementType; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-4 group"
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30 group-hover:bg-primary/30 group-hover:border-primary/50 transition-all shadow-[0_0_20px_rgba(255,45,146,0.3)]">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="text-white/90 text-lg font-medium">{text}</span>
    </motion.div>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have been signed in successfully.',
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to LeadPulse. You are now signed in.',
          });
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand/Marketing Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0a0a0a]">
        {/* Base dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#12080d] to-[#0a0a0a]" />
        
        {/* Primary glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/30 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[150px]" />
        
        {/* Secondary accent glows */}
        <div className="absolute top-20 right-20 w-[200px] h-[200px] rounded-full bg-[#ff6b35]/20 blur-[80px]" />
        <div className="absolute bottom-32 left-32 w-[150px] h-[150px] rounded-full bg-[#a855f7]/20 blur-[60px]" />
        
        {/* Grain texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.4] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
        
        {/* Floating decorative shapes with glow */}
        <FloatingShape 
          className="absolute top-20 right-20 w-32 h-32 rounded-full bg-primary/20 blur-2xl" 
          delay={0} 
        />
        <FloatingShape 
          className="absolute bottom-40 left-20 w-48 h-48 rounded-full bg-primary/10 blur-3xl" 
          delay={1} 
        />
        <FloatingShape 
          className="absolute top-1/2 right-1/3 w-24 h-24 rounded-3xl bg-white/5 blur-xl rotate-45" 
          delay={2} 
        />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Scanline effect */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/40 shadow-[0_0_30px_rgba(255,45,146,0.4)]">
              <div className="w-5 h-5 rounded-lg bg-primary rotate-45 shadow-[0_0_15px_rgba(255,45,146,0.8)]" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">LeadPulse</span>
          </motion.div>

          {/* Main content - changes based on login/signup */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight">
                      Welcome<br />back
                    </h2>
                    <p className="text-xl text-white/70 max-w-md leading-relaxed">
                      Your leads are waiting. Sign in to continue building connections that matter.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i}
                          className="w-10 h-10 rounded-full bg-primary/30 border-2 border-primary/50 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_15px_rgba(255,45,146,0.3)]"
                        >
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <p className="text-white/60 text-sm">
                      Join 2,000+ sales teams
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-10"
                >
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-[0_0_20px_rgba(255,45,146,0.3)]">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm text-white font-medium">10 free leads included</span>
                    </div>
                    <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight">
                      Find your<br />next customer
                    </h2>
                    <p className="text-xl text-white/70 max-w-md leading-relaxed">
                      AI-powered lead generation that actually works. No credit card required.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <FeatureItem icon={Target} text="AI-powered lead discovery" delay={0.1} />
                    <FeatureItem icon={Zap} text="Instant email outreach generation" delay={0.2} />
                    <FeatureItem icon={Shield} text="LinkedIn profile enrichment" delay={0.3} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom quote/stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="border-t border-white/10 pt-8"
          >
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary">50K+</p>
                <p className="text-sm text-white/50">Leads generated</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary">2.5x</p>
                <p className="text-sm text-white/50">Reply rate increase</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary">4.9★</p>
                <p className="text-sm text-white/50">User rating</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <div className="w-5 h-5 rounded-lg bg-primary rotate-45" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">LeadPulse</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <motion.h1 
              key={isLogin ? 'login-title' : 'signup-title'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl lg:text-4xl font-bold text-foreground mb-3"
            >
              {isLogin ? 'Sign in' : 'Create account'}
            </motion.h1>
            <p className="text-muted-foreground text-lg">
              {isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Get started with 10 free lead credits'}
            </p>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: undefined });
                }}
                className={`h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all ${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: undefined });
                }}
                className={`h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all ${errors.password ? 'border-destructive' : ''}`}
              />
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base group transition-all"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create account'}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Toggle auth mode */}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
            }}
            className="w-full h-12 rounded-xl border border-border bg-card hover:bg-muted/50 text-foreground font-medium transition-all"
          >
            {isLogin ? "Create an account" : "Sign in instead"}
          </button>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-foreground hover:text-primary transition-colors underline underline-offset-2">
              Terms
            </a>
            {' '}and{' '}
            <a href="/privacy" className="text-foreground hover:text-primary transition-colors underline underline-offset-2">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
