# Návrh: smlouva o odkupu / paperwork & podpis

Krátké shrnutí: navrhuju jednoduchou, bezpečnou a evoluční cestu pro generování smluv o odkupu (PDF), doručení vítězi a administrátorovi, uchování podepsaných kopií a možnost integrovat externího poskytovatele podpisu později.

Cíle
- Generovat smlouvu o odkupu automaticky po skončení aukce pro každý prodaný předmět.
- Zajistit doručení vítězi a administrátorovi (e-mail + odkaz na stažení).
- Uchovat podepsanou kopii v repozitáři dat (`Database/SoldItems` nebo `Database/Reports`) a auditní záznam o podpisu.
- Podpořit dvě úrovně podpisu:
  1. "Light" — uživatel potvrdí a nahráje sken/obrázek podepsaného dokumentu nebo klikne na „souhlasím" přes zabezpečený odkaz (nejrychlejší).
  2. "Advanced" — externí e-sign provider (DocuSign/SignRequest/Adobe Sign) nebo eID integrace (CZ eID) pro právně silné podpisy.

Kontrakt - datový model (návrh)
- Contract (nový model / dataset `Contracts`):
  - id: guid
  - auctionId: guid
  - itemId: guid
  - winnerUserId: guid
  - price: decimal
  - currency: string
  - createdAt: datetime
  - generatedBy: string (service/admin)
  - templateVersion: string
  - pdfPath: string (relative path in storage)
  - signedPdfPath: string | null
  - signatureMethod: enum {None, Light, External}
  - signatureMetadata: json | null (timestamp, providerId, transactionId, signerEmail)
  - status: enum {Draft, Sent, Signed, Archived}
  - audit: list of {actor, action, timestamp, ip}

Architektura a úlohy
1) Generování PDF
  - Použít server-side šablonu (Razor / wkhtmltopdf / DinkToPdf / QuestPDF) v `EvidenAuctionHouseAPI`.
  - Šablony uložit v `EvidenAuctionHouseAPI/Templates/Contracts/` (verzování šablon). V šabloně vložit anonymizované údaje (pseudonymmapu) a kontaktní údaje vítěze, pokud GDPR to dovolí.
2) Uložení + metadata
  - Generovaný PDF uložit do `Database/AuctionDocuments/<auctionId>/contracts/` a zapsat záznam do `Database/Contracts/assets.json`.
3) Doručení
  - Po finalizaci aukce vytvořit Contract záznamy pro každý prodaný `SoldItem` a poslat email vítězi s linkem na stažení a jednoduchým formulářem/odkazem pro podpis (light).
  - Email přes existující `EmailService` (MailKit) s šablonou `emails/contract-sent`.
4) Light podpis
  - Link v emailu má jednorázový token (JWT nebo krátkodobý GUID uložený v Contracts.signatureMetadata) s expirací (např. 7 dní).
  - Po kliknutí se uživateli zobrazí stránka s preview PDF a tlačítkem "Potvrdit a podepsat" (frontend komponenta `contract-sign-page`). Po potvrzení backend uloží `signedPdfPath` (může být stejný PDF pokud method=Light) a update status na Signed s audit záznamem.
5) External podpis
  - Rozhraní v API: `POST /api/Contracts/{id}/external-sign` — připraví a odešle request externímu providerovi, zapíše provider transaction id do `signatureMetadata`.
  - Webhook endpoint `POST /api/Contracts/external-callback` pro provider notify; při callbacku stáhnout podepsaný PDF, uložit `signedPdfPath`, status Signed a audit.

API – navržené endpointy
- GET /api/Contracts/{id} — vrátí metadata contractu (bez PDF body pokud není admin)
- GET /api/Contracts/{id}/pdf — stream PDF (auth, krátkodobý token nebo admin)
- POST /api/Contracts/{auctionId}/generate — (internal/admin) generuje kontrakty pro finalizované prodané položky
- POST /api/Contracts/{id}/send — (admin) odešle email s odkazem
- POST /api/Contracts/{id}/light-sign/{token} — endpoint vyvolaný z frontendu po potvrzení
- POST /api/Contracts/{id}/external-sign — zahájí externí signing flow
- POST /api/Contracts/external-callback — callback od provideru (sekret + verify signature)

Frontend – komponenty a UX
- `contract-preview.component` — zobrazení PDF (iframe nebo embedded viewer) + tlačítko "Stáhnout" a "Podepsat".
- `contract-sign-page` — stránka, kde uživatel podepíše (light) — zobrazí podmínky, checkbox + capture IP/timestamp.
- Admin: `admin-contracts-list.component` a `admin-contract-edit.component` — náhled, reship, force-sign (upload podepsaného PDF), retry external-sign.

Bezpečnost / právní / audit
- Jednorázové linky musí být krátkodobé a vázané na contractId + userId.
- Uchovávat auditní trail (kdo, kdy, IP, jaká akce).
- Pokud používáte externí provider, ukládat provider transaction id, a podepsaný PDF vždy stáhnout a uložit lokálně (nespoléhat jen na provider URL).
- GDPR: pokud veřejná data, anonymizovat jména (pseudonymmapa). U soukromých e-mailů a tel. čísel poskytnout pouze adminům.

