# 🚀 Action Plan - Co zbývá implementovat

## Souhrn
- **Aktuální stav:** 65% (15/23 funkcí implementováno)
- **Částečně hotovo:** 22% (5/23 funkcí)
- **Chybí:** 13% (3/23 funkcí)

---

## 📋 FASE 1: Kritické funkce (MUSÍ být hotovo)

### 1. GDPR Ochrana - Anonymizace dat
**Priorita:** 🔴 VYSOKÁ  
**Složitost:** ⚙️ Střední  
**Čas:** ~4 hodiny

**Co dělat:**
- Upravit BidsController - vrátit jen iniciály jmen
- Upravit item-detail-page - skrýt jména v historii příhozů
- Upravit backend modely - přidat metodu pro anonymizaci

**Soubory k úpravě:**
- `EvidenAuctionHouseAPI/Controllers/BidsController.cs`
- `EvidenAuctionHouse/src/app/pages/item-detail-page/`
- `EvidenAuctionHouseAPI/Models/`

---

### 2. Pravidla aukce - Odsouhlasení
**Priorita:** 🔴 VYSOKÁ  
**Složitost:** ⚙️ Střední  
**Čas:** ~3 hodiny

**Co dělat:**
- Vytvořit nový endpoint `/api/users/{id}/terms-accepted`
- Vytvořit modal komponentu pro pravidla
- Uložit stav do databáze (Users - přidat pole `termsAccepted`)
- Zobrazit modal při prvním přihlášení

**Soubory k vytvoření/úpravě:**
- `EvidenAuctionHouse/src/app/components/terms-and-conditions-modal/`
- `EvidenAuctionHouseAPI/Controllers/UsersController.cs`
- `Database/Users/` - model

---

### 3. Automatické ukončení aukcí
**Priorita:** 🔴 VYSOKÁ  
**Složitost:** ⚙️ Vysoká  
**Čas:** ~5 hodin

**Co dělat:**
- Vytvořit BackgroundService pro scheduler
- Kontrolovat čas aukcí každých 5 minut
- Nastavit stav aukce na "skončená" když uplyne čas
- Volat endpoint pro určení vítěze

Aktuální stav: částečně implementováno — přidán `AuctionFinalizerService` (hosted service) a `AuctionFinalizationService` helper; chování je konfigurovatelné přes `Database/config.yml` (node `AuctionControl`). Finalizer může automaticky generovat a persistovat reporty a prodané položky.

**Soubory k vytvoření/úpravě:**
- `EvidenAuctionHouseAPI/Services/AuctionSchedulerService.cs` (nový)
- `EvidenAuctionHouseAPI/Program.cs` - registrovat service
- `EvidenAuctionHouseAPI/Models/` - přidat stav aukce

---

### 4. Určení vítěze a notifikace
**Priorita:** 🔴 VYSOKÁ  
**Složitost:** ⚙️ Vysoká  
**Čas:** ~4 hodiny

**Co dělat:**
- Vytvořit endpoint `/api/auctions/{id}/determine-winner`
- Logika: najít nejvyšší příhoz
- Poslat email vítězi
- Uložit stav do Bids (označit jako vítěz)

**Soubory k úpravě:**
- `EvidenAuctionHouseAPI/Controllers/AuctionsController.cs`
- `EvidenAuctionHouseAPI/Services/EmailService.cs` - template pro vítěze
- `EvidenAuctionHouseAPI/Models/Bid.cs` - přidat IsWinner pole

---

## 📊 FASE 2: Reporty a analýza (MĚLA by být hotova)

### 5. Reporty
**Priorita:** 🟠 STŘEDNÍ  
**Složitost:** ⚙️ Střední  
**Čas:** ~3 hodiny

**Co dělat:**
- Vytvořit ReportsController
- Endpoint pro seznam prodaných zařízení
- Endpoint pro kdo vyhrál co
- Endpoint pro výnos a statistiky

Aktuální stav: implementováno — `GET /api/Auctions/report/{auctionId}` vrací uložený report, nebo vygeneruje a uloží report + `SoldItems` on-the-fly. `POST /api/Auctions/finalize/{auctionId}` volá generování a persistenci reportu. Datové sady `Reports` a `SoldItems` jsou uloženy v `Database/Reports/assets.json` a `Database/SoldItems/assets.json`.

