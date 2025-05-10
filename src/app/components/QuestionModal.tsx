import React, { useEffect, useRef } from 'react';

interface QuestionModalProps {
  currentCase: number | null;
  level: string;
  question: string;
  input: string;
  setInput: (value: string) => void;
  submitAnswer: () => Promise<void>;
}

/**
 * Composant pour afficher la fenêtre modale de question
 */
export default function QuestionModal({
  currentCase,
  level,
  question,
  input,
  setInput,
  submitAnswer
}: QuestionModalProps) {
  // Référence vers l'élément input pour gérer le focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus sur l'input lorsque le modal s'affiche - déjà géré par l'attribut autoFocus
  // Néanmoins, on ajoute une sécurité au cas où l'autoFocus ne fonctionne pas sur certains navigateurs
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Gestion de la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitAnswer();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center animate-fadeIn z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-80">
        <h2 className="mb-2">Case {currentCase} ({level})</h2>
        <p className="mb-4">{question}</p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-2 mb-4 bg-gray-700 rounded"
          autoFocus
          ref={inputRef}
        />
        <button
          onClick={submitAnswer}
          className="px-4 py-2 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-300 transition-colors"
        >
          Valider
        </button>
      </div>
    </div>
  );
}
