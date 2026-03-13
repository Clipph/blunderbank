import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import type { FlashCard } from '@shared/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, Swords, Target, TrendingUp, BarChart3 } from 'lucide-react';
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
    return { total, reviewed, accuracy };
  }, [cards]);
  if (isLoading) return <div className="p-8 text-center">Loading stats...</div>;
  return (
    <AppLayout container>
      <div className="space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">Here is how your blunder recovery is going.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accuracy}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cards Mastered</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reviewed}</div>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed p-12 text-center bg-card">
          {cards.length === 0 ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <PlusCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-xl font-semibold">No cards yet</h2>
              <p className="text-muted-foreground max-w-sm">
                Start by adding a position where you blundered in a recent game.
              </p>
              <Button asChild className="mt-6 btn-gradient">
                <Link to="/add">Add Your First Blunder</Link>
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">Ready to train?</h2>
              <p className="text-muted-foreground">Test your memory on {cards.length} saved mistakes.</p>
              <Button asChild size="lg" className="mt-4 btn-gradient px-12">
                <Link to="/train" className="flex items-center gap-2">
                  <Swords className="h-5 w-5" />
                  Start Session
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}