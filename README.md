# Clash IQ 2.0

Clash IQ är ett responsivt ledningsverktyg för Clash of Clans. Appen samlar klanöversikt, livekrig, krigsplanering, spelarstatistik, Capital Raids och AI-stöd i ett gemensamt gränssnitt.

## Funktioner

- Klanöversikt och medlemslista från Clash of Clans API
- War Center och War Planner med sparade tilldelningar
- Serverlagrat krigsarkiv och spelarhistorik
- AI Coach och AI-baserad krigsplanering
- Statistik, Capital Raids och spelar-/byvyer
- Webbapp samt Capacitor-skal för Android

## Teknik

- **Frontend:** React 19, Vite, Tailwind CSS, TanStack Query och Wouter
- **Backend:** Express 5, TypeScript och Pino
- **Databas:** PostgreSQL, Drizzle ORM
- **API-kontrakt:** OpenAPI, Orval och Zod
- **Monorepo:** pnpm workspaces

Den körbara koden finns främst i:

- `artifacts/mecka-clash-dashboard` – webbappen
- `artifacts/api-server` – API och statisk leverans av den byggda webbappen
- `lib/api-spec` – OpenAPI-kontraktet
- `lib/db` – databasschema och anslutning
- `android-app` – Android-skalet

## Kom igång

### Krav

- Node.js 22 eller senare
- pnpm 9
- PostgreSQL
- En server-side Clash API-token

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
cp .env.example .env
```

Fyll minst i:

```dotenv
DATABASE_URL=postgresql://...
CLASH_API_TOKEN=...
CLASH_CLAN_TAG=#2Q0Q82C9R
```

> Applikationen läser miljövariabler från processen. Exportera `.env` i ditt skal eller konfigurera dem i din driftplattform.

### Produktionslik körning

```bash
pnpm run build
PORT=5000 pnpm start
```

`pnpm start` synkroniserar databasschemat och startar API-servern. Servern levererar även den byggda webbappen.

### Lokal utveckling

Starta API och frontend i var sitt skal:

```bash
# Skal 1
PORT=5000 pnpm --filter @workspace/api-server run dev

# Skal 2
PORT=5173 pnpm --filter @workspace/mecka-clash-dashboard run dev
```

Vite proxar `/api` till `http://127.0.0.1:5000`. Sätt `API_PROXY_TARGET` om API:t körs på en annan adress.

## Kvalitetskontroller

```bash
pnpm run typecheck
pnpm run build
```

CI kör typkontroll vid push och pull request.

## Viktiga miljövariabler

| Variabel | Syfte |
| --- | --- |
| `DATABASE_URL` | PostgreSQL-anslutning |
| `CLASH_API_TOKEN` | Officiell Clash of Clans API-token, endast server-side |
| `CLASH_CLAN_TAG` | Standardklan |
| `CLASH_API_BASE_URL` | Valfri alternativ Clash API-bas |
| `CLASHKING_API_BASE_URL` | Valfri ClashKing-bas |
| `GEMINI_API_KEY` | AI Coach |
| `OPENAI_API_KEY` | AI War Planner |
| `OPENAI_WAR_MODEL` | Valfri modell för AI War Planner |
| `MECKA_API_KEY` | Delad nyckel för den skyddade coach-rutten |
| `ALLOWED_ORIGINS` | Kommaseparerade extra tillåtna webborigins |
| `API_RATE_PER_MINUTE` | Generell API-gräns per IP |
| `AI_RATE_PER_MINUTE` | AI-gräns per IP och minut |
| `AI_RATE_PER_DAY` | AI-gräns per IP och dag |
| `AI_DAILY_LIMIT` | Global daglig AI-budget |

## Säkerhet och drift

- Hemliga API-nycklar ska aldrig skickas till frontend.
- Skriv- och AI-rutter har same-origin-kontroll och rate limiting.
- Clash-tokens kan vara IP-begränsade; värdplattformens utgående IP måste då tillåtas.
- Hälsokontroll finns på `/api/healthz`.

## Utvecklingsplan

Se [`docs/UTVECKLINGSPLAN.md`](docs/UTVECKLINGSPLAN.md) för teknisk nulägesbild, prioriteringar och rekommenderade nästa steg.