Implementační plán (iterativně)
Fáze A — MVP (2–4 dni)
 - Přidat dataset `Contracts` (JSON-backed) a model + migrations čtení/zápis.
 - Implementovat PDF generaci pro jednoduchou šablonu (QuestPDF nebo Razor->PDF).
 - Po finalizaci aukce generovat kontrakty a uložit je (status Draft -> Sent).
 - Odeslat email s odkazem na preview + light-sign link.
 - Frontend: `contract-preview` + `contract-sign-page` (light-sign flow).

Fáze B — production hardening (3–6 dní)
 - Přidat external provider integration (DocuSign/SignRequest) + webhook handling.
 - Přidat admin UI pro přehled a manuální upload podepsaného PDF.
 - Audit a testy (unit + integration for callback verification).
 - Aktualizovat `docker-compose` secrets / env pro provider credentials.

Fáze C — právní a archivace (1–2 dny)
 - Přidat verifikaci integrity (checksum) a timestamping (např. ukládat server-side timestampy a/nebo využít TSP služby pokud potřeba).
 - Export a archivace (zip per-auction) do `Database/Archives/`.

Drobné technické tipy
- Preferovat server-side PDF renderer (QuestPDF je .NET-native a bez závislosti na externích binárkách).
- Ukládat PDF relativně pod `Database/AuctionDocuments/...` tak, aby zálohování a docker volume fungovalo bez další vrstvy.
- Email templates: `EvidenAuctionHouseAPI/Emails/Templates/contract-sent.*`.
- Přidat jednoduchý integration test pro callback (simulovat provider webhook).

Shrnutí: doporučuju najít MVP cestu — generovat PDF a light-sign flow co nejdříve, ukládat podepsané kopie a audit. Externí e-sign integraci nasadit jako druhý krok. Pokud chceš, mohu pokračovat a vytvořit skeletony modelů, API endpointů a frontend komponent ve druhém kroku.

## Rizika a možné chyby (failure modes & risk)

Níže jsou nejpravděpodobnější chyby nebo rizikové oblasti s krátkou klasifikací pravděpodobnosti (Low/Medium/High), dopadem a doporučenou mitigací.

- PDF renderer selže nebo chybí binárky
  - Likelihood: Medium, Impact: Medium
  - Mitigace: preferovat .NET-native renderer (QuestPDF). Přidat health-check a fallback logiku; CI step spouštět generaci sample PDF.

- Uložení PDF se nezdaří (disk plný / permission)
  - Likelihood: Medium, Impact: High
  - Mitigace: validovat volné místo před generací, návratová chyba uživateli/adminu, retry/backoff, monitorování volume size, alerty.

- Email nedoručen (špatné SMTP, creds v repu)
  - Likelihood: Medium, Impact: Medium
  - Mitigace: přesunout creds do environment/docker secrets; fallback log do samostatné fronty, retry a admin re-send; testovací MailHog pro dev.

- Jednorázový podpisový link zneužit nebo unikne
  - Likelihood: Low, Impact: High
  - Mitigace: krátká expirace tokenu (např. 7d or less), vázat token na userId + contractId, logovat použití tokenu a IP adresu, možnost token revoke.

- Webhook od external provideru je spoofnut nebo replaynut
  - Likelihood: Low, Impact: High
  - Mitigace: podepisovat webhook payload HMAC/secret, ověřit provider transaction id, přijímat jen jednou (idempotence), uchovávat audit.

- External provider unavailable nebo callback chybí
  - Likelihood: Medium, Impact: Medium
  - Mitigace: implementovat retry/backoff, admin UI s možností recheck nebo manuální upload podepsaného PDF.

- Race conditions při generování kontraktů (duplicity)
  - Likelihood: Medium, Impact: Medium
  - Mitigace: při generování používat per-auction lock (stávající pattern finalizeru) a idempotentní writes (check-if-exists before create).

- GDPR: citlivá data v PDF nebo e-mailu
  - Likelihood: Low, Impact: High
  - Mitigace: anonymizovat data v veřejných výstupech, poskytovat detailní data pouze adminům, šifrovat uložené dokumenty pokud požadováno, záznam o souhlasu uživatele.

- Legální riziko: "light" podpis nemusí být právně závazný
  - Likelihood: High (business/legal), Impact: High
  - Mitigace: konzultace s právníkem; v dokumentaci jasně uvést, že light-sign je předběžné potvrzení a pro závazný podpis použít external e-sign provider.

- Backup/restore chybí pro dokumenty
  - Likelihood: Medium, Impact: High
  - Mitigace: zajistit, aby `Database/AuctionDocuments` bylo součástí záloh, ověřit restore proces; přidat checksumy pro integritu.

- Vendor lock-in / náklady při external provider integraci
  - Likelihood: Medium, Impact: Medium
  - Mitigace: navrhnout abstraktní provider interface, implementovat provider adaptér pro DocuSign/SignRequest, umožnit konfiguraci provideru přes env.

- Bezpečnostní zranitelnosti v knihovnách (PDF renderer / email libs)
  - Likelihood: Medium, Impact: Medium
  - Mitigace: pravidelné dependency security scan (OWASP, GitHub Dependabot), minimalizovat surface area pro file parsing.

Pro každé riziko doporučuji přidat minimální test (unit/integration) a alerting/monitoring metriky, aby bylo možné rychle detekovat a reagovat.
