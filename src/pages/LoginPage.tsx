import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Swords, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AuthResponse } from '@shared/types';
export function LoginPage() {
  const navigate = useNavigate();
  const loginAction = useAuthStore(s => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const handleAuth = async (type: 'login' | 'signup') => {
    if (!formData.username || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (type === 'signup' && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const data = await api<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username: formData.username, password: formData.password })
      });
      console.log('Auth API response:', {user: data.user?.username, tokenPrefix: data.token?.slice(0,10)} );
      loginAction(data.user, data.token);
      toast.success(type === 'login' ? "Welcome back!" : "Account created successfully!");
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-soft border-none overflow-hidden">
        <CardHeader className="bg-slate-900 text-white text-center py-10 space-y-4">
          <div className="mx-auto h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/5">
            <Swords className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-black tracking-tight">BlunderBank</CardTitle>
            <CardDescription className="text-slate-400 font-medium">Master your mistakes, one card at a time.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
              <TabsTrigger value="login" className="font-bold">Login</TabsTrigger>
              <TabsTrigger value="signup" className="font-bold">Signup</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="username" 
                    placeholder="Grandmaster123" 
                    className="pl-10 h-11"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10 h-11"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-12 btn-gradient font-bold mt-4" 
                onClick={() => handleAuth('login')}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Sign In"}
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-username">Username</Label>
                <Input 
                  id="s-username" 
                  placeholder="Choose a username" 
                  className="h-11"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-password">Password</Label>
                <Input 
                  id="s-password" 
                  type="password" 
                  className="h-11"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-password">Confirm Password</Label>
                <Input 
                  id="c-password" 
                  type="password" 
                  className="h-11"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
              <Button 
                className="w-full h-12 btn-gradient font-bold mt-4" 
                onClick={() => handleAuth('signup')}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Create Account"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="pb-8 justify-center">
          <p className="text-xs text-muted-foreground font-medium">Securely stored in BlunderBank vault.</p>
        </CardFooter>
      </Card>
    </div>
  );
}