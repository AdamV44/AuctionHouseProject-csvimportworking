# Návrh: Automatické ukončení aukcí

Stručné shrnutí
- Cíl: bezpečně a opakovaně automatizovat ukončení aukcí, vytvořit SoldItems a persistovat reporty. Podporovat dry-run, idempotenci, audit a admin-manual run.
- Tento dokument obsahuje konkrétní kroky implementace, konfiguraci, API, testy a plán nasazení.

Požadavky (checklist) — zjednodušená studentská verze
- [ ] Jednoduchý scheduler/hosted service (volitelně disabled by default)
- [ ] Idempotentní core finalizace (FinalizeAuction)
- [ ] Per-auction lock (jednoduchý in-memory lock, později file/DB pokud potřeba)
- [ ] Dry-run flag a jednoduché logování (metriky/alerty odložit)
- [ ] Admin API pro manuální spuštění
- [ ] Unit testy pro rozhodování vítěze a idempotenci
- [ ] Jednoduchý backfill skript (volá API pro chybějící reporty)

Krátký kontrakt funkce FinalizeAuction
- Vstup: auctionId, options { dryRun: bool, initiatedBy: string|null }
- Výstup: Result { status: "ok" | "no-bids" | "already-finalized" | "error", reportId?, message? }
- Chyby: vždy vrátit popis chyby; v případě částečného selhání rollback nebo leave-safe stav a logovat.

Architektura a komponenty
1) AuctionFinalizationService (core)
   - Metody: FinalizeAuction(auctionId, options), GenerateReport(auction), PersistReport(report)
   - Odpovědnost: rozhodnout vítěze (nejvyšší bid, tie-breaker = poslední bid), vytvořit SoldItems, naplnit AuctionReport (včetně pseudonym mapy pokud nutné).
   - Musí být idempotentní: při zjištění existujícího reportu vrátit status `already-finalized`.

2) AuctionFinalizerHostedService (scheduler)
   - Periodicky kontroluje aukce s endDate <= now a state != "skončená".
   - Volá AuctionFinalizationService.FinalizeAuction.
   - Konfigurace: enabled, intervalSeconds, dryRun, maxParallelFinalizations.

3) Locking (jednoduché a praktické)
   - Pro studentský projekt doporučuju jednoduchý in-memory lock (ConcurrentDictionary nebo lock per auctionId).
   - Výhoda: rychle implementovatelné a bezpečné pro single-instance Docker/dev prostředí (což odpovídá zadání interní sítě).
   - Pokud se později bude nasazovat více instancí, lze přidat file/DB lock nebo Redis lock jako upgrade.

4) API
   - POST /api/Auctions/finalize/{auctionId}?dryRun={bool}
     - Manuální finalizace; secured (Admin). Vrací Result DTO.
   - GET /api/AuctionFinalizer/status
     - Vrací stav scheduleru: { enabled, lastRunAt, runningCount, dryRun }
   - POST /api/AuctionFinalizer/run
     - Spustí jednorázový běh (admin). Podporuje { dryRun }.

Data model a persistence
- SoldItems a Reports: persistovat do `Database/SoldItems/assets.json` a `Database/Reports/assets.json` přes existující DataSet<T> vrstvy.
- Auction state: přidat/aktualizovat pole `State` (např. `active|skončená`) ve zdrojové aukci; změnit atomicky při persistování reportu.
- PseudonymMap: pokud již není v reportech, uložit per-report mapu (UserId -> P1/P2...).

Sekvenční tok (zjednodušeně)
1) Scheduler nebo API call najde aukci k finalizaci
2) Acquire lock for auctionId
3) Check if report already exists -> if yes, release lock and return `already-finalized`
4) Collect bids, determine winner (tie -> last bid wins) -> build reportDTO + soldItems
5) If dryRun: log result and return (no persist)
6) Persist SoldItems and Report atomically (write files via DataSet<T>)
7) Update auction state to `skončená`
8) Release lock
9) Trigger EmailService (async) to notify winner + admin

