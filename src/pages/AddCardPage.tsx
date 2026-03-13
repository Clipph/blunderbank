import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { validateFen, normalizeMoveToSan } from '@/lib/chess-utils';
import { PlusCircle, Info, Layout, CheckCircle, AlertCircle } from 'lucide-react';
export function AddCardPage() {
  const navigate = useNavigate();
  const addCard = useAppStore(s => s.addCard);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [move, setMove] = useState('');
  const [note, setNote] = useState('');
  const isFenValid = useMemo(() => validateFen(fen), [fen]);
  const sanMove = useMemo(() => {
    if (!isFenValid || !move.trim()) return null;
    return normalizeMoveToSan(fen, move.trim());
  }, [fen, move, isFenValid]);
  const isMoveValid = useMemo(() => !!sanMove, [sanMove]);
  const canSubmit = isFenValid && isMoveValid;
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      addCard({
        userId: 'local-user',
        fen: fen.trim(),
        correctMove: sanMove!,
        note: note.trim()
      });
      toast.success("Flashcard added to your bank!");
      navigate('/manage');
    } catch (error) {
      toast.error("Failed to save flashcard");
      console.error(error);
    }
  };
  return (
    <AppLayout container className="bg-slate-50/30">
      <div className="max-w-2xl mx-auto py-8 md:py-12">
        <div className="space-y-8">
          <header className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 text-primary">
              <PlusCircle className="h-6 w-6" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Add New Blunder</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Capture the mistake and save the correction.
            </p>
          </header>
          <Card className="shadow-soft border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                Card Details
              </CardTitle>
              <CardDescription>
                Provide the position details and the correct response.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fen" className="text-sm font-semibold">FEN Position</Label>
                    {fen && (
                      <div className="flex items-center gap-1">
                        {isFenValid ? (
                          <span className="text-emerald-500 text-xs flex items-center gap-1 font-medium">
                            <CheckCircle className="h-3 w-3" /> Valid Position
                          </span>
                        ) : (
                          <span className="text-destructive text-xs flex items-center gap-1 font-medium">
                            <AlertCircle className="h-3 w-3" /> Invalid FEN
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Input
                    id="fen"
                    value={fen}
                    onChange={(e) => setFen(e.target.value)}
                    placeholder="rnbqkbnr/pppppppp/..."
                    className="bg-secondary/50 font-mono text-sm focus-visible:ring-primary"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                  />
                  <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>The board state just before your mistake.</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="move" className="text-sm font-semibold">Correct Move (SAN)</Label>
                    {move && (
                      <div className="flex items-center gap-1">
                        {isMoveValid ? (
                          <span className="text-emerald-500 text-xs flex items-center gap-1 font-medium">
                            <CheckCircle className="h-3 w-3" /> Legal Move: {sanMove}
                          </span>
                        ) : (
                          <span className="text-destructive text-xs flex items-center gap-1 font-medium">
                            <AlertCircle className="h-3 w-3" /> Illegal or invalid move
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Input
                    id="move"
                    value={move}
                    onChange={(e) => setMove(e.target.value)}
                    placeholder="e.g. Nf3, Bxe5, O-O"
                    className="font-mono text-lg h-12 focus-visible:ring-primary"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-semibold">Lesson Learned</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Why was this move better?"
                    className="min-h-[120px] resize-none bg-secondary/30 focus-visible:ring-primary"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full btn-gradient h-12 text-base font-bold shadow-lg"
                  disabled={!canSubmit}
                >
                  Create Flashcard
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}