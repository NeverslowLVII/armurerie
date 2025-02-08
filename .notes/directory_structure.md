# Structure du Projet

## Organisation Racine

```
armurie/
├── .notes/                 # Documentation et notes du projet
├── .vscode/               # Configuration VS Code
├── Armurerie/            # Application principale
└── .cursorrules          # Configuration Cursor
```

## Application Principale (Armurerie/)

```
Armurerie/
├── src/                  # Code source principal
│   ├── app/             # Configuration et composants de l'application
│   ├── assets/          # Ressources statiques (images, fonts, etc.)
│   ├── components/      # Composants React réutilisables
│   ├── context/         # Contextes React
│   ├── hooks/           # Hooks React personnalisés
│   ├── lib/             # Bibliothèques et utilitaires
│   ├── redux/           # Configuration et slices Redux
│   ├── services/        # Services et API clients
│   ├── stores/          # Stores (gestion d'état)
│   ├── styles/          # Styles globaux et thèmes
│   └── utils/           # Fonctions utilitaires
├── prisma/              # Configuration et schémas Prisma
├── public/              # Fichiers statiques publics
├── scripts/             # Scripts utilitaires
└── config/              # Fichiers de configuration
    ├── next.config.js   # Configuration Next.js
    ├── tailwind.config.js # Configuration Tailwind CSS
    └── tsconfig.json    # Configuration TypeScript
```

## Description des Composants Clés

### `/src`
- **app/**: Configuration principale de l'application
- **components/**: Composants React réutilisables
  - Formulaires (AddWeaponForm, EditWeaponForm)
  - Navigation (Navbar)
  - Tableaux (WeaponsTable)
  - Gestion (EmployeeManager, FeedbackManager)
  - UI Components (Button, Dialog, etc.)
- **context/**: Contextes React pour la gestion d'état globale
- **hooks/**: Hooks personnalisés pour la logique réutilisable
- **services/**: Services d'API et intégrations externes
- **utils/**: Fonctions utilitaires et helpers

### `/prisma`
- Schémas de base de données
- Configurations de migration
- Client Prisma généré

### `/public`
- Images et icônes
- Fichiers statiques
- Ressources accessibles publiquement

## Conventions de Nommage

- **Composants**: PascalCase (ex: WeaponsTable.tsx)
- **Hooks**: camelCase avec préfixe "use" (ex: useAuth.ts)
- **Utilitaires**: camelCase (ex: formatDate.ts)
- **Styles**: kebab-case (ex: button-styles.css)

## Notes sur l'Architecture

- Architecture basée sur Next.js avec TypeScript
- Utilisation de Tailwind CSS pour le styling
- Prisma comme ORM pour la base de données
- Gestion d'état avec Redux et Context API
- Animations avec Framer Motion 