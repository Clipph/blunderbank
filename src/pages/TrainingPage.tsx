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
    // Strict string matching for SAN notation
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
  if (isLoading) return <div className="p-8 text-center animate-pulse">Setting up the arena...</div>;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                <Swords className="h-5 w-5 text-primary" /> Training Session
              </h1>
              <div className="flex items-center gap-4">
                <Progress value={progressValue} className="w-48 h-2" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Position {currentCardIndex + 1} / {cards.length}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4 mr-2" /> End Session
            </Button>
          </header>
          <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-start">
            <div className="space-y-4">
              <div className="aspect-square w-full shadow-2xl rounded-xl overflow-hidden bg-slate-900 border-8 border-slate-800 ring-1 ring-slate-700">
                <Chessboard
                  position={currentCard.fen}
                  arePiecesDraggable={false}
                  boardOrientation={turn === 'w' ? 'white' : 'black'}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border shadow-sm",
                    turn === 'w' ? 'bg-white' : 'bg-black'
                  )} />
                  <span className="text-sm font-bold">{turn === 'w' ? "White" : "Black"} to move</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px] opacity-40">
                  {currentCard.fen}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <Card className={cn(
                "transition-all duration-300 border-2 overflow-hidden",
                status === 'correct' ? "bg-emerald-50/40 border-emerald-300 shadow-lg shadow-emerald-100/50" :
                status === 'wrong' ? "bg-red-50/40 border-red-300 shadow-lg shadow-red-100/50" : "bg-card border-border shadow-soft"
              )}>
                <CardHeader className="pb-3 border-b border-border/10">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Keyboard className="h-3 w-3" /> User Correction
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <form onSubmit={handleSubmitMove} className="space-y-4">
                    <Input
                      ref={inputRef}
                      placeholder="Nf3, O-O..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      disabled={status !== 'waiting'}
                      className="text-2xl font-mono text-center h-16 normal-case font-black focus-visible:ring-primary shadow-sm bg-secondary/20 border-none"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    {status === 'waiting' && (
                      <Button type="submit" className="w-full btn-gradient h-12 font-bold" disabled={!userInput.trim()}>
                        Validate Response
                      </Button>
                    )}
                  </form>
                  <AnimatePresence mode="wait">
                    {status === 'correct' && (
                      <motion.div
                        key="correct-feedback"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        <Alert className="bg-emerald-500 text-white border-none shadow-lg">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                          <AlertTitle className="font-bold flex items-center gap-2 text-white">
                            Well Played! <Sparkles className="h-3 w-3" />
                          </AlertTitle>
                          <AlertDescription className="text-emerald-50">
                            Move: <span className="font-mono font-black">{currentCard.correctMove}</span>
                          </AlertDescription>
                        </Alert>
                        <div className="bg-white/90 p-5 rounded-xl border border-emerald-100 shadow-sm">
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Lesson Memo</p>
                          <p className="text-sm leading-relaxed text-slate-800 italic">
                            "{currentCard.note || "Keep this patterns in mind for your next game."}"
                          </p>
                        </div>
                        <Button onClick={nextPuzzle} className="w-full bg-slate-900 hover:bg-slate-800 text-white group h-14 text-lg font-bold shadow-xl">
                          Continue <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                    )}
                    {status === 'wrong' && (
                      <motion.div
                        key="wrong-feedback"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        <Alert variant="destructive" className="border-none shadow-lg bg-red-600">
                          <XCircle className="h-4 w-4 text-white" />
                          <AlertTitle className="font-bold text-white">Not quite right</AlertTitle>
                          <AlertDescription className="text-red-50">
                            Correct: <span className="font-mono font-black underline">{currentCard.correctMove}</span>
                          </AlertDescription>
                        </Alert>
                        <div className="bg-white/90 p-5 rounded-xl border border-red-100 shadow-sm">
                          <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2">The Solution</p>
                          <p className="text-sm leading-relaxed text-slate-800 italic">
                            "{currentCard.note || "Focus on this pattern to avoid repeating the mistake."}"
                          </p>
                        </div>
                        <Button onClick={nextPuzzle} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 text-lg font-bold shadow-xl">
                          Next Exercise
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 text-center space-y-4 shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Performance Profile</p>
                <div className="flex justify-around items-end">
                  <div className="space-y-1 text-center">
                    <p className="text-2xl font-black text-slate-900 leading-none">
                      {currentCard.stats.timesReviewed > 0
                        ? Math.round((currentCard.stats.timesCorrect / currentCard.stats.timesReviewed) * 100)
                        : 0}%
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold">ACCURACY</p>
                  </div>
                  <div className="h-8 w-px bg-border/40" />
                  <div className="space-y-1 text-center">
                    <p className="text-2xl font-black text-slate-900 leading-none">{currentCard.stats.timesCorrect}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">SOLUTIONS</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground font-bold hover:text-foreground" onClick={() => navigate('/')}>
                <Home className="h-3 w-3 mr-2" /> EXIT TRAINING
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}