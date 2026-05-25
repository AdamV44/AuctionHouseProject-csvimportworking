# Návrh GDPR (upraveno): admin-only přístup k reportům a anonymizace mimo admin rozhraní

Datum: 2026-05-25

Stručně: V tomto návrhu vycházím z bezpečnostního omezení, že stránka s reporty je přístupná pouze administrátorům (role ověřená přes `SecuredAdmin`). To změní výchozí pravidla anonymizace: v normálním uživatelském UI a veřejných výstupech musí být data anonymizována, zatímco na admin-only report stránce může být standardně zobrazováno více citlivých údajů — ovšem pouze pokud je to explicitně povoleno konfigurací a přístupem administrátora.

Checklist hlavních zásad
- Reports page: přístup pouze pro adminy (SecuredAdmin). Neadmin uživatelé nemají přístup.
- Veřejné UI (item detail, bids history, veřejné CSV): vždy anonymizované informace (výherce jako iniciála, pseudonymy v nabídkách).
- Admin UI / Reports: defaultně může obsahovat plné údaje, ale to podléhá konfiguračním flagům a auditním požadavkům.

1) Cíle
- Zajistit princip minimalizace údajů v uživatelském rozhraní a exportech pro ne-admin uživatele.
- Umožnit administrátorům kontrolovaný přístup k plným datům v reportech a při administrativních exportech.
- Ukládat dostatek informací pro audit a právní účely, přitom omezit expozici osobních údajů v běžném UI.

2) Rozsah a přístupová politika
- Frontend: item detail, bids history, public CSV export — anonymizace povinná.
- Reports page: admin-only; report generátor a preview pro adminy (plná data k dispozici jen adminům podle flagu).
- Backend: report generation, SoldItems persistence, admin-only CSV endpoints.
- Data: Name, Email, userId; hesla nejsou součástí reportů.

3) Anonymizace a pseudonymizace
- Veřejné UI: Winner display — pouze první písmeno křestního jména (velké), žádné emaily.
- Bids history (public views): per-auction pseudonym map (UserId -> pseudonym jako "P1", "P2"); pseudonymy ukládat do reportu pro konzistenci v rámci jednoho reportu.
- Reports (admin-only): report objekt bude obsahovat pseudonym mapu a rovněž (podle konfigurace) pole s plnými údaji; přístup ke skutečným políčkům musí vyžadovat admin autoritu.

4) Konfigurace a bezpečnost
- Config flags (Database/config.yml nebo env):
  - `GDPR:AnonymizeUI: true|false` (default true) — ovlivňuje veřejné UI a veřejné exporty.
  - `GDPR:AllowAdminExport: true|false` (default true) — povoluje admin export s osobními daty.
  - `GDPR:PseudonymSalt: <random>` — volitelné, pro stabilní pseudonymy napříč restartem (pokud chceme).
- Každý endpoint, který vrací citlivá pole, musí ověřit `SecuredAdmin` a zkontrolovat výše zmíněné flagy.

5) Backend — konkrétní návrh
- Report generation (`AuctionFinalizationService.GenerateAndPersistReport`):
  - Při finalizaci vytvořit `PseudonymMap` (userId -> pseudonym) a uložit ji jako součást reportu.
  - Report DTO bude obsahovat dvě vrstvy: anonymizovaný (pro ne-adminy) a sensitive (plná data) dostupná pouze adminům.
  - API: `GET /api/Auctions/report/{auctionId}?includeSensitive=true` bude povoleno jen adminům a pouze pokud `GDPR:AllowAdminExport` je true.

6) Frontend — role admin
- Reports page bude dostupná pouze v navigaci pro adminy. Non-admin uživatelé tuto položku nevidí ani nemají přístup.
- Na reports stránce přidat jasné přepínače (např. "Zobrazit osobní údaje"), které jsou enabled jen pro admin token a jen pokud `GDPR:AllowAdminExport` = true.
- Ve veřejném UI zůstanou anonymizované zobrazení (inicializované jméno, pseudonymy apod.).

7) Persistované údaje a audit
- SoldItems a reporty mohou obsahovat plná pole (WinnerEmail, WinnerFullName) pro právní a účetní potřeby. Přístup k těmto polím však bude povolen pouze přes admin-only API.

8) Backfill & migrace
- Backfill skript: projít `Database/Reports` a `Database/SoldItems`, kde chybí `PseudonymMap`, vygenerovat ji a persistovat (dry-run režim dostupný). Legacy SoldItems ponechat s plnými údaji, ale označit je jako UI-hidden.

9) Testy & QA
- Unit testy pro generování `PseudonymMap` a pro DTO maskování.
- Integration test: pokus o přístup k reportu jako non-admin -> 403 / anonymizovaná data; jako admin s flagy povolenými -> plné pole v odpovědi.

10) Edge cases
- Guest / unauthenticated = non-admin -> anonymizace.
- Pokud se admin export povolí, všechny výstupy adminu musí být auditovány (záznam, kdo stáhl data a kdy).

11) Rollout (doporučené kroky)
1. Zajistit, že Reports page v UI je dostupná pouze pro adminy (navigace + route guard).
2. Přidat config flagy (`GDPR:AnonymizeUI`, `GDPR:AllowAdminExport`, `GDPR:PseudonymSalt`).
3. Implementovat backend pseudonym map + report DTO s anonymizovanou a sensitive vrstvou.
4. Přidat admin-only CSV export endpoint a UI kontrolky (disabled pro non-adminy).
5. Spustit backfill v dry-run, zkontrolovat výsledky, pak spustit migraci.
6. Přidat testy a dokumentaci (README/changelog).

12) Kontrakt
- Input: auctionId, requester's token (user/admin), config flags.
- Output: report DTO s anonymizovanými poli pro non-admin; sensitive pole pouze pokud caller je admin a config to povoluje.
- Chyby: unauthorized (401/403) pro admin exporty, not found (404) pro chybějící aukce.

Další krok mohu udělat
- Implementovat backend část (pseudonym map + anonymizované/sensitive DTO), přidat kontrolu `SecuredAdmin` v kontroleru a přidat UI navigaci/guard pro reports page.

---
Kontakt: pokud chceš, začnu s prvním krokem (backend: pseudonym map + masked DTO) a nasadím integrační testy.
