import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Chessboard } from 'react-chessboard';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { isMoveCorrect } from '@/lib/chess-utils';
import type { FlashCard } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Swords, ArrowRight } from 'lucide-react';
import { Chess } from 'chess.js';
export function TrainingPage() {
  const { userId } = useAuth();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'correct' | 'wrong'>('waiting');
  const [key, setKey] = useState(0); // Force board reset
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', userId],
    queryFn: () => api<FlashCard[]>(`/api/users/${userId}/cards`),
  });
  const attemptMutation = useMutation({
    mutationFn: ({ id, correct }: { id: string; correct: boolean }) => 
      api(`/api/cards/${id}/attempt`, { method: 'POST', body: JSON.stringify({ correct }) }),
  });
  const currentCard = cards[currentCardIndex];
  const onDrop = (source: string, target: string) => {
    if (status !== 'waiting') return false;
    const correct = isMoveCorrect(currentCard.fen, source, target, currentCard.correctMove);
    if (correct) {
      setStatus('correct');
      attemptMutation.mutate({ id: currentCard.id, correct: true });
      return true;
    } else {
      setStatus('wrong');
      attemptMutation.mutate({ id: currentCard.id, correct: false });
      return false;
    }
  };
  const nextPuzzle = () => {
    setStatus('waiting');
    setKey(k => k + 1);
    setCurrentCardIndex(prev => (prev + 1) % cards.length);
  };
  if (isLoading) return <div className="p-8 text-center">Loading puzzles...</div>;
  if (cards.length === 0) return (
    <AppLayout container>
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">No cards to train on!</h2>
        <p className="text-muted-foreground mt-2">Go to "Add Card" to start building your bank.</p>
      </div>
    </AppLayout>
  );
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Swords className="h-6 w-6" /> Training Mode
            </h1>
            <p className="text-muted-foreground">Find the winning correction.</p>
          </div>
          <div className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
            Puzzle {currentCardIndex + 1} / {cards.length}
          </div>
        </header>
        <div className="grid md:grid-cols-[1fr_300px] gap-8">
          <div className="aspect-square w-full shadow-2xl rounded-xl overflow-hidden bg-slate-900 border-4 border-slate-800">
            <Chessboard 
              key={key}
              position={currentCard.fen} 
              onPieceDrop={onDrop}
              boardOrientation={new Chess(currentCard.fen).turn() === 'w' ? 'white' : 'black'}
              animationDuration={200}
            />
          </div>
          <div className="space-y-6">
            {status === 'correct' && (
              <Alert className="bg-green-50 border-green-200 text-green-800 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Brilliant!</AlertTitle>
                <AlertDescription>That's the correct move. Your memory is sharp.</AlertDescription>
              </Alert>
            )}
            {status === 'wrong' && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Not quite!</AlertTitle>
                <AlertDescription>
                  The correct move was <span className="font-bold underline">{currentCard.correctMove}</span>.
                </AlertDescription>
              </Alert>
            )}
            {(status === 'correct' || status === 'wrong') && (
              <Card className="animate-in fade-in slide-in-from-bottom-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Mistake Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed italic">"{currentCard.note || "No notes provided for this position."}"</p>
                  <Button onClick={nextPuzzle} className="w-full btn-gradient group">
                    Next Puzzle <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            )}
            {status === 'waiting' && (
              <div className="p-6 rounded-xl border border-dashed text-center space-y-2">
                <p className="text-sm font-medium">It's {new Chess(currentCard.fen).turn() === 'w' ? 'White' : 'Black'}'s turn</p>
                <p className="text-xs text-muted-foreground">Drag and drop the correct piece.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}