# Email notifikace (dev) — rychlý návod

Tento krátký návod ukáže, jak rychle otestovat odesílání e-mailů lokálně pomocí MailHog (bez externí SMTP) a jak nastavit prostředí pro `EmailService` v tomto projektu.

Cíl: povolit finální notifikace (vítěz, admin) během local development bez změn produkční infrastruktury.

## 1) Co je potřeba
- MailHog (lokální SMTP + web UI) — jednoduché dev řešení.
- Nastavit env proměnné používané `EmailService`:
  - `SMTP_HOST` (např. `127.0.0.1`)
  - `SMTP_PORT` (např. `1025`)
  - `SMTP_USER` (volitelně)
  - `SMTP_PASS` (volitelně)
  - `SMTP_FROM` (např. `no-reply@example.test`)
  - `ADMIN_EMAIL` (kam poslat souhrnnou zprávu po finalizaci)

## 2) Spuštění MailHog (nejrychlejší)
- Docker (rychle):

```bash
# stáhne a spustí MailHog
docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog
# web UI: http://localhost:8025
```

- Nebo použij systémový balíček (smtp4dev na Windows apod.).

## 3) Nastavení prostředí a spuštění API
V projektu API nastav environment proměnné a spusť server (příklad pro macOS / zsh):

```bash
export SMTP_HOST=127.0.0.1
export SMTP_PORT=1025
export SMTP_USER=""
export SMTP_PASS=""
export SMTP_FROM="no-reply@local.test"
export ADMIN_EMAIL="admin@local.test"

# spusť API (pokud už neběží)
dotnet run --project EvidenAuctionHouseAPI/EvidenAuctionHouseAPI.csproj
```

`EmailService` čte tyto proměnné (implementováno pomocí MailKitu) a při odeslání použije `STARTTLS when available`.

## 4) Volání finalize a testování e-mailů
- Možnosti spustit finalizaci:
  - Použít existující administrační endpoint v aplikaci.
  - Pokud nemáš admin UI, použít Dev token endpoint k získání tokenu a pak zavolat finalize.

Příklad (pokud máš DevController token endpoint):

```bash
# 1) získej dev token pro uživatele (nahraď userId)
curl -k "https://127.0.0.1:7054/api/Dev/token/<userId>"
# uloží token z JSON odpovědi

# 2) zavolat finalize endpoint (nahraď {auctionId})
curl -k -X POST "https://127.0.0.1:7054/api/Auctions/finalize/{auctionId}" -H "Authorization: Bearer <token>"
```

Po úspěšné finalizaci by se měly objevit emaily v MailHog web UI: http://localhost:8025

> Poznámka: finalizace posílá vítězné e-maily pouze pokud `dryRun == false` (to je standardní chování v `AuctionFinalizationWorker`).

## 5) Rychlý test bez finalizace (send test email)
Můžeš rychle otestovat samotnou službu pomocí `EmailService.SendEmail` přes jednoduchý curl kód/endpoint nebo spuštěním krátkého C# skriptu, ale nejrychleji je použít DevController (pokud existuje) k vytvoření refresh cookie/token a pak zavolat finalize nad malou testovací aukcí.

## 6) Docker Compose (přidání MailHog) — snippet
Přidej to do svého `docker-compose.yml` za účelem lokálního vývoje (volitelné):

```yaml
mailhog:
  image: mailhog/mailhog:latest
  ports:
    - "1025:1025" # SMTP
    - "8025:8025" # web UI
  restart: unless-stopped
```

Poté v `docker-compose` služby API přidej env proměnné (nebo v `env-file`):

```yaml
environment:
  - SMTP_HOST=mailhog
  - SMTP_PORT=1025
  - SMTP_FROM=no-reply@local.test
  - ADMIN_EMAIL=admin@local.test
```

## 7) Co dělat, když e-maily nechodí
- Ověř, že MailHog naslouchá: `telnet 127.0.0.1 1025` nebo otevři http://localhost:8025
- Zkontroluj log API (console) — `EmailService` loguje chyby při odeslání.
- Zkontroluj, že `ADMIN_EMAIL` je nastavený a že finalizace opravdu persistovala report (když report existuje, finalizer se chová jinak a nepošle dublované zprávy).

## 8) Další doporučení (po ověření)
- Pro produkci místo MailHog použij skutečný SMTP provider a zabezpečena hesla/vaults (docker secrets nebo env v CI).
- Implementovat retry mechanism a per-email audit záznamy (Notifications dataset) pro pozdější retry.

---

Kdybys chtěl, můžu teď:
- Přidat malý README fragment do `README.Docker.md` nebo `DEPLOY.md` (pomohu s PR)
- Přidat `docker-compose` položku do hlavního `docker-compose.yml` (mohu to udělat, ale nechci automaticky měnit produkční compose)
- Přidat krátký unit test mockující `IEmailService` (ověříme dryRun behavior)

Napiš, kterou z těchto akcí chceš dál (1 = přidat README fragment do projektu, 2 = přidat mailhog do docker-compose, 3 = přidat unit test).
