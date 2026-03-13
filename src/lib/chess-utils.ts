import { Chess } from 'chess.js';
export function validateFen(fen: string): boolean {
  try {
    const chess = new Chess();
    chess.load(fen);
    return true;
  } catch {
    return false;
  }
}
export function validateMove(fen: string, move: string | { from: string; to: string; promotion?: string }): { isValid: boolean, san?: string } {
  try {
    const chess = new Chess();
    chess.load(fen);
    const result = chess.move(move);
    if (result) return { isValid: true, san: result.san };
    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}
/**
 * Normalizes a move input (could be SAN or coordinates) into a standardized SAN string.
 * Returns null if the move is illegal in the given position.
 */
export function normalizeMoveToSan(fen: string, input: string): string | null {
  try {
    const chess = new Chess();
    chess.load(fen);
    // Try to move as SAN first, then as LAN/Coordinates
    const move = chess.move(input);
    return move ? move.san : null;
  } catch {
    return null;
  }
}
export function isMoveCorrect(fen: string, source: string, target: string, correctSan: string): boolean {
  const result = validateMove(fen, { from: source, to: target, promotion: 'q' });
  return result.isValid && result.san === correctSan;
}
export function getTurn(fen: string): 'w' | 'b' {
  try {
    const chess = new Chess();
    chess.load(fen);
    return chess.turn();
  } catch {
    return 'w';
  }
}
export function getPossibleMoves(fen: string) {
  try {
    const chess = new Chess();
    chess.load(fen);
    return chess.moves({ verbose: true });
  } catch {
    return [];
  }
}