# Clash IQ – utvecklingsplan

Senast uppdaterad: 2026-09-26

## Nuläge

Clash IQ har redan ett starkt funktionsdjup: liveöversikt, War Center, War Planner, krigsarkiv, spelarvyer, Capital Raids och två AI-flöden. Den största möjligheten ligger nu mindre i att lägga till fler fristående sidor och mer i att göra datan konsekvent, appen snabbare och användarflödena tydligare.

## Genomfört i denna optimeringsrunda

### Stabilitet

- Återställde den avkortade Clash API-routern som blockerade typkontroll, bygg och serverstart.
- Återställde saknade funktioner för spelarens krigshistorik.
- Rättade TypeScript-fel i AI-svar, War Planner och spelar-dialogen.
- Hela monorepot klarar nu både `pnpm run typecheck` och `pnpm run build`.

### Prestanda

- Klandata återanvänds i 30 sekunder i TanStack Query, så sidbyten inte startar samma dyra fler-API-anrop igen.
- Dashboard-svaret får en kort privat HTTP-cache.
- Historisk återläsning slås ihop mellan samtidiga anrop och återanvänds i 15 minuter.
- Historiska detaljanrop körs med begränsad parallellism i stället för helt seriellt.
- Spelarhistorik hämtar endast nödvändiga databaskolumner och har en begränsad resultatstorlek.
- Vite proxar relativa `/api`-anrop till lokal backend, vilket förenklar utveckling och fjärrpreview.

### Datakvalitet

- Försvarsstatistik läses nu från motståndarens attacker i stället för den egna sidans attacker.
- Både `townhallLevel` och `townHallLevel` hanteras i historiska data.
- `CLASH_CLAN_TAG` används nu som konfigurerbar standardklan i stället för enbart hårdkodad tagg.

### Kommunikation och dokumentation

- README beskriver produkt, arkitektur, lokal start, drift, miljövariabler och kvalitetskontroller.

## Rekommenderad prioritering

## P0 – gör innan bredare lansering

### 1. En enda källa för aktiv klan

Aktiv klan sparas i dag i en global databasrad. Om flera användare söker efter olika klaner kan de påverka varandras efterföljande vyer.

**Förslag:** lagra vald klan per klient eller användare och skicka alltid `clanTag` i relevanta anrop. Backend bör aldrig ändra en global aktiv klan som bieffekt av en vanlig GET-förfrågan.

**Effekt:** korrekt multi-user-beteende och färre svårförklarliga databyten.

### 2. Skarpa API-kontrakt

OpenAPI-modellen använder fortfarande många `additionalProperties: true`, vilket tvingar frontend till `Record<string, unknown>` och manuella konverteringar.

**Förslag:** modellera clan, member, war, attack och raid season explicit. Generera sedan typer och validering från kontraktet.

**Effekt:** färre runtime-fel, enklare refaktorering och betydligt bättre utvecklarhastighet.

### 3. Testa de mest affärskritiska beräkningarna

Det saknas automatiserade tester för exempelvis krigsutfall, trendberäkning, återstående attacker, orientering av klansidor och spelarhistorik.

**Förslag:** börja med rena enhetstester för normalisering och beräkningar, följt av API-integrationstester med fixture-data.

**Effekt:** säkrare releaser och mindre risk för felaktiga rekommendationer.

### 4. Autentisering för ledarfunktioner

Same-origin och rate limiting skyddar mot vanliga browsermissbruk, men ersätter inte behörighetskontroll. Skrivningar och betalda AI-anrop kan fortfarande göras av en direkt klient.

**Förslag:** inför inloggning och roller, exempelvis leader/co-leader/member. Kräv behörighet för låsning, tilldelning, arkivimport och AI-budget.

**Effekt:** appen kan delas bredare utan att ledarfunktioner eller AI-kostnader exponeras.

## P1 – nästa produktiteration

### 5. Gör Settings verklig

Inställningssidan visar reglage och systemstatus men värdena är för närvarande lokala UI-tillstånd och statuskorten är statiska.

**Förslag:**

- spara användarpreferenser lokalt eller per konto,
- koppla automatisk uppdatering till Query Client,
- visa verklig API-/databas-/AI-status,
- ta bort inställningar som ännu inte har någon effekt.

### 6. Enhetligt språk

Gränssnittet blandar svenska och engelska.

**Förslag:** välj primärt språk och inför en liten översättningsmodell (`sv`/`en`) innan fler texter byggs in direkt i komponenterna.

### 7. War Planner som arbetsflöde

Gör vyn mer handlingsorienterad:

1. visa ej attackerade och ej trestjärnade mål,
2. visa spelare med attacker kvar,
3. varna för dubbla mål,
4. ge en tydlig lås-/publiceringsstatus,
5. skapa ett delbart meddelande för klanchatten.

### 8. Mät verklig nytta

Lägg till integritetsvänliga produktmått:

- tid till färdig krigsplan,
- andel tilldelade attacker som slutförs,
- användning per vy,
- fel- och latensnivå per extern datakälla,
- AI-svarstid och kostnad per funktion.

## P2 – efter stabilisering

### 9. Bakgrundssynk för krigsarkiv

Historik byggs i dag främst när användare öppnar appen.

**Förslag:** kör ett schemalagt jobb som hämtar aktivt krig och slutförda krig, med distribuerat lås och idempotenta upserts.

### 10. PWA och offline-läge

Cachelagra appskal och senaste läsbara dashboarddata. Visa tydligt när data är offline och när den senast synkroniserades. Skrivningar ska köas försiktigt eller blockeras offline.

### 11. Konsolidera källträdet

Projektet innehåller parallella rotkopior och körbara workspace-kopior under `artifacts/`. Det gör det lätt att ändra en fil som inte byggs eller driftsätts.

**Förslag:** välj en kanonisk katalog per app, migrera användbara skillnader och ta sedan bort eller arkivera dubbletterna.

### 12. Dela stora komponenter

`war-planner.tsx` och `dashboard.tsx` är stora och innehåller datamappning, beräkningar och presentation i samma fil.

**Förslag:** dela upp i domänhooks, rena beräkningsfunktioner och mindre vykomponenter. Prioritera kod som kan enhetstestas utan React.

## Föreslagen 30/60/90-dagarsplan

### 0–30 dagar

- Lös aktiv klan per klient/användare.
- Lägg tester runt war state, player history och planner-beräkningar.
- Gör Settings och systemstatus sanningsenliga.
- Standardisera felmeddelanden och språk.

### 31–60 dagar

- Inför autentisering och roller.
- Skärp OpenAPI-kontraktet och regenerera klienten.
- Lägg till bakgrundssynk och observability för externa API:er.
- Dela upp War Planner i testbara moduler.

### 61–90 dagar

- Inför PWA/offline-läsning.
- Lägg till produktmått och ledningssammanfattning.
- Konsolidera dubbletter i källträdet.
- Utvärdera signerad Android-release/AAB och Play Store-flöde.

## Rekommenderade framgångsmått

- Dashboard p95 under 2 sekunder med varm cache.
- Färre än 1 % misslyckade interna API-anrop.
- Noll globala klanbyten mellan samtidiga användare.
- Minst 80 % av produktionskoden typad utan `any` i domänflöden.
- Kritiska beräkningsflöden täckta av tester.
- AI-kostnad och svarstid synlig per funktion.
