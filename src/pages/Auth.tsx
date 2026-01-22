import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { ArrowRight, Sparkles, Target, Zap, Shield, Star } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

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
    <div className="min-h-screen w-full bg-[#030303] relative overflow-hidden">
      {/* Global background effects */}
      <div className="absolute inset-0">
        {/* Main pink glow - centered left */}
        <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] rounded-full bg-primary/40 blur-[200px]" />
        <div className="absolute top-[30%] left-[25%] w-[400px] h-[400px] rounded-full bg-primary/30 blur-[150px]" />
        
        {/* Secondary purple accent */}
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-500/20 blur-[120px]" />
        
        {/* Subtle orange accent */}
        <div className="absolute top-[10%] left-[40%] w-[200px] h-[200px] rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      {/* Grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content container */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Brand Panel */}
        <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(255,45,146,0.5)]">
              <div className="w-4 h-4 rounded-md bg-primary rotate-45 shadow-[0_0_10px_rgba(255,45,146,0.8)]" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">LeadPulse</span>
          </motion.div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
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
                    <h1 className="text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                      Welcome<br />back
                    </h1>
                    <p className="text-lg text-white/50 leading-relaxed max-w-sm">
                      Your leads are waiting. Sign in to continue building connections that matter.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'].map((color, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="w-9 h-9 rounded-full border-2 border-[#030303] flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {String.fromCharCode(65 + i)}
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-white/40 text-sm">
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
                  <div className="space-y-5">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary font-medium">10 free leads included</span>
                    </motion.div>
                    <h1 className="text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                      Find your<br />next customer
                    </h1>
                    <p className="text-lg text-white/50 leading-relaxed max-w-sm">
                      AI-powered lead generation that actually works. No credit card required.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: Target, text: 'AI-powered lead discovery' },
                      { icon: Zap, text: 'Instant email outreach generation' },
                      { icon: Shield, text: 'LinkedIn profile enrichment' },
                    ].map((feature, i) => (
                      <motion.div
                        key={feature.text}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                          <feature.icon className="w-4 h-4 text-white/70" />
                        </div>
                        <span className="text-white/70 font-medium">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="border-t border-white/10 pt-8"
          >
            <div className="flex gap-12">
              {[
                { value: '50K+', label: 'Leads generated' },
                { value: '2.5x', label: 'Reply rate increase' },
                { value: '4.9', label: 'User rating', icon: Star },
              ].map((stat, i) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white flex items-center gap-1">
                    {stat.value}
                    {stat.icon && <stat.icon className="w-4 h-4 fill-primary text-primary" />}
                  </p>
                  <p className="text-sm text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side - Form Panel */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-12 relative">
          {/* Vertical separator line */}
          <div className="hidden lg:block absolute left-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-[400px]"
          >
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <div className="w-4 h-4 rounded-md bg-primary rotate-45" />
              </div>
              <span className="text-xl font-semibold text-white tracking-tight">LeadPulse</span>
            </div>

            {/* Form container */}
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-2">
                <motion.h2 
                  key={isLogin ? 'login-title' : 'signup-title'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-white"
                >
                  {isLogin ? 'Sign in' : 'Create account'}
                </motion.h2>
                <p className="text-white/40">
                  {isLogin 
                    ? 'Enter your credentials to access your account' 
                    : 'Get started with 10 free lead credits'}
                </p>
              </div>

              {/* Form */}
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
                      <Label htmlFor="fullName" className="text-sm font-medium text-white/60">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-white/25 focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/60">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: undefined });
                    }}
                    className={`h-12 rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-white/25 focus:border-primary/50 focus:bg-white/[0.05] transition-all ${errors.email ? 'border-destructive' : ''}`}
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
                    <Label htmlFor="password" className="text-sm font-medium text-white/60">Password</Label>
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
                    className={`h-12 rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-white/25 focus:border-primary/50 focus:bg-white/[0.05] transition-all ${errors.password ? 'border-destructive' : ''}`}
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
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base group transition-all shadow-[0_0_40px_rgba(255,45,146,0.3)] hover:shadow-[0_0_50px_rgba(255,45,146,0.5)]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Sign in' : 'Create account'}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-sm text-white/30">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white font-medium transition-all"
              >
                {isLogin ? "Create an account" : "Sign in instead"}
              </button>

              {/* Footer */}
              <p className="text-center text-xs text-white/30">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-white/50 hover:text-primary transition-colors underline underline-offset-2">
                  Terms
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-white/50 hover:text-primary transition-colors underline underline-offset-2">
                  Privacy Policy
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
