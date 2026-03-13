import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { validateFen } from '@/lib/chess-utils';
import { PlusCircle, Info, Layout } from 'lucide-react';
export function AddCardPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [move, setMove] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
                  <Label htmlFor="fen" className="text-sm font-semibold">FEN Position</Label>
                  <Input
                    id="fen"
                    value={fen}
                    onChange={(e) => setFen(e.target.value)}
                    placeholder="rnbqkbnr/pppppppp/..."
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="bg-secondary/50 font-mono text-sm"
                  />
                  <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>The board state just before your mistake.</span>
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
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <p className="text-2xs text-muted-foreground">Standard Algebraic Notation for the optimal response.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-semibold">Lesson Learned</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Why was this move better? (e.g. 'Pinned piece', 'King safety')"
                    className="min-h-[120px] resize-none bg-secondary/30"
                  />
                </div>
                <Button type="submit" className="w-full btn-gradient h-12 text-base font-bold" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Create Flashcard"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Submission Tip</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verify your FEN and move notation before saving. You can edit these later in the Card Manager.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}