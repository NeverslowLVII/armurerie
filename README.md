# Armurerie - Gestion de l'inventaire d'armes

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Déploiement

Avant de déployer le projet, exécutez le script de vérification pré-déploiement:

```bash
npm run pre-deploy:check
```

### Gestion des problèmes courants du pré-déploiement

#### Erreurs Knip (détection de code mort)

Si vous rencontrez des problèmes avec Knip, vous pouvez ignorer cette vérification:

```bash
npm run pre-deploy:check -- --skip-knip
```

#### Avertissements Next.js sur les routes dynamiques

Si vous voyez des avertissements concernant les routes API qui utilisent `headers`, il s'agit d'un comportement normal pour les routes qui nécessitent l'accès aux en-têtes de requête. Ces routes sont:

- `/api/employee/info`
- `/api/employee/weekly-sales`

Ces avertissements n'empêchent pas le déploiement et peuvent être ignorés.
