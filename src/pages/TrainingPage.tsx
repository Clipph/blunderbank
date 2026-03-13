import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Chessboard } from 'react-chessboard';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { normalizeMoveToSan, getTurn } from '@/lib/chess-utils';
import type { FlashCard } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Swords, ArrowRight, Keyboard } from 'lucide-react';
export function TrainingPage() {
  const { userId } = useAuth();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'correct' | 'wrong'>('waiting');
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', userId],
    queryFn: () => api<FlashCard[]>(`/api/users/${userId}/cards`),
  });
  const attemptMutation = useMutation({
    mutationFn: ({ id, correct }: { id: string; correct: boolean }) =>
      api(`/api/cards/${id}/attempt`, { method: 'POST', body: JSON.stringify({ correct }) }),
  });
  const currentCard = cards[currentCardIndex];
  useEffect(() => {
    if (status === 'waiting' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status, currentCardIndex]);
  const handleSubmitMove = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || status !== 'waiting' || !currentCard) return;
    const normalizedInput = normalizeMoveToSan(currentCard.fen, userInput.trim());
    const isCorrect = normalizedInput === currentCard.correctMove;
    if (isCorrect) {
      setStatus('correct');
      attemptMutation.mutate({ id: currentCard.id, correct: true });
    } else {
      setStatus('wrong');
      attemptMutation.mutate({ id: currentCard.id, correct: false });
    }
  };
  const nextPuzzle = () => {
    setStatus('waiting');
    setUserInput('');
    // Pick a random index that isn't the current one if possible
    if (cards.length > 1) {
      let nextIndex = currentCardIndex;
      while (nextIndex === currentCardIndex) {
        nextIndex = Math.floor(Math.random() * cards.length);
      }
      setCurrentCardIndex(nextIndex);
    } else {
      setCurrentCardIndex(0);
    }
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
  const turn = getTurn(currentCard.fen);
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Swords className="h-6 w-6 text-primary" /> Training Mode
            </h1>
            <p className="text-muted-foreground">Type the correct move in SAN notation.</p>
          </div>
          <div className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full border">
            Card {currentCardIndex + 1} / {cards.length}
          </div>
        </header>
        <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="space-y-4">
            <div className="aspect-square w-full shadow-2xl rounded-xl overflow-hidden bg-slate-900 border-4 border-slate-800">
              <Chessboard
                position={currentCard.fen}
                arePiecesDraggable={false}
                boardOrientation={turn === 'w' ? 'white' : 'black'}
                animationDuration={300}
              />
            </div>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${turn === 'w' ? 'bg-white border' : 'bg-black'}`} />
                <span className="text-sm font-medium">{turn === 'w' ? "White's turn" : "Black's turn"} to move</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{currentCard.fen}</p>
            </div>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Keyboard className="h-4 w-4" /> Your Correction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmitMove} className="space-y-3">
                  <Input
                    ref={inputRef}
                    placeholder="e.g. Nf3, O-O"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={status !== 'waiting'}
                    className="text-lg font-mono text-center uppercase"
                    autoFocus
                  />
                  {status === 'waiting' && (
                    <Button type="submit" className="w-full btn-gradient" disabled={!userInput.trim()}>
                      Submit Move
                    </Button>
                  )}
                </form>
                {status === 'correct' && (
                  <Alert className="bg-green-50 border-green-200 text-green-800 animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="font-bold">Correct!</AlertTitle>
                    <AlertDescription>
                      You found <span className="font-mono font-bold">{currentCard.correctMove}</span>.
                    </AlertDescription>
                  </Alert>
                )}
                {status === 'wrong' && (
                  <Alert variant="destructive" className="animate-in fade-in zoom-in-95">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Missed it!</AlertTitle>
                    <AlertDescription>
                      The move was <span className="font-mono font-bold underline">{currentCard.correctMove}</span>.
                    </AlertDescription>
                  </Alert>
                )}
                {(status === 'correct' || status === 'wrong') && (
                  <div className="space-y-4 pt-2 animate-in slide-in-from-bottom-2">
                    <div className="bg-muted p-3 rounded-lg border">
                      <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Coach's Note</p>
                      <p className="text-sm leading-relaxed italic">
                        {currentCard.note || "You didn't leave a note for this position."}
                      </p>
                    </div>
                    <Button onClick={nextPuzzle} className="w-full bg-primary text-primary-foreground group">
                      Next Puzzle <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Training Stats</p>
              <div className="flex justify-center gap-4 mt-1">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="font-bold">
                    {currentCard.stats.timesReviewed > 0 
                      ? Math.round((currentCard.stats.timesCorrect / currentCard.stats.timesReviewed) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="text-center border-l pl-4">
                  <p className="text-xs text-muted-foreground">Solved</p>
                  <p className="font-bold">{currentCard.stats.timesCorrect}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}