import { useState, useEffect } from 'react';
import { Player, LocalPlayer } from './BoardTypes';

interface UsePlayerPositionsReturn {
  prevLocalPos: number;
  prevRemotePos: Record<string, number>;
}

export const usePlayerPositions = (
  localPlayer?: LocalPlayer,
  remotePlayers: Player[] = []
): UsePlayerPositionsReturn => {
  const [prevLocalPos, setPrevLocalPos] = useState(localPlayer?.position || 1);
  const [prevRemotePos, setPrevRemotePos] = useState<Record<string, number>>({});

  useEffect(() => {
    if (localPlayer?.position && localPlayer.position !== prevLocalPos) {
      setPrevLocalPos(localPlayer.position);
    }
  }, [localPlayer?.position, prevLocalPos]);

  useEffect(() => {
    const updated = { ...prevRemotePos };
    let changed = false;
    remotePlayers.forEach(p => {
      if (p.position && p.position !== prevRemotePos[p.id]) {
        updated[p.id] = p.position;
        changed = true;
      }
    });
    if (changed) setPrevRemotePos(updated);
  }, [remotePlayers, prevRemotePos]);

  return { prevLocalPos, prevRemotePos };
};
