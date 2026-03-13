import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import type { FlashCard } from '@shared/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, Swords, Target, TrendingUp, BarChart3, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
export function HomePage() {
  const { userId } = useAuth();
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', userId],
    queryFn: () => api<FlashCard[]>(`/api/users/${userId}/cards`),
    refetchOnWindowFocus: true,
  });
  const stats = React.useMemo(() => {
    if (!cards || cards.length === 0) {
      return { total: 0, reviewed: 0, accuracy: 0, accuracyColor: 'text-muted-foreground', recentActivity: [] };
    }
    const total = cards.length;
    const reviewed = cards.filter(c => c.stats.timesReviewed > 0).length;
    const totalAttempts = cards.reduce((acc, c) => acc + (c.stats.timesReviewed || 0), 0);
    const totalCorrect = cards.reduce((acc, c) => acc + (c.stats.timesCorrect || 0), 0);
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    let accuracyColor = 'text-muted-foreground';
    if (totalAttempts > 0) {
      if (accuracy >= 80) accuracyColor = 'text-emerald-500';
      else if (accuracy >= 50) accuracyColor = 'text-amber-500';
      else accuracyColor = 'text-destructive';
    }
    const recentActivity = [...cards]
      .sort((a, b) => {
        const timeA = a.stats.lastReviewedAt || a.createdAt || 0;
        const timeB = b.stats.lastReviewedAt || b.createdAt || 0;
        return timeB - timeA;
      })
      .slice(0, 4);
    return { total, reviewed, accuracy, accuracyColor, recentActivity };
  }, [cards]);
  if (isLoading) return <div className="p-12 text-center animate-pulse text-muted-foreground font-medium">Loading your dashboard...</div>;
  return (
    <AppLayout container>
      <div className="space-y-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-black tracking-tight lg:text-5xl text-foreground">Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Eliminate recurring blunders by turning your mistakes into interactive training.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden group border-none shadow-soft bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Positions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Saved in your library</p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group border-none shadow-soft bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Practice Accuracy</CardTitle>
              <TrendingUp className={`h-4 w-4 ${stats.accuracyColor} transition-colors duration-300`} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-black tracking-tighter ${stats.accuracyColor}`}>{stats.accuracy}%</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Overall success rate</p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group border-none shadow-soft bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Cards</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter">{stats.reviewed}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Cards with practice data</p>
            </CardContent>
          </Card>
        </div>
        {cards.length > 0 ? (
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
                <Button variant="ghost" asChild className="px-0 h-auto font-black text-xs uppercase tracking-widest hover:bg-transparent hover:text-primary">
                  <Link to="/manage">View Library <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
              <div className="grid gap-4">
                {stats.recentActivity.map((card) => (
                  <Card key={card.id} className="hover:bg-accent/30 transition-all duration-200 border-none shadow-sm hover:shadow-soft group">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 shadow-inner transition-colors ${
                          card.stats.lastResult === 'correct' ? 'border-emerald-500/20 bg-emerald-50 text-emerald-600' :
                          card.stats.lastResult === 'wrong' ? 'border-destructive/20 bg-red-50 text-destructive' :
                          'border-muted bg-muted/30 text-muted-foreground'
                        }`}>
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-mono font-black text-lg tracking-tight group-hover:text-primary transition-colors">{card.correctMove}</p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {card.stats.lastReviewedAt
                              ? `Practiced ${formatDistanceToNow(card.stats.lastReviewedAt)} ago`
                              : `Created ${formatDistanceToNow(card.createdAt)} ago`}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to="/manage"><ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            <Card className="flex flex-col items-center justify-center p-10 bg-slate-900 text-slate-50 text-center border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                  <Swords className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black mb-3">Ready for Training?</h2>
                <p className="text-slate-400 mb-8 text-sm font-medium leading-relaxed">
                  Consistent practice is the only path to mastery. Test your memory on saved positions now.
                </p>
                <Button asChild size="lg" variant="secondary" className="w-full font-black text-base h-14 rounded-xl shadow-xl hover:scale-[1.02] transition-transform">
                  <Link to="/train">Start Training Session</Link>
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-8 rounded-3xl border-4 border-dashed border-muted p-20 text-center bg-card shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/5 shadow-inner">
              <PlusCircle className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight">Your Bank is Empty</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-lg font-medium">
                BlunderBank is a specialized tool for your specific mistakes. Paste a FEN from a recent game where you blundered to begin.
              </p>
            </div>
            <Button asChild size="lg" className="btn-gradient px-12 h-14 text-lg font-black rounded-2xl shadow-2xl">
              <Link to="/add">Build Your Repertoire</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}