# PandeGooseium 🦢🎲

Un jeu de l'oie multijoueur en temps réel sur le thème de la mythologie grecque et des Enfers, développé avec Next.js, Three.js et Socket.IO.

## 🎮 Caractéristiques

- **Jeu de l'oie classique** avec 63 cases thématiques
- **Multijoueur temps réel** via WebSocket
- **Plateau en 3D** interactif avec Three.js/React Three Fiber
- **Questions mythologiques** sur les Enfers grecs (Hadès, Perséphone, Cerbère...)
- **Chat en temps réel** entre joueurs
- **Interface moderne** avec animations et effets visuels

## 🛠️ Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **3D/Animations**: Three.js, React Three Fiber, @react-three/drei
- **Styling**: Tailwind CSS 4
- **WebSocket**: Socket.IO
- **Tests**: Jest, Testing Library
- **Déploiement**: Render

## 🚀 Installation

1. **Clonez le repository**
   ```bash
   git clone https://github.com/votre-username/pandegooseium.git
   cd pandegooseium
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   ```

3. **Configurez l'environnement** (optionnel)
   ```bash
   cp .env.example .env.local
   # Ajustez NEXT_PUBLIC_WS_SERVER si nécessaire
   ```

## 🎯 Développement

**Démarrage rapide** (Next.js + WebSocket) :
```bash
npm run dev:all
```

**Démarrage séparé** :
```bash
npm run dev     # Next.js sur http://localhost:3000
npm run dev:ws  # WebSocket sur port 3001
```

## 📦 Production

**Build et démarrage** :
```bash
npm run build
npm start       # Serveur intégré Next.js + Socket.IO
```

## 🧪 Tests

```bash
npm test                    # Tous les tests
npm run test:watch         # Mode watch
npm run test:coverage      # Avec couverture
npm run test:category api  # Tests par catégorie
```

## 🎲 Comment Jouer

1. Ouvrez le jeu dans votre navigateur
2. Entrez votre nom de joueur
3. Lancez le dé pour avancer sur le plateau
4. Répondez aux questions mythologiques
5. Chatez avec les autres joueurs
6. Premier arrivé à la case 63 gagne !

## 📁 Structure du Projet

```
├── src/
│   ├── app/                 # Pages et API routes Next.js
│   ├── components/          # Composants React (plateau, chat, etc.)
│   ├── hooks/              # Hooks personnalisés (WebSocket, logique)
│   ├── types/              # Types TypeScript
│   └── utils/              # Utilitaires (questions, algorithmes)
├── data/
│   └── questions.json      # 63 questions sur les Enfers grecs
├── tests/                  # Tests organisés par catégorie
├── docs/                   # Documentation technique
└── server.js              # Serveur Express intégré
```

## 🌟 Fonctionnalités Techniques

- **Rendu hybride**: Composants serveur et client optimisés
- **WebSocket robuste**: Reconnexion automatique et gestion d'erreurs
- **Performance 3D**: Optimisations Three.js pour fluidité
- **Tests complets**: API, composants, hooks et intégration
- **Déploiement simple**: Serveur intégré pour production

## 📚 Documentation

La documentation technique se trouve dans le dossier [`docs/`](./docs/) :

- [Guide de déploiement](./docs/DEPLOYMENT_GUIDE.md)
- [Guide des tests](./docs/TESTING_VERIFICATION_GUIDE.md)
- [Organisation des tests](./docs/TESTS_ORGANIZATION_SUMMARY.md)
- [Résumé du refactoring](./docs/REFACTORING_SUMMARY.md)
- [Fix Render](./docs/RENDER_FIX_GUIDE.md)

## 🤝 Contribution

1. Forkez le projet
2. Créez votre branche (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- Mythologie grecque pour l'inspiration thématique
- Communauté Next.js pour les outils exceptionnels
- React Three Fiber pour la simplicité du 3D
- Socket.IO pour le temps réel robuste
- Aux enseignants du Lycée Monté Cristo pour leur soutien
