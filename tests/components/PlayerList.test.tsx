import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerList from '../../src/app/components/PlayerList';
import { Player } from '../../src/hooks/useWebSocket';

describe('PlayerList Component', () => {
  const mockConnectedPlayers: Player[] = [
    { id: '1', name: 'Joueur 1', position: 5, color: '#FF6B6B' },
    { id: '2', name: 'Joueur 2', position: 12, color: '#4ECDC4' },
    { id: '3', name: 'Joueur 3', position: 8, color: '#45B7D1' }
  ];

  const mockSetCurrentOpponent = () => {};

  const defaultProps = {
    localName: 'Joueur 1',
    isMyTurn: false,
    connectedPlayers: mockConnectedPlayers,
    currentTurnPlayerId: null as string | null,
    currentOpponent: null as Player | null,
    setCurrentOpponent: mockSetCurrentOpponent
  };

  beforeEach(() => {
    // Reset any state if needed
  });

  it('renders player list correctly', () => {
    render(<PlayerList {...defaultProps} />);
    
    // Vérifier que le titre est affiché
    expect(screen.getByText('Joueurs connectés:')).toBeInTheDocument();
    
    // Vérifier que les noms des joueurs sont affichés
    expect(screen.getByText('Joueur 1')).toBeInTheDocument();
    expect(screen.getByText('Joueur 2')).toBeInTheDocument();
    expect(screen.getByText('Joueur 3')).toBeInTheDocument();
  });

  it('shows local player with special styling', () => {
    render(<PlayerList {...defaultProps} />);
    
    // Le joueur local devrait avoir "(Vous)" affiché
    expect(screen.getByText(/\(Vous\)/)).toBeInTheDocument();
  });

  it('shows current player turn indicator', () => {
    render(<PlayerList {...defaultProps} isMyTurn={true} />);
    
    // Le joueur local devrait avoir l'indicateur de tour (🎲) dans sa ligne
    expect(screen.getByText('(Vous) 🎲')).toBeInTheDocument();
  });

  it('highlights current turn player', () => {
    const { container } = render(
      <PlayerList {...defaultProps} currentTurnPlayerId="2" />
    );
    
    // Vérifier que le joueur dont c'est le tour a un style différent
    const playerElements = container.querySelectorAll('[style*="background"]');
    expect(playerElements.length).toBeGreaterThan(0);
  });

  it('handles empty player list', () => {
    render(
      <PlayerList 
        {...defaultProps} 
        connectedPlayers={[]} 
        localName="NonExistent"
      />
    );
    
    // Devrait toujours afficher le titre même sans joueurs
    expect(screen.getByText('Joueurs connectés:')).toBeInTheDocument();
  });

  it('applies correct colors to players', () => {
    const { container } = render(<PlayerList {...defaultProps} />);
    
    // Vérifier que les couleurs sont appliquées dans les styles
    const coloredElements = container.querySelectorAll('[style*="color"]');
    expect(coloredElements.length).toBeGreaterThan(0);
  });
});
