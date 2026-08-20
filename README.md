# ClassiNote

Plateforme SaaS de gestion scolaire multi-tenant et multi-rôle pour pays francophones (FCFA).

## Rôles

| Rôle | Description |
|------|-------------|
| **Superadmin** | Gère les écoles, admins, providers IA, logs d'activité |
| **Admin** | Gère profs, élèves, classes, évaluations, notes, frais, abonnements, emploi du temps, annonces, messagerie |
| **Prof** | Saisie de notes (OCR IA), évaluations, présences, remarques, messagerie |
| **Parent** | Consulte notes, emplois du temps, paiements, annonces, messagerie |

## Stack technique

- **Backend** : Laravel 12 / PHP 8.2+ / Sanctum
- **Frontend** : 3 SPA React/TypeScript (admin, prof, parent) — Vite 7 + Tailwind CSS v4
- **Base de données** : MySQL (prod) / SQLite (dev/test)
- **IA** : Google Gemini (OCR notes, résumés, annonces)
- **Notifications push** : Firebase Cloud Messaging
- **PWA** : Service workers, manifest.json

## Installation

### Prérequis

- PHP 8.2+
- Composer
- Node.js 20+
- MySQL 8+ ou SQLite

### Setup rapide

```bash
composer setup
```

Cela exécute automatiquement :
- `composer install`
- `npm install`
- `cp .env.example .env`
- `php artisan key:generate`
- `php artisan migrate --seed`
- `npm run build`

### Configuration manuelle

1. Copier `.env.example` vers `.env` et configurer :
   - `DB_*` (MySQL ou SQLite)
   - `GEMINI_API_KEY` (Google AI Studio)
   - `FIREBASE_*` (push notifications)

2. Lancer le serveur :
```bash
composer dev
```

3. URLs d'accès :
   - Admin : `http://localhost:8000/app/admin`
   - Prof : `http://localhost:8000/app/prof`
   - Parent : `http://localhost:8000/app/parent`
   - API : `http://localhost:8000/api/v1/`

## Structure

```
├── app/                    # Backend Laravel
│   ├── Http/Controllers/   # API controllers (8)
│   ├── Models/             # 27 modèles Eloquent
│   ├── Services/           # PushNotification, CodeGenerator, SchoolImport
│   └── Traits/             # LogsActivity
├── design/                 # Source React (3 SPAs)
│   ├── classinote-admin/   # App admin (31 composants)
│   ├── classinote-prof/    # App prof (14 écrans)
│   └── classinote-parent/  # App parent (9 écrans + 11 composants)
├── public/app/             # Frontends buildés
├── database/migrations/    # 49 migrations
├── routes/                 # api.php + web.php
├── tests/                  # Tests unitaires et feature
├── docker-compose.yml      # Environnement Docker
├── Dockerfile              # Image PHP/Nginx
└── nginx.conf              # Configuration Nginx
```

## API

Toutes les routes sont préfixées par `/api/v1/`.

### Authentification

| Route | Méthode | Description |
|-------|---------|-------------|
| `/auth/superadmin/login` | POST | Login superadmin (email/password) |
| `/auth/admin/login` | POST | Login admin (email/password) |
| `/auth/code/verify` | POST | Vérification code (prof/parent/élève) |
| `/auth/pin/login` | POST | Login PIN (prof/parent/élève) |
| `/auth/pin/setup` | POST | Configuration PIN initiale |
| `/auth/magic/activate` | POST | Activation lien magique |

### Tests

```bash
php artisan test
```

## Docker

```bash
docker-compose up -d
docker-compose exec app php artisan migrate --seed
```

## Licence

Propriétaire — ClassiNote
