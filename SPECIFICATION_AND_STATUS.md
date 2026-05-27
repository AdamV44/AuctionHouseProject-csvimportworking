# Specifikace projektu - IT Bazar / Aukce zařízení

## 1) Kontext a cíl
Cílem je vytvořit aplikaci pro interní odprodej IT zařízení (např. Notebooky, mobily,...):
- Zařízení nejsou prodávána vlastníkem
- Odprodej organizuje IT / firma
- Prodej probíhá formou otevřené aukce

## 2) Vazba na předchozí projekt
- Navazuje na aplikaci Inventory Assistant
- Využívá: seznam zařízení, atributy (asset, SN, stav)
- Lze řešit jako: samostatná aplikace NEBO rozšíření předchozí

## 3) Specifika
- Běh na interní síti
- Jednoduchý login (interní keycloak / OIDC / openLDAP / AD)
- Docker provoz
- Důraz na: přehlednost, jednoduchost

---

## 4) Požadované funkce aplikace

### 4.1 Import zařízení pro prodej
**Zdroj:**
- Excel / inventarizační data (CSV/JSON export)
- Otagování zařízení k prodeji -> export do aukce

**Zařízení obsahuje:**
- Název
- SN / inventární číslo
- Popis
- Stav (OK / použitý / vadný)
- Fotografie (volitelně)
- Minimální cena
- Maximální cena pro příhozy / automat (volitelně)

