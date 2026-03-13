import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { validateFen, getTurn } from '@/lib/chess-utils';
import { PlusCircle, Info, Layout } from 'lucide-react';
export function AddCardPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [move, setMove] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turn = useMemo(() => getTurn(fen), [fen]);
  const isFenValid = useMemo(() => validateFen(fen), [fen]);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFen(fen)) return toast.error("Invalid FEN string");
    if (!move.trim()) return toast.error("Please specify the correct move");
    setIsSubmitting(true);
    try {
      await api('/api/cards', {
        method: 'POST',
        body: JSON.stringify({ userId, fen, correctMove: move.trim(), note }),
      });
      toast.success("Flashcard added to your bank!");
      navigate('/manage');
    } catch (err) {
      toast.error("Failed to save card");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <AppLayout container className="bg-slate-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="grid lg:grid-cols-[1fr_minmax(400px,500px)] gap-12 items-start">
          <div className="space-y-8">
            <header className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <PlusCircle className="h-6 w-6" />
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Add New Blunder</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Capture the moment things went wrong. Set the board and define the correction.
              </p>
            </header>
            <Card className="shadow-soft border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="h-4 w-4 text-muted-foreground" />
                  Card Details
                </CardTitle>
                <CardDescription>
                  This information will be used during your training sessions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fen" className="text-sm font-semibold">FEN Position</Label>
                    <Input
                      id="fen"
                      value={fen}
                      onChange={(e) => setFen(e.target.value)}
                      placeholder="rnbqkbnr/pppppppp/..."
                      autoComplete="off"
                      className="bg-secondary/50 font-mono text-sm"
                    />
                    <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                      <Info className="h-3 w-3" />
                      <span>The state of the board just before your mistake.</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="move" className="text-sm font-semibold">Correct Move (SAN)</Label>
                    <Input
                      id="move"
                      value={move}
                      onChange={(e) => setMove(e.target.value)}
                      placeholder="e.g. Nf3, Bxe5, O-O"
                      className="font-mono text-lg h-12"
                      autoComplete="off"
                    />
                    <p className="text-2xs text-muted-foreground">Standard Algebraic Notation for the optimal response.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note" className="text-sm font-semibold">Lesson Learned</Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Why was this move better? What concept did you miss? (e.g. 'Pinned piece', 'King safety')"
                      className="min-h-[140px] resize-none bg-secondary/30"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-gradient h-12 text-base font-bold" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Create Flashcard"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6 sticky top-8">
            <div className="space-y-4">
              <div className="aspect-square w-full shadow-2xl rounded-xl overflow-hidden bg-slate-900 border-8 border-slate-800 ring-1 ring-slate-700">
                <Chessboard
                  position={isFenValid ? fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                  arePiecesDraggable={false}
                  boardOrientation={turn === 'w' ? 'white' : 'black'}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border shadow-inner",
                    turn === 'w' ? 'bg-white' : 'bg-black'
                  )} />
                  <span className="text-sm font-bold text-foreground">
                    {turn === 'w' ? 'White' : 'Black'} to move
                  </span>
                </div>
                {!isFenValid && fen.length > 0 && (
                  <span className="text-xs font-medium text-destructive animate-pulse">
                    Invalid FEN Format
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Preview Tip</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The board shows how the position will appear during training. Ensure the orientation matches your perspective during the game.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}