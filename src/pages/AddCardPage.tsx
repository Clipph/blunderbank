import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { validateFen, validateMove, getTurn } from '@/lib/chess-utils';
export function AddCardPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [move, setMove] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turn = useMemo(() => getTurn(fen), [fen]);
  const onDrop = (source: string, target: string) => {
    const result = validateMove(fen, { from: source, to: target, promotion: 'q' });
    if (result.isValid && result.san) {
      setMove(result.san);
      return true;
    }
    return false;
  };
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
      toast.success("Flashcard added!");
      navigate('/manage');
    } catch (err) {
      toast.error("Failed to save card");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <AppLayout container>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">Add New Blunder</h1>
            <p className="text-muted-foreground">Setup the position and the correction.</p>
          </header>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fen">FEN Position</Label>
              <Input
                id="fen"
                value={fen}
                onChange={(e) => {
                  const val = e.target.value;
                  setFen(val);
                }}
                placeholder="Paste FEN here..."
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
              />
              <p className="text-2xs text-muted-foreground">Position before your blunder happened.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="move">Correct Move (SAN)</Label>
              <Input
                id="move"
                value={move}
                onChange={(e) => setMove(e.target.value)}
                placeholder="e.g. Nf3, O-O, Bxe5"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                inputMode="text"
                className="font-mono"
              />
              <p className="text-2xs text-muted-foreground">Play the move on the board to auto-fill.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Lesson Learned</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why was this move better? What did you miss?"
                className="h-32"
              />
            </div>
            <Button type="submit" className="w-full btn-gradient" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Flashcard"}
            </Button>
          </form>
        </div>
        <div className="space-y-4">
          <Card className="overflow-hidden shadow-soft">
            <CardHeader className="bg-muted/50 py-3 border-b">
              <CardTitle className="text-sm font-medium">Interactive Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-square w-full max-w-[500px] mx-auto bg-slate-900">
                <Chessboard
                  id="add-preview-board"
                  position={validateFen(fen) ? fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                  onPieceDrop={onDrop}
                  boardOrientation={turn === 'w' ? 'white' : 'black'}
                  animationDuration={200}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-center gap-2 py-2">
            <div className={cn("w-3 h-3 rounded-full border", turn === 'w' ? 'bg-white' : 'bg-black')} />
            <span className="text-xs font-medium text-muted-foreground">
              Turn: {turn === 'w' ? 'White' : 'Black'}
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}