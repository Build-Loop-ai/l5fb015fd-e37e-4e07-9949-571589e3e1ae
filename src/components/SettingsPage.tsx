import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { GlowDot, AbstractBlob } from '@/components/ui/visual-elements';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

function SettingsSection({ title, description, children, className = '' }: SettingsSectionProps) {
  return (
    <div className={`glass-strong rounded-2xl p-8 card-shadow ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
      <div className="flex-1">
        <Label className="text-foreground font-medium">{label}</Label>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: 'User',
    email: 'user@example.com',
    company: 'Acme Inc.',
  });
  
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    leadAlerts: true,
    campaignUpdates: false,
    weeklyReport: true,
  });

  const handleSaveProfile = () => {
    toast({
      title: 'Profile saved',
      description: 'Your profile has been updated successfully.',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Preferences saved',
      description: 'Your notification preferences have been updated.',
    });
  };

  const handleDeleteAllData = () => {
    toast({
      title: 'Data deletion requested',
      description: 'This feature requires backend implementation.',
      variant: 'destructive',
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, preferences, and integrations</p>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Profile Section */}
        <SettingsSection 
          title="Profile" 
          description="Your personal information and account details"
          className="animate-fade-in stagger-1"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center border border-primary/25">
                  <span className="text-2xl font-bold text-primary">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <GlowDot className="absolute -bottom-1 -right-1 w-5 h-5" color="success" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">{profile.name}</p>
                <p className="text-muted-foreground text-sm">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="apple-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  className="apple-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="apple-input"
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleSaveProfile} className="apple-button">
                Save Profile
              </Button>
            </div>
          </div>
        </SettingsSection>


        {/* Notifications Section */}
        <SettingsSection 
          title="Notifications" 
          description="Control how and when you receive updates"
          className="animate-fade-in stagger-3"
        >
          <div>
            <SettingRow 
              label="Email Digest" 
              description="Receive a daily summary of your lead activity"
            >
              <Switch
                checked={notifications.emailDigest}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, emailDigest: checked })
                }
              />
            </SettingRow>

            <SettingRow 
              label="Lead Alerts" 
              description="Get notified when new leads match your criteria"
            >
              <Switch
                checked={notifications.leadAlerts}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, leadAlerts: checked })
                }
              />
            </SettingRow>

            <SettingRow 
              label="Campaign Updates" 
              description="Receive updates on campaign progress and results"
            >
              <Switch
                checked={notifications.campaignUpdates}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, campaignUpdates: checked })
                }
              />
            </SettingRow>

            <SettingRow 
              label="Weekly Report" 
              description="Get a weekly performance summary"
            >
              <Switch
                checked={notifications.weeklyReport}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, weeklyReport: checked })
                }
              />
            </SettingRow>

            <div className="pt-4">
              <Button onClick={handleSaveNotifications} className="apple-button">
                Save Preferences
              </Button>
            </div>
          </div>
        </SettingsSection>

        {/* Plan & Usage */}
        <SettingsSection 
          title="Plan & Usage" 
          description="Your current plan and usage statistics"
          className="animate-fade-in stagger-4"
        >
          <div className="relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-32 h-32 opacity-20">
              <AbstractBlob className="w-full h-full" />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xl font-bold text-foreground">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">Billed monthly</p>
                </div>
                <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-4 mt-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Credits Used</span>
                    <span className="text-foreground font-medium">2,450 / 5,000</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: '49%',
                        background: 'linear-gradient(90deg, hsl(330 100% 63%), hsl(350 90% 65%), hsl(15 95% 60%))'
                      }} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-2xl font-bold text-foreground">∞</p>
                    <p className="text-xs text-muted-foreground">Campaigns</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-2xl font-bold text-foreground">5,000</p>
                    <p className="text-xs text-muted-foreground">Leads/mo</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-2xl font-bold text-foreground">24/7</p>
                    <p className="text-xs text-muted-foreground">Support</p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button variant="outline" className="rounded-xl">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection 
          title="Danger Zone" 
          description="Irreversible actions that affect your data"
          className="animate-fade-in stagger-5 border-destructive/30"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <div>
                <p className="font-medium text-foreground">Delete All Leads</p>
                <p className="text-sm text-muted-foreground">Remove all leads from your database</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl">
                    Delete Leads
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="apple-dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all leads?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All leads in your database will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAllData}
                      className="rounded-xl bg-destructive hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="apple-dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your account and all associated data will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAllData}
                      className="rounded-xl bg-destructive hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
