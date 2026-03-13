import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import type { FlashCard } from '@shared/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
export function CardManagerPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', userId],
    queryFn: () => api<FlashCard[]>(`/api/users/${userId}/cards`),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/cards/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', userId] });
      toast.success("Card deleted");
    },
  });
  if (isLoading) return <div className="p-8 text-center">Loading cards...</div>;
  return (
    <AppLayout container>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Your Blunder Bank</h1>
          <p className="text-muted-foreground">Manage your saved positions.</p>
        </header>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Result</TableHead>
                <TableHead>Correct Move</TableHead>
                <TableHead className="hidden md:table-cell">Note</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No cards found.
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-2xs font-bold uppercase ${
                        card.stats.lastResult === 'correct' ? 'bg-green-100 text-green-700' : 
                        card.stats.lastResult === 'wrong' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {card.stats.lastResult || 'New'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono font-medium">{card.correctMove}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                      {card.note}
                    </TableCell>
                    <TableCell>
                      {card.stats.timesReviewed > 0 
                        ? `${Math.round((card.stats.timesCorrect / card.stats.timesReviewed) * 100)}%` 
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(card.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}