## Návrh implementace email notifikací a finalizace aukcí

Cíl: doplnit end-to-end notifikace (e-mail vítězi a adminovi) po finalizaci aukce, zajistit dry-run, testy a minimální infra.

Prioritní body (rychle k nasazení):

1) Backend: EmailService integrace
	- Co: Zajistit, že `EmailService` má jasné rozhraní `SendWinnerNotification(SoldItem, AuctionReport)` a `SendAdminNotification(AuctionReport)`.
	- Kde: `EvidenAuctionHouseAPI/Services/EmailService.cs` (ověřit existenci) / případně `Services/NotificationService.cs`.
	- Co doplnit:
	  - Konfigurace SMTP (env vars): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_ADDRESS.
	  - Implementace odeslání přes System.Net.Mail.SmtpClient nebo MailKit (MailKit doporučeno).
	  - Logování a retry (jednoduché: 3 pokusy s exponenciálním backoff).

2) Backend: Volání e-mailu po finalizaci
	- Co: Po úspěšném `GenerateAndPersistReport` zavolat `EmailService` pro každou prodanou položku (vítěz) a pro admina celkovou zprávu.
	- Kde: `EvidenAuctionHouseAPI/Services/AuctionFinalizationWorker.cs` (v místě kde se volá `db.Reports.Add` / nebo hned po úspěšném dokončení, ale pouze pokud dryRun == false).
	- Pozor: emaily se odesílají jen pokud `dryRun == false`.

3) Frontend: Admin UI pro test + opt-in
	- Co: Přidat v Admin sekci možnost "Send notifications on finalize" a tlačítko "Send test notification".
	- Kde: `EvidenAuctionHouse/src/app/pages/admin` nebo `admin.service.ts`.
	- API: nová endpointa `POST /api/Admin/send-test-email` nebo `POST /api/Auctions/finalize/{id}?notify=true` (notify přepne chování finalizace)

4) Konfigurace a secrets
	- Co: Uložit SMTP konfiguraci do ENV (pro Docker -> docker-compose.yml secrets nebo environment).
	- Kde: `EvidenAuctionHouseAPI/Program.cs` při registraci `EmailService` číst env a předat do konstruktoru.

5) Tests
	- Unit tests:
	  - Mock EmailService a ověřit, že `AuctionFinalizationWorker.GenerateAndPersistReport(..., dryRun:false)` volá EmailService správně.
	  - Test dry-run: ensure EmailService not called when dryRun=true.
	- Integration test (optional): spustit lokální SMTP test server (MailHog/SMTP4DEV) a spustit finalize -> ověřit doručení.

6) Scripts / backfill
	- Po backfillu (např. `scripts/backfill-winner-emails.js`) poslat notifikace historickým vítězům opatrně — přidat `--sendEmails` flag a admin confirmation.

7) Operational notes
	- Retry a dead-letter: pokud odeslání selže, zaznamenat chybu do logu a/nebo do `Reports`/`Notifications` datasetu pro pozdější retry.
	- Monitoring: přidat jednoduché metriky/logy při odesílání (success/fail counts).

Konkrétní změny v repo (souborové diffy které jsem doporučoval):

- `EvidenAuctionHouseAPI/Services/EmailService.cs` (nový nebo doplnit) — implementace MailKit a konfigurace z env
- `EvidenAuctionHouseAPI/Services/AuctionFinalizationWorker.cs` — po persist zavolat EmailService (only when dryRun==false)
- `EvidenAuctionHouseAPI/Controllers/AuctionsController.cs` — možnost `?notify=true` na finalize endpointě (optional, default false)
- `EvidenAuctionHouseAPI.Tests/*` — nové unit testy mocking EmailService (dry-run and notify flow)
- `docker-compose.yml` — přidat volitelný MailHog službu pro vývoj/test

Priority checklist (do navrhu):
- [ ] Add `EmailService` using MailKit and env-configured SMTP
- [ ] Integrate EmailService calls into `AuctionFinalizationWorker` (post-persist, dryRun guard)
- [ ] Add API flag `notify` to finalize endpoint and admin UI to toggle
- [ ] Add unit tests that mock EmailService for success/failure and dry-run
- [ ] Add dev SMTP (MailHog) to `docker-compose.yml` and doc in README
- [ ] Add retry & logging for failed sends

Krátké poznámky k bezpečnosti a GDPR
- Emaily obsahují citlivé údaje (email vítěze, co vyhrál) — posílat jen pro potvrzené adminy a pouze po finalizaci.
- V produkci zkontrolovat opt-out a frequency: nezasílat duplicitně.

Jak dál (navrhuju další krok)
- Pokud chceš, udělám první commit: přidám `EmailService` (MailKit), upravím `AuctionFinalizationWorker` k volání služby a přidám unit test (mock) pro dry-run vs real send. Odhad práce: ~2–3 hodiny lokálně.

---

Autor návrhu: automatický návrh generovaný na základě kódu v repo
