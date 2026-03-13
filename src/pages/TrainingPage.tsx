import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { CheckCircle2, XCircle, Swords, ArrowRight, Keyboard, X, Home, Sparkles, HelpCircle } from 'lucide-react';
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
  const currentCard = cards[currentCardIndex] || null;
  const progressValue = cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0;
  const turn = useMemo(() => {
    if (!currentCard) return 'w';
    return getTurn(currentCard.fen);
  }, [currentCard]);
  useEffect(() => {
    if (status === 'waiting' && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [status, currentCardIndex]);
  const handleSubmitMove = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || status !== 'waiting' || !currentCard) return;
    const isCorrect = trimmedInput.toLowerCase() === currentCard.correctMove.toLowerCase();
    if (isCorrect) {
      setStatus('correct');
      attemptMutation.mutate({ id: currentCard.id, correct: true });
    } else {
      setStatus('wrong');
      attemptMutation.mutate({ id: currentCard.id, correct: false });
    }
  };
  const handleRevealSolution = () => {
    if (status !== 'waiting' || !currentCard) return;
    setStatus('wrong');
    attemptMutation.mutate({ id: currentCard.id, correct: false });
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
  if (isLoading) return <div className="p-12 text-center animate-pulse text-muted-foreground font-medium">Setting up the arena...</div>;
  if (cards.length === 0) return (
    <AppLayout container>
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center shadow-inner">
          <Swords className="h-10 w-10 text-primary/40" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Empty Arsenal</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your blunder bank is currently empty. Add some positions to begin your journey to mastery.
          </p>
        </div>
        <Button onClick={() => navigate('/add')} size="lg" className="btn-gradient px-8 h-12 text-base">
          Add Flashcards
        </Button>
      </div>
    </AppLayout>
  );
  if (!currentCard) return null;
  return (
    <AppLayout container>
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Swords className="h-6 w-6 text-primary" /> Training Session
            </h1>
            <div className="flex items-center gap-4">
              <Progress value={progressValue} className="w-48 h-2 bg-secondary" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                {currentCardIndex + 1} / {cards.length}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground hover:bg-transparent">
            <X className="h-4 w-4 mr-2" /> End Session
          </Button>
        </header>
        <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
          <div className="space-y-4">
            <div className="aspect-square w-full shadow-2xl rounded-xl overflow-hidden bg-slate-900 border-[12px] border-slate-800 ring-1 ring-slate-700/50">
              <Chessboard
                id={1}
                position={currentCard.fen}
                arePiecesDraggable={false}
                boardOrientation={turn === 'w' ? 'white' : 'black'}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-4 h-4 rounded-full border shadow-inner transition-colors duration-500",
                  turn === 'w' ? 'bg-white' : 'bg-black border-slate-700'
                )} />
                <span className="text-sm font-bold tracking-tight">{turn === 'w' ? "White" : "Black"} to move</span>
              </div>
              <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[240px] opacity-30 select-none">
                {currentCard.fen}
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <Card className={cn(
              "transition-all duration-500 border-2 overflow-hidden",
              status === 'correct' ? "bg-emerald-50/30 border-emerald-500/30 shadow-2xl shadow-emerald-500/10" :
              status === 'wrong' ? "bg-red-50/30 border-red-500/30 shadow-2xl shadow-red-500/10" : "bg-card border-border shadow-soft"
            )}>
              <CardHeader className="pb-3 border-b border-border/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 flex items-center gap-2">
                  <Keyboard className="h-3.5 w-3.5" /> Correction Input
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <form onSubmit={handleSubmitMove} className="space-y-4">
                  <Input
                    ref={inputRef}
                    placeholder="e.g. Bxe5"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={status !== 'waiting'}
                    className="text-3xl font-mono text-center h-20 normal-case font-black focus-visible:ring-primary shadow-sm bg-secondary/10 border-none placeholder:opacity-20"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  {status === 'waiting' && (
                    <div className="space-y-3">
                      <Button 
                        type="submit" 
                        className="w-full btn-gradient h-14 font-black tracking-wide text-base shadow-lg" 
                        disabled={!userInput.trim()}
                      >
                        Submit Move
                      </Button>
                      <Button 
                        type="button"
                        variant="ghost" 
                        onClick={handleRevealSolution}
                        className="w-full text-xs text-muted-foreground font-bold hover:bg-destructive/5 hover:text-destructive transition-colors h-10"
                      >
                        <HelpCircle className="h-3.5 w-3.5 mr-2" /> I give up, reveal solution
                      </Button>
                    </div>
                  )}
                </form>
                <AnimatePresence mode="wait">
                  {status === 'correct' && (
                    <motion.div
                      key={`correct-${currentCard.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <Alert className="bg-emerald-600 text-white border-none shadow-xl">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                        <AlertTitle className="font-black flex items-center gap-2 text-white text-lg">
                          Correct! <Sparkles className="h-4 w-4" />
                        </AlertTitle>
                        <AlertDescription className="text-emerald-50 font-medium">
                          The correct move was <span className="font-mono font-black bg-white/20 px-1.5 py-0.5 rounded">{currentCard.correctMove}</span>
                        </AlertDescription>
                      </Alert>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm backdrop-blur-md">
                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-3">Memory Marker</p>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic font-medium">
                          "{currentCard.note || "No custom note saved for this position."}"
                        </p>
                      </div>
                      <Button onClick={nextPuzzle} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white group h-14 text-lg font-black shadow-2xl transition-all">
                        Continue Training <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  )}
                  {status === 'wrong' && (
                    <motion.div
                      key={`wrong-${currentCard.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <Alert variant="destructive" className="border-none shadow-xl bg-red-600">
                        <XCircle className="h-5 w-5 text-white" />
                        <AlertTitle className="font-black text-white text-lg">Not quite</AlertTitle>
                        <AlertDescription className="text-red-50 font-medium">
                          The solution was <span className="font-mono font-black underline bg-white/20 px-1.5 py-0.5 rounded">{currentCard.correctMove}</span>
                        </AlertDescription>
                      </Alert>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm backdrop-blur-md">
                        <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-3">Logic Check</p>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic font-medium">
                          "{currentCard.note || "Take a moment to analyze why this move is correct."}"
                        </p>
                      </div>
                      <Button onClick={nextPuzzle} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white h-14 text-lg font-black shadow-2xl transition-all">
                        Next Position
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 text-center space-y-4 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] font-black opacity-60">Session Metrics</p>
              <div className="flex justify-around items-end">
                <div className="space-y-1.5 text-center">
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                    {currentCard.stats.timesReviewed > 0
                      ? Math.round((currentCard.stats.timesCorrect / currentCard.stats.timesReviewed) * 100)
                      : 0}%
                  </p>
                  <p className="text-[9px] text-muted-foreground font-black tracking-wider">ACCURACY</p>
                </div>
                <div className="h-10 w-px bg-border/20" />
                <div className="space-y-1.5 text-center">
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{currentCard.stats.timesCorrect}</p>
                  <p className="text-[9px] text-muted-foreground font-black tracking-wider">SOLUTIONS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}