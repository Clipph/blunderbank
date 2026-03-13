import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Lock, 
  Trash2, 
  ShieldAlert, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
export function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const loginAction = useAuthStore(s => s.login);
  const logoutAction = useAuthStore(s => s.logout);
  const token = useAuthStore(s => s.token);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || username === user?.username) return;
    setIsLoading(true);
    try {
      const updatedUser = await api<any>('/api/auth/account/username', {
        method: 'PUT',
        body: JSON.stringify({ newUsername: username })
      });
      if (token) loginAction(updatedUser, token);
      toast.success("Username updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update username");
    } finally {
      setIsLoading(false);
    }
  };
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await api('/api/auth/account/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new })
      });
      toast.success("Password changed successfully");
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteAccount = async () => {
    if (!confirm("CRITICAL: This will permanently delete your account and all your saved flashcards. This action cannot be undone. Are you absolutely sure?")) {
      return;
    }
    setIsLoading(true);
    try {
      await api('/api/auth/account', { method: 'DELETE' });
      toast.success("Account deleted. We're sorry to see you go.");
      logoutAction();
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || "Deletion failed");
      setIsLoading(false);
    }
  };
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Account Settings</h1>
          <p className="text-xl text-muted-foreground font-medium">Manage your identity and security preferences.</p>
        </header>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-10 h-12 bg-muted/50 p-1">
            <TabsTrigger value="profile" className="font-bold data-[state=active]:bg-background">
              <User className="h-4 w-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="font-bold data-[state=active]:bg-background">
              <Lock className="h-4 w-4 mr-2" /> Security
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="bg-slate-50 border-b pb-6">
                <CardTitle className="text-lg">Public Identity</CardTitle>
                <CardDescription>How you appear within the BlunderBank ecosystem.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleUpdateUsername} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 max-w-sm"
                    />
                    <p className="text-xs text-muted-foreground">This is your unique handle used for login.</p>
                  </div>
                  <Button disabled={isLoading || username === user?.username} type="submit" className="font-black">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-5 w-5" />
                  <CardTitle className="text-lg">Danger Zone</CardTitle>
                </div>
                <CardDescription className="text-destructive/80">Permanent, irreversible actions.</CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="font-bold">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="font-black h-12 px-8" 
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="bg-slate-50 border-b pb-6">
                <CardTitle className="text-lg">Update Password</CardTitle>
                <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleChangePassword} className="space-y-6 max-w-sm">
                  <div className="space-y-2">
                    <Label htmlFor="old-pass">Current Password</Label>
                    <Input 
                      id="old-pass" 
                      type="password" 
                      value={passwords.old} 
                      onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-pass">New Password</Label>
                    <Input 
                      id="new-pass" 
                      type="password" 
                      value={passwords.new} 
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pass">Confirm New Password</Label>
                    <Input 
                      id="confirm-pass" 
                      type="password" 
                      value={passwords.confirm} 
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <Button disabled={isLoading || !passwords.old || !passwords.new} type="submit" className="font-black w-full h-11">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Security
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="bg-muted/30 py-4 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-medium text-muted-foreground">You will remain logged in after changing your password.</p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}