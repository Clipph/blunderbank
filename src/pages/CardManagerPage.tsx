import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import type { FlashCard } from '@shared/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Trash2, PlusCircle, Library, Target, Clock, Pencil, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { normalizeMoveToSan } from '@/lib/chess-utils';
export function CardManagerPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);
  const [editForm, setEditForm] = useState({ correctMove: '', note: '' });
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', userId],
    queryFn: () => api<FlashCard[]>(`/api/users/${userId}/cards`),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/cards/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', userId] });
      toast.success("Card removed from your bank");
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; correctMove: string; note: string }) =>
      api(`/api/cards/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify({ correctMove: payload.correctMove, note: payload.note }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', userId] });
      toast.success("Card updated successfully");
      setEditingCard(null);
    },
    onError: () => {
      toast.error("Failed to update card");
    }
  });
  const handleEditClick = (card: FlashCard) => {
    setEditingCard(card);
    setEditForm({ correctMove: card.correctMove, note: card.note });
  };
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    const trimmedMove = editForm.correctMove.trim();
    if (!trimmedMove) {
      toast.error("Correct move is required");
      return;
    }
    // Normalize and validate the move against the FEN before updating
    const normalizedSan = normalizeMoveToSan(editingCard.fen, trimmedMove);
    if (!normalizedSan) {
      toast.error("Invalid or illegal move for this position");
      return;
    }
    updateMutation.mutate({
      id: editingCard.id,
      correctMove: normalizedSan,
      note: editForm.note,
    });
  };
  if (isLoading) return <div className="p-12 text-center animate-pulse">Loading your repertoire...</div>;
  return (
    <AppLayout container>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Library className="h-7 w-7 text-primary" /> Card Manager
            </h1>
            <p className="text-muted-foreground">You have {cards.length} saved positions in your bank.</p>
          </div>
          <Button asChild className="btn-gradient shrink-0">
            <Link to="/add">
              <PlusCircle className="h-4 w-4 mr-2" /> New Flashcard
            </Link>
          </Button>
        </header>
        <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Correct Move</TableHead>
                <TableHead className="hidden lg:table-cell">Lesson Note</TableHead>
                <TableHead className="hidden sm:table-cell">Accuracy</TableHead>
                <TableHead className="hidden md:table-cell">Last Review</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                        <Library className="h-6 w-6 text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-lg font-medium text-slate-900">No cards saved yet</p>
                      <p className="text-sm text-muted-foreground mb-4">Your blunder bank is currently empty.</p>
                      <Button asChild variant="outline" size="sm">
                        <Link to="/add">Add Your First Card</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => (
                  <TableRow key={card.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      {card.stats.lastResult ? (
                        <Badge variant={card.stats.lastResult === 'correct' ? 'default' : 'destructive'} className="uppercase text-[10px] px-2 py-0.5">
                          {card.stats.lastResult}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="uppercase text-[10px] px-2 py-0.5">Unseen</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded font-mono font-bold text-sm">
                        {card.correctMove}
                      </code>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[250px] truncate italic text-muted-foreground text-sm">
                      {card.note || "No notes provided."}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {card.stats.timesReviewed > 0
                            ? `${Math.round((card.stats.timesCorrect / card.stats.timesReviewed) * 100)}%`
                            : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {card.stats.lastReviewedAt
                          ? formatDistanceToNow(card.stats.lastReviewedAt) + " ago"
                          : "Never"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => handleEditClick(card)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this card?")) {
                              deleteMutation.mutate(card.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Flashcard</DialogTitle>
              <DialogDescription>
                Update the correct move or your personal notes for this position.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-move">Correct Move (SAN)</Label>
                <Input
                  id="edit-move"
                  value={editForm.correctMove}
                  onChange={(e) => setEditForm({ ...editForm, correctMove: e.target.value })}
                  placeholder="e.g. Nf3"
                  className="font-mono"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Note: Move must be legal for the saved FEN.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-note">Lesson Note</Label>
                <Textarea
                  id="edit-note"
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  placeholder="Why is this move better?"
                  className="h-32"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCard(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {cards.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button asChild size="lg" className="px-12 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
              <Link to="/train">Practice These Positions</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}