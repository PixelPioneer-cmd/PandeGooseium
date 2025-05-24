#!/bin/bash

# Script de test local pour débugger le problème des joueurs invisibles
# Exécutez ce script pour démarrer l'environnement de test

echo "🚀 Démarrage de l'environnement de test local"
echo "📋 Instructions:"
echo "1. Ouvrez http://localhost:3000 dans DEUX onglets différents"
echo "2. Dans chaque onglet, cliquez sur 'Mode Multijoueur'"
echo "3. Entrez des noms différents (ex: 'TestJ1' et 'TestJ2')"
echo "4. Regardez la console du navigateur et les logs du terminal"
echo "5. Vérifiez si les deux joueurs se voient dans la liste"
echo ""
echo "🔍 Logs à surveiller:"
echo "- Console navigateur: 'Reçu game_state:', 'Joueurs mis à jour:', 'Joueur local trouvé/non trouvé'"
echo "- Terminal serveur: 'Joueur ajouté:', 'Diffusion game_state avec joueurs:'"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs"
echo ""

# Démarrer les serveurs
npm run dev:all