### 4.2 Vytvoření aukce
Admin vytvoří aukci:
- Název (např. „Aukce notebooků 05/2026")
- Období:
  - Od (fixně: následující pracovní den 9:00?)
  - Do (fixně na 15:00 pracovního dne)
- Přiřadí zařízení

### 4.3 Aukční mechanismus
**Každé zařízení má:**
- Vyvolávací cenu / minimální cenu
- Aktuální cenu
- Historii příhozů

**Uživatel:**
- Seznámí se s pravidly aukce (první přihlášení = odsouhlasení + uložení souhlasu)
- Vidí seznam zařízení
- Může přihazovat (bid) + potvrzení úmyslu (eliminace překliku)

**Pravidla:**
- Nový příhoz musí být vyšší než aktuální cena
- Zobrazit: aktuální vítěz (!!! max iniciála křestního jména – GDPR)
- Zobrazit: historii příhozů, anonymizovaně

### 4.4 Přehled zařízení
**Seznam zařízení:**
- Název / typ
- Aktuální cena
- Termín aukce do

**Detail zařízení:**
- Název / typ
- Detail / popis
- Fotka
- Aktuální cena
- Čas do konce aukce
- Historie příhozů (GDPR)
- Aktuální vítěz (GDPR)

### 4.5 Ukončení aukce
Po konci:
- Systém určí vítěze
- Zašle notifikaci vítězi (příprava na smlouvu o odkupu / smlouva o odkupu, digitální podpis)
- Zašle notifikaci administrátorovi s stavem:
  - **Prodané:** cena, dokumentace, smlouva
  - **Neprodané:** nové zveřejnění, úprava ceny

### 4.6 Správa uživatelů
**Role:**
- **Admin:** vytváří aukce, spravuje zařízení (import)
- **Uživatel:** potvrzení povinností / souhlasu s pravidly, přihazování

### 4.7 Reporty
**Minimálně:**
- Seznam prodaných zařízení
- Kdo vyhrál co
- Souhrn: výnos, počet zařízení

Aktuální implementace (souhrn):
- `GET /api/Auctions/report/{auctionId}`: returns persisted report if present; otherwise generates the report on-the-fly and persists `SoldItems` + `Reports`.
- `POST /api/Auctions/finalize/{auctionId}`: admin endpoint that triggers generation/persistence (already implemented and secured with admin role).
- Persisted models: `Reports` and `SoldItems` are stored under `Database/Reports/assets.json` and `Database/SoldItems/assets.json`.
- Finalizer services:
   - `AuctionFinalizationService` (helper) implements report generation + persistence and now uses a short-lived in-memory per-auction lock to avoid same-process concurrent finalization.
   - `AuctionFinalizerService` (hosted background service) exists and can automatically finalize auctions according to `Database/config.yml` (default: disabled).
- GDPR & sensitive data:
   - Per-report `PseudonymMap` is generated and persisted along with the report (so anonymized public views can show stable pseudonyms P1/P2 ...).
   - `GET /api/Auctions/report/{auctionId}` accepts `includeSensitive` query and will include unmasked winner info and the `PseudonymMap` only when admin requests sensitive data; the API gate also respects the YAML GDPR flag.
   - Frontend: report page has an admin-only toggle wired to request sensitive data from the API.
- Concurrency & safety: simple in-memory per-auction lock implemented in `AuctionFinalizationService` to avoid races in-process; distributed lock not implemented.
- Tests & scripts:
   - A new xUnit test project `EvidenAuctionHouseAPI.Tests` exists and contains unit tests for the finalizer (winner selection + idempotence). These tests build and run locally.
   - Script `scripts/finalize-missing.js` added to help finalize auctions without reports (supports dry-run and uses admin JWT). A backfill script for winner emails exists as noted in changelog.

---

## 5) Refactoring aspekt
Projekt by měl obsahovat:
- Úpravy architektury
- Zlepšení: struktury kódu, práce s daty, UI
- Možnosti: oddělení frontend/backend, lepší datový model, reuse z předchozí aplikace

## 6) Technologie
- Povinné: Docker, běh jako webová aplikace
- Volné: libovolný frontend (JS / React), backend dle volby

---

## 7) Milníky

### Týden 1:
- [ ] Seznam zařízení
- [ ] Detail zařízení
- [ ] Jednoduché přihazování
- [ ] Ukládání dat
- [ ] Docker

### Týden 2:
- [ ] Aukce (od–do)
- [ ] Vítěz aukce
- [ ] Přehledy
- [ ] Role

### Bonus:
- [ ] Fotografie zařízení
- [ ] Filtrování / vyhledávání
- [ ] Notifikace (např. přehozen)
- [ ] Export výsledků

---

## 8) Výstupy
- [ ] Git repo
- [ ] docker-compose
- [ ] README
- [ ] Demo data
- [ ] Krátké demo

## 9) Doporučení (praktické – důležité)
**Typické chyby:**
- Složitá logika aukce
- Race conditions (dva příhozy najednou)
- UX (uživatel neví co kliknout)

**Doporučení:**
- Držet jednoduchá pravidla
- Neřešit realtime (polling OK)
- Zaměřit se na funkčnost

---

## ✅ STATUS PROJEKTU vs. SPECIFIKACE (aktuální)

### ✅ Jasně implementováno (k dispozici v repo):
1. ✅ Frontend (Angular) - Standalone komponenty, modulární struktura (ve `EvidenAuctionHouse/src`)
2. ✅ Backend (ASP.NET Core) - RESTful API s kontrolery (ve `EvidenAuctionHouseAPI/Controllers`)
3. ✅ Databáze - JSON file-backed DataSet implementation (see `dbLoader/Collections/DataSet.cs` and `Database/` folder)
4. ✅ Docker - `docker-compose.yml` and Dockerfiles present
5. ✅ Authentication core - `TokensService`, `AuthenticationController` and frontend `AuthenticationService` (basic JWT flows)
6. ✅ User management - `UsersController`, user models, admin flag/role handling
7. ✅ Auction management - `AuctionsController` (create/edit/delete auctions)
8. ✅ Auction items - `AuctionItemsController` and frontend item pages
9. ✅ Bidding - `BidsController` + frontend bidding UI and `price-input` component
10. ✅ Confirmation dialogs - confirmation-dialog components used across UI
11. ✅ Item listing & detail pages - items list + item detail pages with images
12. ✅ Image upload/serving - `AuctionItemsPicturesController` + images folder
13. ✅ CSV import & preview - frontend CSV import page and upload handling
14. ✅ Reports persistence - `Reports` + `SoldItems` datasets and on-disk assets
15. ✅ Finalize endpoint - `POST /api/Auctions/finalize/{auctionId}` (admin-secured)
16. ✅ Finalizer helper & hosted service - `AuctionFinalizationService` and `AuctionFinalizerService` (scheduler)
17. ✅ Per-report pseudonym map persisted and exposed in DTOs (admin-sensitive pathway)
18. ✅ In-memory per-auction lock in `AuctionFinalizationService` to avoid same-process races
19. ✅ Unit tests for finalizer - `EvidenAuctionHouseAPI.Tests` contains winner-selection/idempotence tests (tests run locally)
20. ✅ Utility scripts - `scripts/finalize-missing.js` (dry-run support) and backfill script for winner emails (noted in changelog)
21. ✅ Email sending service - `IEmailService` / `EmailService` (MailKit) present and configured via env
22. ✅ Finalizer -> email notifications wired: finalizer queues and sends winner/admin emails (best-effort, dev-tested with MailHog)
23. ✅ Dev helpers: `DevController` token endpoint and impersonate helper exist for local testing
24. ✅ Auth improvements: refresh-token persistence service added and `AuthenticationController` supports refresh/logout; CORS tightened and AllowCredentials enabled for SPA dev

### ✓ Částečně implementováno (funguje částečně / needs polish):
1. ✓ GDPR protection — backend: per-report `PseudonymMap`, admin-only sensitive export flag and API gating implemented; frontend: report page admin toggle exists. UI-wide anonymization (history list anonymized in all views) still needs finishing and consistent UI masking.
2. ✓ Auction rules validation — basic bid validation exists (amount checks); full rule enforcement (min/max, anti-sniping, explicit consent + UI persistence) requires more tests and UI work.
3. ✓ Hosted finalizer — implemented and configurable, but disabled by default and needs integration testing and operational tuning.

### ❌ Chybí / není kompletně implementováno (pozor):
1. ❌ First-login rules acceptance modal + persistence (required by spec) — not implemented.
2. ❌ Dry-run flag on finalize controller (server-side) — finalizer supports dryRun internally, but controller endpoint should expose/obey `?dryRun=true` consistently (controller TODO).
3. ❌ Contract/sales paperwork flows + digital signing — not implemented.
4. ❌ Advanced filtering / search UI for items — missing.
5. ❌ LDAP/OIDC integration (Keycloak/AD) — not implemented (only simple JWT tokens for local testing).
6. ❌ Distributed locking (for multi-instance deployments) — only in-memory locks exist; consider Redis or DB locks for production.

### Poznámky k nasazení a dev tooling
- Mail dev: `docs/email-notifications.md` + `docker-compose.yml` contains a `mailhog` dev service and `api` service wiring for local testing.
- Email sending is currently best-effort and synchronous; consider background queue + retry for production.


---

## 🎯 Prioritní úkoly k dokončení:

### Vysoká priorita (nutné pro fungování):
1. **GDPR ochrana** - Anonymizace dat v UI
   - Zobrazovat jen iniciálu jména u vítěze
   - Anonymizovat historii příhozů
   
2. **Pravidla aukce** - Odsouhlasení pravidel
   - Modal při prvním přihlášení
   - Uložení souhlasu v databázi
   
3. **Automatické ukončení aukcí** - Backend logika
   - Scheduler pro kontrolu času aukcí
   - Automatické nastavení stavu na "skončená"
   
4. **Určení vítěze** - Automatické určení a notifikace
   - Logika pro vyhledání nejvyššího příhozu
   - Odeslání emailu vítězi

### Střední priorita (rozšíření):
5. **Reporty** - Přehled prodaných zařízení a výnosů
6. **Filtrování** - Vyhledávání a filtrování zařízení
7. **Export** - Možnost exportu výsledků do CSV

### Nižší priorita (bonus):
8. **Smlouva o odkupu** - Digitální podpis
9. **LDAP/OIDC login** - Enterprise integrace
10. **Real-time aktualizace** - WebSocket notifikace

---

**Autor:** Adam Vítek  
**Datum:** 21.5.2026  
**Verze:** 1.0 - Specifikace a analýza stavu projektu  
**Škola:** Smíchovská střední průmyslová škola a gymnázium

## Changelog (recent)

- 22.5.2026: Added winner email to reports and CSV export (backend + frontend). New sold items persisted after finalization will include `WinnerEmail`.
- 22.5.2026: Created backfill script `scripts/backfill-winner-emails.js` to populate `WinnerEmail` for historical entries in `Database/SoldItems/assets.json` from `Database/Users/assets.json`.
- 22.5.2026: Frontend report export (`report-page.component.ts`) already includes `WinnerEmail` column and handles different casings; CSVs exported after the backfill will contain winner emails where available.

