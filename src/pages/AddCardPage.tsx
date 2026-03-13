import React, { useState } from 'react';
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
import { validateFen, validateMove } from '@/lib/chess-utils';
import { Chess } from 'chess.js';
export function AddCardPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [move, setMove] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onDrop = (source: string, target: string) => {
    const { isValid, san } = validateMove(fen, { from: source, to: target, promotion: 'q' });
    if (isValid && san) {
      setMove(san);
      return true;
    }
    return false;
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFen(fen)) return toast.error("Invalid FEN string");
    if (!move) return toast.error("Please specify the correct move");
    setIsSubmitting(true);
    try {
      await api('/api/cards', {
        method: 'POST',
        body: JSON.stringify({ userId, fen, correctMove: move, note }),
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
                onChange={(e) => setFen(e.target.value)} 
                placeholder="Paste FEN here..."
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
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 py-3">
              <CardTitle className="text-sm font-medium">Interactive Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-square w-full max-w-[500px] mx-auto">
                <Chessboard 
                  position={fen} 
                  onPieceDrop={onDrop}
                  boardOrientation={new Chess(fen).turn() === 'w' ? 'white' : 'black'}
                />
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-center text-muted-foreground">
            Current turn: {new Chess(fen).turn() === 'w' ? 'White' : 'Black'}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}