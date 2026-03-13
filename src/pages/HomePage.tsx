import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import type { FlashCard } from '@shared/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, Swords, Target, TrendingUp, BarChart3, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
export function HomePage() {
  const { userId } = useAuth();
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', userId],
    queryFn: () => api<FlashCard[]>(`/api/users/${userId}/cards`),
  });
  const stats = React.useMemo(() => {
    const total = cards.length;
    const reviewed = cards.filter(c => c.stats.timesReviewed > 0).length;
    const totalAttempts = cards.reduce((acc, c) => acc + c.stats.timesReviewed, 0);
    const totalCorrect = cards.reduce((acc, c) => acc + c.stats.timesCorrect, 0);
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    let accuracyColor = 'text-muted-foreground';
    if (totalAttempts > 0) {
      if (accuracy >= 80) accuracyColor = 'text-emerald-500';
      else if (accuracy >= 50) accuracyColor = 'text-amber-500';
      else accuracyColor = 'text-destructive';
    }
    const recentActivity = [...cards]
      .sort((a, b) => (b.stats.lastReviewedAt || b.createdAt) - (a.stats.lastReviewedAt || a.createdAt))
      .slice(0, 3);
    return { total, reviewed, accuracy, accuracyColor, recentActivity };
  }, [cards]);
  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>;
  return (
    <AppLayout container>
      <div className="space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Dashboard</h1>
          <p className="text-xl text-muted-foreground">Master your mistakes, one move at a time.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Library</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Positions saved</p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Global Accuracy</CardTitle>
              <TrendingUp className={`h-4 w-4 ${stats.accuracyColor} transition-colors`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.accuracyColor}`}>{stats.accuracy}%</div>
              <p className="text-xs text-muted-foreground mt-1">Based on all attempts</p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.reviewed}</div>
              <p className="text-xs text-muted-foreground mt-1">Cards with history</p>
            </CardContent>
          </Card>
        </div>
        {cards.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Recent Activity</h2>
                <Button variant="link" asChild className="px-0">
                  <Link to="/manage">View all cards</Link>
                </Button>
              </div>
              <div className="space-y-4">
                {stats.recentActivity.map((card) => (
                  <Card key={card.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                          card.stats.lastResult === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 
                          card.stats.lastResult === 'wrong' ? 'border-destructive bg-red-50 text-destructive' : 
                          'border-muted bg-muted text-muted-foreground'
                        }`}>
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-mono font-bold">{card.correctMove}</p>
                          <p className="text-xs text-muted-foreground">
                            {card.stats.lastReviewedAt 
                              ? `Last practiced ${formatDistanceToNow(card.stats.lastReviewedAt)} ago`
                              : `Created ${formatDistanceToNow(card.createdAt)} ago`}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to="/manage"><ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            <Card className="flex flex-col items-center justify-center p-8 bg-primary text-primary-foreground text-center">
              <Swords className="h-12 w-12 mb-4 opacity-50" />
              <h2 className="text-2xl font-bold mb-2">Ready to Level Up?</h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xs">
                Consistent practice is the only way to eliminate recurring blunders.
              </p>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto px-12 font-bold">
                <Link to="/train">Start Training Session</Link>
              </Button>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-6 rounded-2xl border-2 border-dashed p-16 text-center bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
              <PlusCircle className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Your Bank is Empty</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                BlunderBank works best when you add positions where you actually messed up. Paste a FEN from your last game to start.
              </p>
            </div>
            <Button asChild size="lg" className="btn-gradient px-8 h-12 text-base">
              <Link to="/add">Add Your First Blunder</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}