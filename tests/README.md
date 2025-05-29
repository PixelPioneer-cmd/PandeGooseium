# Tests Organization

Tous les tests du projet PandeGooseium sont organisés dans ce répertoire `tests/` pour une meilleure structure et maintainabilité.

## Structure des Tests

```
tests/
├── README.md                           # Ce fichier
├── api/                               # Tests des routes API
│   ├── question-route.test.ts         # Tests de l'API des questions
│   └── roll-route.test.ts             # Tests de l'API de lancer de dé
├── components/                        # Tests des composants React
│   └── color-consistency.test.ts      # Tests de cohérence des couleurs
├── hooks/                            # Tests des hooks React personnalisés
│   └── useWebSocket.test.ts          # Tests du hook WebSocket
├── integration/                      # Tests d'intégration
│   ├── multiplayer-visibility.test.js # Tests de visibilité multijoueur
│   ├── simple-connection.test.js     # Tests de connexion simple
│   ├── websocket-url.test.js         # Tests d'URL WebSocket
│   └── ws-server.test.ts             # Tests du serveur WebSocket
└── utils/                           # Tests des utilitaires
    └── questions.test.ts            # Tests des utilitaires de questions
```

## Types de Tests

### 🔧 **API Tests** (`tests/api/`)
- Tests unitaires des routes API Next.js
- Vérification des réponses HTTP et de la logique métier
- Mock des dépendances externes

### 🎨 **Component Tests** (`tests/components/`)
- Tests des composants React
- Tests de rendu et d'interaction
- Tests de cohérence visuelle et fonctionnelle

### 🪝 **Hook Tests** (`tests/hooks/`)
- Tests des hooks React personnalisés
- Tests du cycle de vie et des effets de bord
- Mock des APIs externes

### 🔗 **Integration Tests** (`tests/integration/`)
- Tests d'intégration entre composants
- Tests de bout en bout (E2E)
- Tests de communication WebSocket
- Tests de scénarios utilisateur complets

### 🛠️ **Utility Tests** (`tests/utils/`)
- Tests des fonctions utilitaires
- Tests de logique métier pure
- Tests d'algorithmes et de transformations de données

## Commandes de Test

### Exécuter tous les tests
```bash
npm test
```

### Exécuter les tests en mode watch
```bash
npm run test:watch
```

### Exécuter les tests avec coverage
```bash
npm run test:coverage
```

### Exécuter des tests spécifiques
```bash
# Tests API uniquement
npm test -- tests/api

# Tests de composants uniquement
npm test -- tests/components

# Tests d'intégration uniquement
npm test -- tests/integration

# Un test spécifique
npm test -- tests/hooks/useWebSocket.test.ts
```

## Bonnes Pratiques

### 📁 **Organisation des Fichiers**
- Placez les tests dans le dossier correspondant à leur type
- Nommez les fichiers de test avec le suffixe `.test.ts` ou `.test.js`
- Utilisez des noms descriptifs pour les fichiers de test

### 🧪 **Écriture des Tests**
- Un test = un comportement spécifique
- Utilisez des descriptions claires avec `describe` et `it`
- Organisez les tests avec `beforeEach`, `afterEach` si nécessaire
- Moquez les dépendances externes pour des tests isolés

### 🔄 **Maintenance**
- Maintenez les tests à jour avec les changements de code
- Supprimez les tests obsolètes
- Refactorisez les tests quand le code change

## Configuration

Les tests utilisent Jest comme framework principal avec la configuration définie dans `jest.config.mjs`.

### Environnement de Test
- **Node.js environment** pour les tests d'API et d'utilitaires
- **jsdom environment** pour les tests de composants React
- **Mocks automatiques** pour les modules externes

### Coverage
Le coverage est généré automatiquement et inclut :
- Statements coverage
- Branches coverage
- Functions coverage
- Lines coverage

## Debugging

Pour déboguer les tests :

```bash
# Exécuter les tests en mode debug
npm run test:debug

# Exécuter un test spécifique en mode debug
npm run test:debug -- --testNamePattern="nom du test"
```

## CI/CD

Les tests sont automatiquement exécutés dans le pipeline CI/CD :
- ✅ Tests unitaires
- ✅ Tests d'intégration
- ✅ Coverage reporting
- ✅ Vérification des seuils de coverage

---

*Dernière mise à jour : 26 mai 2025*

## ✅ État de l'Organisation

### **Organisation Complétée**
- ✅ **Structure centralisée** : Tous les tests dans `/tests/`
- ✅ **Catégorisation logique** : API, composants, hooks, intégration, utilitaires
- ✅ **Scripts npm configurés** : Tests par catégorie disponibles
- ✅ **Configuration Jest mise à jour** : Support du nouveau répertoire
- ✅ **Documentation complète** : Guide d'utilisation et bonnes pratiques

### **Tests Fonctionnels**
- ✅ **Tests API** (5 tests) : Routes Next.js fonctionnelles
- ✅ **Tests utilitaires** (7 tests) : Logique métier validée
- ✅ **Tests d'intégration** (partiels) : WebSocket URL detection
- ⚠️ **Tests de hooks** : Nécessitent mocks supplémentaires
- ⚠️ **Tests de composants** : Requièrent serveur WebSocket actif

### **Commandes Validées**
```bash
npm run test:api        # ✅ 5 tests passés
npm run test:utils      # ✅ 7 tests passés
npm run test:integration # ✅ Partiellement fonctionnel
npm run test:coverage   # ✅ Disponible
npm run test:watch      # ✅ Disponible
```

### **Bénéfices Obtenus**
1. **Structure claire** : Plus de tests éparpillés dans le projet
2. **Maintenance facilitée** : Localisation rapide des tests
3. **Exécution ciblée** : Tests par catégorie selon les besoins
4. **Documentation complète** : Guide d'utilisation et bonnes pratiques
5. **Évolutivité** : Structure extensible pour nouveaux tests
