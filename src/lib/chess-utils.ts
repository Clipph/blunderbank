import { Chess } from 'chess.js';
export function validateFen(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return true;
  } catch {
    return false;
  }
}
export function validateMove(fen: string, moveStr: string): { isValid: boolean, san?: string } {
  try {
    const chess = new Chess(fen);
    const move = chess.move(moveStr);
    if (move) return { isValid: true, san: move.san };
    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}
export function isMoveCorrect(fen: string, source: string, target: string, correctSan: string): boolean {
  try {
    const chess = new Chess(fen);
    const move = chess.move({ from: source, to: target, promotion: 'q' });
    if (!move) return false;
    // Compare SAN or LAN if needed, but SAN is safest
    return move.san === correctSan;
  } catch {
    return false;
  }
}
export function getPossibleMoves(fen: string) {
  try {
    const chess = new Chess(fen);
    return chess.moves({ verbose: true });
  } catch {
    return [];
  }
}