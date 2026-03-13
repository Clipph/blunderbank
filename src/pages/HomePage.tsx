import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import type { FlashCard } from '@shared/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, Swords, Target, TrendingUp, BarChart3, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
export function HomePage() {
  const { userId } = useAuth();
  
  useEffect(() => {
    console.log('HomePage mounted, userId:', userId);
  }, [userId]);
  
  // FIXED: Endpoint corrected to match authenticated pattern /api/cards
  // The backend user-routes.ts provides /api/cards with JWT filtering
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', userId],
    queryFn: () => api<FlashCard[]>('/api/cards'),
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
      if (accuracy >= 85) accuracyColor = 'text-emerald-500';
      else if (accuracy >= 65) accuracyColor = 'text-amber-500';
      else accuracyColor = 'text-destructive';
    }
    const recentActivity = [...cards]
      .sort((a, b) => {
        const timeA = a.stats.lastReviewedAt || a.createdAt || 0;
        const timeB = b.stats.lastReviewedAt || b.createdAt || 0;
        return timeB - timeA;
      })
      .slice(0, 5);
    return { total, reviewed, accuracy, accuracyColor, recentActivity };
  }, [cards]);
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="p-12 text-center animate-pulse text-muted-foreground font-medium">
          Loading your dashboard...
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <div className="space-y-12">
        <header className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-black tracking-tight lg:text-6xl text-foreground">Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Eliminate recurring blunders. BlunderBank helps you convert your game-losing mistakes into winning patterns through targeted repetition.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden group border-none shadow-soft bg-card hover:shadow-glow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Positions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Saved in your library</p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group border-none shadow-soft bg-card hover:shadow-glow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Practice Accuracy</CardTitle>
              <TrendingUp className={`h-4 w-4 ${stats.accuracyColor} transition-colors duration-300`} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-black tracking-tighter ${stats.accuracyColor}`}>{stats.accuracy}%</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Overall success rate</p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden group border-none shadow-soft bg-card hover:shadow-glow-lg transition-all duration-300">
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
          <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
            <section className="space-y-8">
              <div className="flex items-center justify-between border-b pb-6">
                <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
                <Button variant="ghost" asChild className="px-0 h-auto font-black text-xs uppercase tracking-widest hover:bg-transparent hover:text-primary">
                  <Link to="/manage">View Full Library <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
              <div className="grid gap-4">
                {stats.recentActivity.map((card, idx) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="hover:bg-accent/40 transition-all duration-300 border-none shadow-sm hover:shadow-soft group cursor-default">
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-5 overflow-hidden">
                          <div className={`h-12 w-12 rounded-2xl shrink-0 flex items-center justify-center border-2 shadow-inner transition-all duration-300 ${
                            card.stats.lastResult === 'correct' ? 'border-emerald-500/20 bg-emerald-50 text-emerald-600' :
                            card.stats.lastResult === 'wrong' ? 'border-destructive/20 bg-red-50 text-destructive' :
                            'border-muted bg-muted/30 text-muted-foreground'
                          }`}>
                            <Clock className="h-5 w-5" />
                          </div>
                          <div className="space-y-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-black text-lg tracking-tight group-hover:text-primary transition-colors">{card.correctMove}</p>
                              {card.note && <BookOpen className="h-3 w-3 text-muted-foreground/30" />}
                            </div>
                            {card.note && (
                              <p className="text-xs text-muted-foreground truncate italic font-medium">
                                "{card.note}"
                              </p>
                            )}
                            <p className="text-[10px] font-bold text-muted-foreground/50">
                              {card.stats.lastReviewedAt
                                ? `Reviewed ${formatDistanceToNow(card.stats.lastReviewedAt)} ago`
                                : `Added ${formatDistanceToNow(card.createdAt)} ago`}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to="/manage"><ArrowRight className="h-4 w-4" /></Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
            <aside>
              <Card className="flex flex-col items-center justify-center p-10 bg-slate-900 text-slate-50 text-center border-none shadow-2xl relative overflow-hidden group min-h-[450px]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <Swords className="h-10 w-10 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black mb-4 tracking-tight">Training Routine</h2>
                  <p className="text-slate-400 mb-10 text-sm font-medium leading-relaxed px-4">
                    Daily practice reduces neural friction during games. Spend 5 minutes reviewing your blunders.
                  </p>
                  <Button asChild size="lg" variant="secondary" className="w-full font-black text-base h-16 rounded-2xl shadow-xl hover:scale-[1.05] active:scale-95 transition-all duration-300">
                    <Link to="/train">Launch Session</Link>
                  </Button>
                  <div className="mt-8 flex items-center gap-6 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Spaced Repetition</div>
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Mastery Check</div>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-8 rounded-[2.5rem] border-4 border-dashed border-muted p-24 text-center bg-card shadow-sm animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary/5 shadow-inner group transition-colors">
              <PlusCircle className="h-14 w-14 text-primary group-hover:rotate-90 transition-transform duration-500" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight">Your Repertoire is Empty</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-lg font-medium leading-relaxed">
                The secret to high-level chess isn't just learning new ideas—it's unlearning your recurring bad habits. Paste a position to start.
              </p>
            </div>
            <Button asChild size="lg" className="btn-gradient px-14 h-16 text-xl font-black rounded-3xl shadow-2xl hover:scale-110 transition-transform">
              <Link to="/add">Add Your First Blunder</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}