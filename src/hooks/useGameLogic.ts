import { useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  name?: string;
  position?: number;
  [key: string]: unknown;
}

interface UseGameLogicReturn {
  position: number;
  setPosition: (position: number) => void;
  lastRoll: number | undefined;
  currentCase: number | null;
  question: string;
  level: string;
  input: string;
  setInput: (input: string) => void;
  modalOpen: boolean;
  rollDie: () => Promise<void>;
  submitAnswer: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer la logique du jeu de l'oie
 */
export function useGameLogic(
  isMulti: boolean,
  isMyTurn: boolean,
  localName: string,
  sendMessage: (message: WebSocketMessage) => void,
  setFeedback: (message: string) => void
): UseGameLogicReturn {
  const [position, setPosition] = useState<number>(1);
  const [lastRoll, setLastRoll] = useState<number | undefined>();
  const [currentCase, setCurrentCase] = useState<number | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Fonction pour lancer le dé
  const rollDie = useCallback(async () => {
    // Ne permettre de lancer le dé que si c'est notre tour
    if (isMulti && !isMyTurn) {
      setFeedback("Ce n'est pas votre tour");
      return;
    }
    
    try {
      const res = await fetch('/api/roll');
      const data = await res.json();
      const roll = data.roll;
      
      setLastRoll(roll);
      const next = Math.min(40, position + roll);
      setCurrentCase(next);
      
      const q = await fetch(`/api/question/${next}`);
      const qd = await q.json();
      
      setQuestion(qd.question);
      setLevel(qd.level);
      setInput('');
      setFeedback('');
      setModalOpen(true);
    } catch (error) {
      console.error('Erreur lors du lancer de dé:', error);
      setFeedback('Erreur lors du lancer de dé');
    }
  }, [isMulti, isMyTurn, position, setFeedback]);

  // Fonction pour soumettre une réponse
  const submitAnswer = useCallback(async () => {
    if (currentCase == null) return;
    
    try {
      const res = await fetch(`/api/question/${currentCase}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: input })
      });
      
      const data = await res.json();
      const correct = data.correct;
      
      if (correct) {
        setPosition(currentCase);
        if (isMulti) {
          sendMessage({ 
            type: 'move',
            name: localName,
            position: currentCase
          });
        }
        setFeedback('Bonne réponse !');
      } else {
        const prev = Math.max(1, currentCase - 1);
        setPosition(prev);
        if (isMulti) {
          sendMessage({ 
            type: 'move',
            name: localName,
            position: prev
          });
        }
        setFeedback(`Mauvaise réponse. Réponse attendue: ${data.correctAnswer}`);
      }
      
      setModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la soumission de la réponse:', error);
      setFeedback('Erreur lors de la soumission de la réponse');
      setModalOpen(false);
    }
  }, [currentCase, input, isMulti, localName, sendMessage, setFeedback]);

  return {
    position,
    setPosition,
    lastRoll,
    currentCase,
    question,
    level,
    input,
    setInput,
    modalOpen,
    rollDie,
    submitAnswer
  };
}
