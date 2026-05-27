# Návrh: Pravidla při prvním přihlášení

Cíl
- Implementovat modal "Pravidla aukce" (Terms of Auction) který se zobrazí uživateli při prvním úspěšném přihlášení a vyžaduje explicitní souhlas.
- Souhlas se uloží na serveru v profilu uživatele (persisted), musí být auditovatelný (čas, verze pravidel).
- UI musí podporovat zobrazení, přijetí / odmítnutí a možnost zobrazení pravidel později v uživatelském profilu.

Požadavky (kratce)
- Když uživatel (authenticated) nemá uložený souhlas, frontend zobrazí modal po přihlášení.
- Souhlas (accepted) se uloží server-side jako boolean + timestamp + rulesVersion.
- Pokud se verzováním pravidel (rulesVersion) změní, všichni uživatelé musí nový souhlas potvrdit.
- Endpoint pro přijmutí bude idempotentní a chráněný (musí být přihlášený uživatel).

Checklist (co uděláme)
- [ ] Datová změna: User model přidat `AcceptedRules: bool`, `AcceptedRulesAt: datetime?`, `AcceptedRulesVersion: string?`
- [ ] API: `POST /api/Users/accept-rules` (authed) a `GET /api/Users/me` rozšířit o accepted flagy
- [ ] Frontend: modal komponenta, zobrazit po loginu pokud `AcceptedRules` false nebo version mismatch
- [ ] Migrace: nastavit `AcceptedRules=false` pro existující uživatele a definovat `CURRENT_RULES_VERSION`
- [ ] Tests: server unit testy + frontend e2e test pro login->modal->accept flow

Datový kontrakt
- User storage (JSON/DB) přidat pole:
  - AcceptedRules: boolean (default false)
  - AcceptedRulesAt: ISO8601 datetime | null
  - AcceptedRulesVersion: string | null

- POST /api/Users/accept-rules
  - Request: none (server vezme aktuálně přihlášeného uživatele)
  - Response 200: { accepted: true, acceptedAt: "2026-05-27T...Z", version: "v1.0" }
  - Response 401: pokud user není přihlášen
  - Notes: endpoint je idempotentní; pokud již existuje stejné version -> vrací 200 s aktuálním stavem

API návrh
- GET /api/Users/me
  - Rozšíření: vrátí { id, email, displayName, acceptedRules, acceptedRulesAt, acceptedRulesVersion }

- POST /api/Users/accept-rules
  - Behaviour: uloží AcceptedRules=true, AcceptedRulesAt = UTC now, AcceptedRulesVersion = ENV or server constant
  - Security: musí vyžadovat platný access token
  - Side-effects: vytvořit audit záznam (log) nebo append do `RegisterAttempts`/`Logs` (volitelné)

Frontend UX
- Po successful login flow (přihlášení úspěšné a access token získán):
  1. Frontend zavolá `GET /api/Users/me` (pokud ještě nevolal)
  2. Pokud `acceptedRules` == false OR `acceptedRulesVersion` !== CURRENT_RULES_VERSION, zobraz modal
  3. Modal obsah:
     - Krátké shrnutí pravidel (odstavce) + link "Zobrazit celá pravidla" (plná stránka)
     - Checkbox: "Rozumím a souhlasím s pravidly aukce"
     - Tlačítka: "Přijmout" (aktivní jen pokud checkbox zaškrtnut), "Odmítnout" (logout)
  4. Po kliknutí "Přijmout": zavolat `POST /api/Users/accept-rules` s withCredentials/Authorization; po 200 zavřít modal a pokračovat
  5. Po "Odmítnout": logout + redirect na landing page nebo zobraz info že bez souhlasu není přístup

- Accessibility & UX drobnosti:
  - Modal by měl být focus-trapped
  - Pokud uživatel použije "Zavřít" bez přijetí -> blokovat přístup k funkcionalitě (UI readonly) nebo požádat o potvrzení odchodu
  - Texty v modalu ukládat v translatable resources

Edge cases a bezpečnost
- Multiple devices: souhlas je už uložen server-side => všechny zařízení považují uživatele za přijatého
- Token reuse: souhlas se ukládá nezávisle na access tokenu, refresh tokeny nezmění validitu
- Versioning: zvýšení `CURRENT_RULES_VERSION` v env spustí požadavek na opětovné odsouhlasení
- CSRF: `POST /api/Users/accept-rules` používá Authorization header (JWT), není závislý na cookies; pokud používáme cookie-based refresh, endpoint stále vyžaduje Authorization a/nebo ověření identity (prevence CSRF)
- Idempotence: vícenásobné volání `accept-rules` neškodí

Migrace
- Script / manual step: upravit `Database/Users/assets.json` pro každý user:
  - pokud chybí, přidejte `AcceptedRules:false` a `AcceptedRulesVersion:null`
- Define server-side constant `CURRENT_RULES_VERSION = "v1.0"` (může být env var `RULES_VERSION`)

Testy
- Backend unit tests
  - Mock user repo: verify `POST /accept-rules` sets flags and returns correct timestamp/version
  - Verify idempotence and 401 for unauthenticated
- Frontend e2e (Cypress / Playwright)
  - Flow: login -> verify modal appears -> accept -> verify modal closed and user can access protected route

Monitoring / auditing
- Log each accept event with userId, timestamp, ip (optional), version
- Provide admin UI to list users who haven't accepted rules

Migration path for existing users
- Option A (soft): default `AcceptedRules` to true for existing users for initial launch and require re-accept only when version increments (less safe)
- Option B (strict): default false, force modal at next login for all users (recommended for compliance)

Implementation estimate (rough)
- Backend: ~2–4 hours (add fields, endpoint, migration script, unit tests)
- Frontend: ~3–6 hours (modal component, wiring after login, accessibility, e2e test)
- QA & docs: ~1–2 hours

Další kroky (doporučené)
1. Schválit text pravidel a verzi (vytvořit `RULES_VERSION` a text file `docs/pravidla_aukce.md`).
2. Implementovat backend změny (small PR): data fields + endpoint + audit log.
3. Implementovat frontend modal a e2e test.
4. Spustit migraci pro všechny uživatele (vybrat strict vs soft).

Ukázkový patch pro backend (pseudokód)
```csharp
// User.cs (model)
public bool AcceptedRules { get; set; } = false;
public DateTime? AcceptedRulesAt { get; set; }
public string? AcceptedRulesVersion { get; set; }

// UsersController.cs
[HttpPost("accept-rules")]
[Authorize]
public IActionResult AcceptRules()
{
    var userId = GetUserIdFromToken();
    var user = _db.Users.Find(userId);
    user.AcceptedRules = true;
    user.AcceptedRulesAt = DateTime.UtcNow;
    user.AcceptedRulesVersion = _config.RulesVersion;
    _db.Save();
    return Ok(new { accepted = true, acceptedAt = user.AcceptedRulesAt, version = user.AcceptedRulesVersion });
}
```

Závěr
- Tento návrh je navržen tak, aby byl bezpečný, jednoduše audituovatelný a kompatibilní s existujícím token/refresh flow v projektu. Po odsouhlasení vám mohu rovnou vytvořit backend patch + migration a frontend modal podle preferovaného workflow.