**Soubory k vytvoření:**
- `EvidenAuctionHouseAPI/Controllers/ReportsController.cs`
- `EvidenAuctionHouse/src/app/pages/reports-page/` (nová stránka)

---

### 6. Filtrování a vyhledávání
**Priorita:** 🟠 STŘEDNÍ  
**Složitost:** ⚙️ Střední  
**Čas:** ~3 hodiny

**Co dělat:**
- Upravit AuctionItemsController - přidat query parametry (název, stav, cena)
- Vytvořit filter komponentu v frontend
- Implementovat vyhledávání

**Soubory k úpravě:**
- `EvidenAuctionHouseAPI/Controllers/AuctionItemsController.cs`
- `EvidenAuctionHouse/src/app/components/` - nová filter komponenta
- `EvidenAuctionHouse/src/app/pages/items-list-page/`

---

### 7. Export výsledků
**Priorita:** 🟠 STŘEDNÍ  
**Složitost:** ⚙️ Střední  
**Čas:** ~2 hodiny

**Co dělat:**
- Přidat endpoint pro CSV export
- Frontend: tlačítko pro download
- Formátovat data do CSV

**Soubory k vytvoření/úpravě:**
- `EvidenAuctionHouseAPI/Services/ExportService.cs` (nový)
- `EvidenAuctionHouseAPI/Controllers/ReportsController.cs` - přidat export endpoint
- `EvidenAuctionHouse/src/app/pages/reports-page/` - přidat download tlačítko

---

## 💻 FASE 3: Pokročilé funkce (NICE TO HAVE)

### 8. Smlouva o odkupu
**Priorita:** 🟡 NÍZKÁ  
**Složitost:** ⚙️ Velmi vysoká  
**Čas:** ~8 hodin

**Co dělat:**
- Vygenerovat PDF smlouvu
- Integrace digitálního podpisu
- Uložit podepsanou smlouvu

**Soubory k vytvoření:**
- `EvidenAuctionHouseAPI/Services/ContractService.cs`
- `EvidenAuctionHouse/src/app/pages/contract-page/`

---

### 9. LDAP/OIDC login
**Priorita:** 🟡 NÍZKÁ  
**Složitost:** ⚙️ Velmi vysoká  
**Čas:** ~6 hodin

**Co dělat:**
- Integrace s Keycloak/LDAP
- Upravit Program.cs pro OAuth2/OIDC
- Upravit login endpoint

**Soubory k úpravě:**
- `EvidenAuctionHouseAPI/Program.cs`
- `EvidenAuctionHouseAPI/Controllers/AuthenticationController.cs`

---

## 📈 Návrh implementace po týdnech

### TÝDEN 1 (FÁZE 1 - Kritické):
```
Den 1: GDPR ochrana
Den 2: Pravidla aukce + Automatické ukončení
Den 3: Určení vítěze + Testing
Den 4-5: Bugfixing + UI refinement
```

### TÝDEN 2 (FÁZE 2 - Reporty):
```
Den 1: Reporty + Filtrování
Den 2: Export
Den 3-4: Testing + Documentation
Den 5: Presentace
```

### BONUS (FÁZE 3):
```
- Smlouvy (pokud bude čas)
- LDAP/OIDC integrace
```

---

## ✅ Checklist implementace

- [ ] GDPR - Anonymizace dat
- [ ] Pravidla - Odsouhlasení
- [ ] Aukce - Automatické ukončení
- [ ] Vítěz - Určení a notifikace
- [ ] Reporty - Přehled dat
	- [x] Report persistence & SoldItems + finalize endpoint
- [ ] Filtrování - Vyhledávání
- [ ] Export - CSV export
- [ ] Testing - Všechny funkce
- [ ] Dokumentace - Aktualizace README
- [ ] Demo - Záznam ukázky

## Poznámky k lokálnímu spuštění API

- Vytvořil jsem skript `scripts/start-api.sh`, který uvolní port (default 5110) a spustí API s `ASPNETCORE_URLS` nastaveným na `http://127.0.0.1:5110`.
- Pokud během startu dostanete `Address already in use`, spusťte:
	- `lsof -iTCP:5110 -sTCP:LISTEN -P -n` a `kill <PID>` pro ukončení starého procesu.


---

**Poslední aktualizace:** 21.5.2026  
**Autor:** Adam Vítek
