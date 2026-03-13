import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { getTurn } from '@/lib/chess-utils';
import type { FlashCard } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Swords, ArrowRight, Keyboard, X, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
export function TrainingPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
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
  const progressValue = cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0;
  useEffect(() => {
    if (status === 'waiting' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status, currentCardIndex]);
  const handleSubmitMove = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || status !== 'waiting' || !currentCard) return;
    const isCorrect = trimmedInput === currentCard.correctMove;
    if (isCorrect) {
      setStatus('correct');
      attemptMutation.mutate({ id: currentCard.id, correct: true });
    } else {
      setStatus('wrong');
      attemptMutation.mutate({ id: currentCard.id, correct: false });
    }
  };
  const nextPuzzle = () => {
    setUserInput('');
    setStatus('waiting');
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
  if (isLoading) return <div className="p-8 text-center animate-pulse">Setting up the board...</div>;
  if (cards.length === 0) return (
    <AppLayout container>
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-2">
          <Swords className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">No Training Material</h2>
        <p className="text-muted-foreground max-w-sm">
          You need to add some blunders to your bank before you can start training.
        </p>
        <Button onClick={() => navigate('/add')} className="mt-4">Add Cards</Button>
      </div>
    </AppLayout>
  );
  const turn = getTurn(currentCard.fen);
  return (
    <AppLayout container>
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Swords className="h-5 w-5 text-primary" /> Training Session
            </h1>
            <div className="flex items-center gap-4">
              <Progress value={progressValue} className="w-32 h-2" />
              <span className="text-xs font-medium text-muted-foreground">
                Card {currentCardIndex + 1} of {cards.length}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4 mr-2" /> Quit Session
          </Button>
        </header>
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="space-y-4">
            <div className="aspect-square w-full shadow-2xl rounded-xl overflow-hidden bg-slate-900 border-8 border-slate-800 ring-1 ring-slate-700">
              <Chessboard
                id={`train-board-${currentCard.id}`}
                position={currentCard.fen}
                arePiecesDraggable={false}
                boardOrientation={turn === 'w' ? 'white' : 'black'}
                animationDuration={300}
                customBoardStyle={{ borderRadius: '4px' }}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full border shadow-sm", turn === 'w' ? 'bg-white' : 'bg-black')} />
                <span className="text-sm font-semibold">{turn === 'w' ? "White" : "Black"} to move</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px] opacity-60">
                {currentCard.fen}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={cn(
              "transition-all duration-300 border-2 overflow-hidden",
              status === 'correct' ? "bg-emerald-50/40 border-emerald-300 shadow-lg shadow-emerald-100/50" :
              status === 'wrong' ? "bg-red-50/40 border-red-300 shadow-lg shadow-red-100/50" : "bg-card border-border shadow-soft"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Keyboard className="h-3 w-3" /> Input Correction
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
                    className="text-xl font-mono text-center h-14 normal-case font-bold focus-visible:ring-primary shadow-sm"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="text"
                    autoFocus
                  />
                  {status === 'waiting' && (
                    <Button type="submit" className="w-full btn-gradient h-11" disabled={!userInput.trim()}>
                      Validate Move
                    </Button>
                  )}
                </form>
                <AnimatePresence mode="wait">
                  {status === 'correct' && (
                    <motion.div
                      key="correct-feedback"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="space-y-4"
                    >
                      <Alert className="bg-emerald-500 text-white border-none shadow-lg">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                        <AlertTitle className="font-bold flex items-center gap-2">
                          Excellent! <Sparkles className="h-3 w-3 animate-pulse" />
                        </AlertTitle>
                        <AlertDescription>
                          Correct move: <span className="font-mono font-black">{currentCard.correctMove}</span>
                        </AlertDescription>
                      </Alert>
                      <div className="bg-white/70 p-4 rounded-xl border border-emerald-100 shadow-sm">
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">Lesson Learned</p>
                        <p className="text-sm leading-relaxed text-slate-700 italic">
                          "{currentCard.note || "You didn't leave a note for this blunder yet."}"
                        </p>
                      </div>
                      <Button onClick={nextPuzzle} className="w-full bg-slate-900 hover:bg-slate-800 text-white group h-12 shadow-lg">
                        Next Position <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  )}
                  {status === 'wrong' && (
                    <motion.div
                      key="wrong-feedback"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="space-y-4"
                    >
                      <Alert variant="destructive" className="border-none shadow-lg">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle className="font-bold">Not quite!</AlertTitle>
                        <AlertDescription>
                          The move was <span className="font-mono font-black underline">{currentCard.correctMove}</span>
                        </AlertDescription>
                      </Alert>
                      <div className="bg-white/70 p-4 rounded-xl border border-red-100 shadow-sm">
                        <p className="text-[10px] font-black text-red-700 uppercase tracking-wider mb-2">The Correction</p>
                        <p className="text-sm leading-relaxed text-slate-700 italic">
                          "{currentCard.note || "Check the engine to understand why this was correct."}"
                        </p>
                      </div>
                      <Button onClick={nextPuzzle} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 shadow-lg">
                        Try Another Position
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
            <div className="bg-secondary/20 p-6 rounded-2xl border border-border/50 text-center space-y-4 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Lifetime Progress</p>
              <div className="flex justify-around items-end">
                <div className="space-y-1">
                  <p className="text-2xl font-black text-slate-900">
                    {currentCard.stats.timesReviewed > 0
                      ? Math.round((currentCard.stats.timesCorrect / currentCard.stats.timesReviewed) * 100)
                      : 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold">ACCURACY</p>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div className="space-y-1">
                  <p className="text-2xl font-black text-slate-900">{currentCard.stats.timesCorrect}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">SOLVED</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => navigate('/')}>
              <Home className="h-3 w-3 mr-2" /> Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}