Konfigurační příklad (Database/config.yml)
```yaml
AuctionControl:
  enabled: false      # default vypnuto
  intervalSeconds: 60 # jak často scheduler běží
  dryRun: true        # pokud true, neprovádí persist
  maxParallelFinalizations: 2
  lockTTLSeconds: 300
```

Idempotence a bezpečnost (jednoduše)
- FinalizeAuction: vždy zkontrolovat existenci reportu; pokud existuje, vrátit `already-finalized`.
- Při zápisu použít jednoduchý pattern: zapis do temp souboru a přejmenuj (atomic move) — to je dostatečné pro tento projekt.
- Manuální endpoint zabezpečit [SecuredAdmin] a logovat `initiatedBy`.

Concurrency a recovery
- Lock + TTL: pokud worker padne se zadrženým lockem, po TTL lock propadne a další worker může převzít finalizaci.
- Optimistický přístup: po získání locku znovu ověřit, že aukce stále není finalizovaná.
- Při částečném selhání persistence: zaznamenat chybu a neoznačovat aukci jako `skončená` (možnost retry).

Testovací plán
1) Unit tests
   - Vyhodnocení vítěze: no bids, single bid, multiple bids, tie-breaking (last wins).
   - Idempotence: volání FinalizeAuction dvakrát -> druhé vrátí already-finalized.
2) Integration tests
   - Spustit hosted service against test DB (in-memory nebo test folder), vytvořit aukci s endDate v minulosti -> assert SoldItems + Report created.
   - Concurrency test: spustit N paralelních volání finalizace stejné aukce -> assert 1 persisted result.
3) Smoke tests
   - Dry-run: scheduler with dryRun=true produces logs but nezmění DB.

Logování a jednoduché monitorování
- Logovat pokusy finalizace (auctionId, result, initiatedBy, error). To stačí pro začátek.
- Metriky/alerty přidat později podle potřeby.

Backfill / migrace (jednoduše)
- Napsat skript `scripts/finalize-missing.js` který zavolá `POST /api/Auctions/finalize/{id}?dryRun=true` pro aukce bez reportu. Po ověření přepnout dryRun=false.

Rollout doporučení (jednoduše)
- Start v dev s `dryRun: true` a `enabled: false` → analyzovat logy.
- Poté povolit scheduler v dryRun režimu a ručně spouštět pro kontrolu.
- Nakonec povolit persist během údržby.

Rollout plán
1) Implementovat a spustit v dev/test s `dryRun: true` (1 den)
2) Analýza logů, fixy
3) Zapnout `enabled: true` s `dryRun: true` a ruční spuštění pro kontrolu
4) Zapnout persist (dryRun=false) mimo špičku

Odhad práce
- Dokument (tento soubor): 30–60 min
- Core finalizace + unit tests + lock: 1–2 dny
- Hosted service + config + integration tests: 0.5–1 den
- Admin UI + API + rollout: 0.5–1 den
- Celkem (end-to-end, s testy): ~3–5 pracovních dnů

První krok (malý, ihned implementovatelný)
1) Implementovat `FinalizeAuction(auctionId, options)` v `AuctionFinalizationService` (core logic, idempotentně).
2) Použít jednoduchý in-memory per-auction lock a přidat unit testy (vyhodnocení vítěze + idempotence).
3) Přidat POST `/api/Auctions/finalize/{auctionId}?dryRun={bool}` (secured admin) a malý skript `scripts/finalize-missing.js`.

Další kroky
- Po schválení dokumentu mohu vytvořit PR obsahující první krok (config + lock) a přidat unit testy. Poté pokračovat malými PRy pro finalizer core, hosted service a UI.

Kontakt a poznámky
- Pokud chcete, vytvořím navazující issues/PRs s malými kroky a časovými odhady.

Konec návrhu
