using Microsoft.AspNetCore.Mvc;
using dbLoader;
using DataHandler.Models;
using EvidenAuctionHouseAPI.Services;
using System.IO;
using System.Threading.Tasks;
using System.Linq;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using EvidenAuctionHouseAPI.Attributes;

namespace EvidenAuctionHouseAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContractsController : ControllerBase
    {
        private readonly AuctionHouseDatabase _db;
        private readonly RazorPdfRenderer _renderer;
    private readonly EvidenAuctionHouseAPI.Services.TokensService _tokens;
    private readonly EvidenAuctionHouseAPI.Services.IEmailService _emailService;
    private readonly EvidenAuctionHouseAPI.Services.ContractTokenService _contractTokens;

        public ContractsController(AuctionHouseDatabase db, RazorPdfRenderer renderer, EvidenAuctionHouseAPI.Services.TokensService tokens, EvidenAuctionHouseAPI.Services.IEmailService emailService, EvidenAuctionHouseAPI.Services.ContractTokenService contractTokens)
        {
            _db = db;
            _renderer = renderer;
            _tokens = tokens;
            _emailService = emailService;
            _contractTokens = contractTokens;
        }

        // Admin: list all contracts (simple DTO)
        [HttpGet]
        [SecuredAdmin]
        public IActionResult ListAll()
        {
            var list = _db.Contracts.GetData().Select(c => new {
                c.Id,
                c.AuctionId,
                c.ItemId,
                c.WinnerUserId,
                c.Price,
                c.Currency,
                c.Status,
                c.PdfPath,
                c.SignedPdfPath,
                c.GeneratedBy,
                c.TemplateVersion,
                c.CreatedAt
            }).ToList();
            return Ok(list);
        }

        // Admin: upload a signed PDF file and attach to contract (manual administrative upload)
        [HttpPost("{contractId}/upload-signed")]
        [SecuredAdmin]
        public IActionResult UploadSignedPdf(string contractId, IFormFile file)
        {
            var contract = _db.Contracts.Find(c => c.Id == contractId);
            if (contract == null) return NotFound("Contract not found");

            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            // determine upload folder
            var outFolder = Path.Combine(_db.dbFolderPath, "AuctionDocuments", contract.AuctionId ?? "", "contracts");
            Directory.CreateDirectory(outFolder);

            // save file with a safe name
            var fileName = Path.GetFileName(file.FileName);
            if (string.IsNullOrEmpty(fileName)) fileName = contractId + "-signed.pdf";
            var savedPath = Path.Combine(outFolder, fileName);
            using (var stream = System.IO.File.Create(savedPath))
            {
                file.CopyTo(stream);
            }

            // update contract
            contract.SignedPdfPath = Path.GetRelativePath(_db.dbFolderPath, savedPath);
            contract.Status = "Signed";
            contract.SignatureMethod = "manual-admin";

            // append audit
            contract.Audit ??= new System.Collections.Generic.List<string>();
            var adminId = _tokens.GetUserId(Request.Headers["Authorization"].ToString());
            contract.Audit.Add($"Admin-uploaded signed PDF by {adminId} at {System.DateTime.UtcNow:o}");

            _db.Contracts.Update(contract, contract.Id);

            return Ok(new { message = "Signed PDF uploaded" });
        }

        [HttpPost("{auctionId}/generate")]
        public async Task<IActionResult> Generate(string auctionId)
        {
            // Read sold items for auction
            var sold = _db.SoldItems.GetData().Where(s => s.AuctionId == auctionId).ToList();
            if (!sold.Any()) return NotFound("No sold items for auction");

            var outFolder = Path.Combine(_db.dbFolderPath, "AuctionDocuments", auctionId, "contracts");
            Directory.CreateDirectory(outFolder);

            foreach (var s in sold)
            {
                // create contract metadata
                var contract = new Contract()
                {
                    AuctionId = auctionId,
                    ItemId = s.AuctionItemId,
                    WinnerUserId = s.WinnerUserId,
                    Price = s.FinalPrice,
                    Currency = "CZK",
                    CreatedAt = System.DateTime.UtcNow,
                    GeneratedBy = "finalizer",
                    TemplateVersion = "v1",
                    Status = "Draft"
                };

                _db.Contracts.Add(contract);

                // render HTML
                var model = new {
                    AuctionId = auctionId,
                    AuctionName = _db.Auctions.Find(a => a.Id == auctionId)?.Name ?? "",
                    ItemName = s.Name,
                    ItemId = s.AuctionItemId,
                    WinnerUserId = s.WinnerUserId,
                    WinnerName = s.WinnerFullName,
                    Price = s.FinalPrice,
                    Currency = "CZK",
                    TemplateVersion = contract.TemplateVersion
                };

                var html = await _renderer.RenderViewToStringAsync("~/Templates/Contracts/contract.cshtml", model);

                var fileNameBase = contract.Id;
                var htmlPath = Path.Combine(outFolder, fileNameBase + ".html");
                var pdfPath = Path.Combine(outFolder, fileNameBase + ".pdf");

                System.IO.File.WriteAllText(htmlPath, html);

                // try convert via wkhtmltopdf (or Puppeteer fallback)
                var pdfResult = await _renderer.HtmlToPdfAsync(html, pdfPath);
                if (pdfResult != null)
                {
                    // update contract record with path
                    contract.PdfPath = Path.GetRelativePath(_db.dbFolderPath, pdfPath);
                    contract.Status = "Sent";
                    _db.Contracts.Update(contract, contract.Id);
                }
                else
                {
                    // leave as HTML only
                    contract.PdfPath = Path.GetRelativePath(_db.dbFolderPath, htmlPath);
                    contract.Status = "Draft";
                    _db.Contracts.Update(contract, contract.Id);
                }
            }

            return Ok(new { message = "Contracts generated" });
        }

        [HttpGet("{contractId}/document")]
        // Accept an optional one-time token via query param `t`. Admins can still use their JWT auth header.
        public IActionResult GetDocument(string contractId, [FromQuery(Name = "t")] string token = null)
        {
            var contract = _db.Contracts.Find(c => c.Id == contractId);
            if (contract == null) return NotFound("Contract not found");
            // if token provided, validate-and-consume it (single-use)
            if (!string.IsNullOrEmpty(token))
            {
                if (!_contractTokens.ValidateAndConsume(token, out var tokenContractId, out var tokenUserId))
                {
                    return Unauthorized("Invalid or already-used token");
                }
                // token must match contract id
                if (tokenContractId != contractId) return Unauthorized("Token does not match contract");
            }

            var basePath = _db.dbFolderPath ?? "";
            if (!string.IsNullOrEmpty(contract.PdfPath))
            {
                // Normalize stored PdfPath (which may use forward slashes) and combine safely
                var normalized = contract.PdfPath.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
                var pdfFull = Path.GetFullPath(Path.Combine(basePath, normalized));
                if (System.IO.File.Exists(pdfFull))
                {
                    var bytes = System.IO.File.ReadAllBytes(pdfFull);
                    return File(bytes, "application/pdf", Path.GetFileName(pdfFull));
                }
            }

            // Fallback to HTML if PDF is not available
            if (!string.IsNullOrEmpty(contract.PdfPath))
            {
                var htmlFull = Path.Combine(basePath, contract.PdfPath);
                if (System.IO.File.Exists(htmlFull))
                {
                    var html = System.IO.File.ReadAllText(htmlFull);
                    return Content(html, "text/html");
                }
            }

            return NotFound("Document file not found");
        }

        [HttpPost("{contractId}/token")]
        public IActionResult CreateToken(string contractId, [FromBody] TokenRequest req)
        {
            var contract = _db.Contracts.Find(c => c.Id == contractId);
            if (contract == null) return NotFound("Contract not found");

            // require a userId in body (recipient) - minimal validation
            if (req == null || string.IsNullOrEmpty(req.UserId)) return BadRequest("userId required");

            var token = _tokens.CreateContractToken(contractId, req.UserId, TimeSpan.FromDays(7));
            // persist for single-use enforcement
            _contractTokens.Store(token, contractId, req.UserId, DateTime.UtcNow.AddDays(7));

            return Ok(new { token });
        }

        [HttpPost("{contractId}/send")]
        public IActionResult SendContractEmail(string contractId, [FromBody] SendRequest req)
        {
            var contract = _db.Contracts.Find(c => c.Id == contractId);
            if (contract == null) return NotFound("Contract not found");

            if (req == null || string.IsNullOrEmpty(req.RecipientEmail) || string.IsNullOrEmpty(req.UserId)) return BadRequest("recipientEmail and userId required");

            // create a one-time token tied to this contract and user and persist to enforce single-use
            var token = _tokens.CreateContractToken(contractId, req.UserId, TimeSpan.FromDays(7));
            _contractTokens.Store(token, contractId, req.UserId, DateTime.UtcNow.AddDays(7));

            // build link to download/sign (frontend path can consume token param 't')
            var baseUrl = Request.Scheme + "://" + Request.Host.Value;
            var link = $"{baseUrl}/api/Contracts/{contractId}/document?t={System.Net.WebUtility.UrlEncode(token)}";

            // render templates (simple replace)
            var templateHtmlPath = Path.GetFullPath(Path.Combine(_db.dbFolderPath, "..", "EvidenAuctionHouseAPI", "Emails", "Templates", "contract-sent.html"));
            var templateTxtPath = Path.GetFullPath(Path.Combine(_db.dbFolderPath, "..", "EvidenAuctionHouseAPI", "Emails", "Templates", "contract-sent.txt"));

            string html = null;
            string txt = null;
            try {
                // try load from repo first; fallback to embedded string if missing
                if (System.IO.File.Exists(templateHtmlPath)) html = System.IO.File.ReadAllText(templateHtmlPath);
                if (System.IO.File.Exists(templateTxtPath)) txt = System.IO.File.ReadAllText(templateTxtPath);
            } catch { }

            // fallback simple bodies
            if (string.IsNullOrEmpty(txt)) txt = $"Hello,\n\nYou can download and sign your contract here: {link}\n\nThis link expires on {DateTime.UtcNow.AddDays(7):u} and is one-time use.";
            if (string.IsNullOrEmpty(html)) html = $"<p>Hello,</p><p>Please download your contract <a href=\"{link}\">here</a>. Expires on {DateTime.UtcNow.AddDays(7):u}.</p>";

            // perform replacements
            var winnerName = contract.WinnerUserId != null ? (_db.Users.Find(u => u.Id == contract.WinnerUserId)?.Name ?? "") : "";
            var auctionName = _db.Auctions.Find(a => a.Id == contract.AuctionId)?.Name ?? "";
            html = html.Replace("{{WinnerName}}", System.Net.WebUtility.HtmlEncode(winnerName))
                       .Replace("{{ItemName}}", System.Net.WebUtility.HtmlEncode(_db.AuctionItems.Find(i => i.Id == contract.ItemId)?.Name ?? ""))
                       .Replace("{{AuctionName}}", System.Net.WebUtility.HtmlEncode(auctionName))
                       .Replace("{{Price}}", contract.Price.ToString())
                       .Replace("{{Currency}}", contract.Currency ?? "CZK")
                       .Replace("{{Link}}", link)
                       .Replace("{{ExpiresAt}}", DateTime.UtcNow.AddDays(7).ToString("u"));

            txt = txt.Replace("{{WinnerName}}", winnerName)
                     .Replace("{{ItemName}}", _db.AuctionItems.Find(i => i.Id == contract.ItemId)?.Name ?? "")
                     .Replace("{{AuctionName}}", auctionName)
                     .Replace("{{Price}}", contract.Price.ToString())
                     .Replace("{{Currency}}", contract.Currency ?? "CZK")
                     .Replace("{{Link}}", link)
                     .Replace("{{ExpiresAt}}", DateTime.UtcNow.AddDays(7).ToString("u"));

            var subject = $"Eviden Auction - contract for { _db.AuctionItems.Find(i => i.Id == contract.ItemId)?.Name ?? "item" }";

            var ok = false;
            try { ok = (_emailService as EvidenAuctionHouseAPI.Services.EmailService)?.SendContractEmail(req.RecipientEmail, subject, txt, html) ?? _emailService.SendEmail(req.RecipientEmail, subject, txt); } catch { ok = false; }

            if (!ok)
            {
                return StatusCode(502, "Failed to send email");
            }

            // append audit entry to contract
            contract.Audit ??= new System.Collections.Generic.List<string>();
            contract.Audit.Add($"Sent to {req.RecipientEmail} at {System.DateTime.UtcNow:o}");
            _db.Contracts.Update(contract, contract.Id);

            return Ok(new { message = "Email sent" });
        }

        [HttpPost("{contractId}/light-sign/{token}")]
        public IActionResult LightSign(string contractId, string token)
        {
            var contract = _db.Contracts.Find(c => c.Id == contractId);
            if (contract == null) return NotFound("Contract not found");

            if (string.IsNullOrEmpty(token)) return BadRequest("token required");

            // validate and consume one-time token
            if (!_contractTokens.ValidateAndConsume(token, out var tokenContractId, out var tokenUserId))
            {
                return Unauthorized("Invalid or already-used token");
            }
            if (tokenContractId != contractId) return Unauthorized("Token does not match contract");

            // mark as signed (light-sign)
            contract.Status = "Signed";
            contract.SignatureMethod = "light";
            // SignatureMetadata is stored as a JSON string in the Contract model
            var sig = new System.Collections.Generic.Dictionary<string, string>();
            sig["signedAt"] = System.DateTime.UtcNow.ToString("o");
            sig["signedByUserId"] = tokenUserId ?? "";
            contract.SignatureMetadata = JsonSerializer.Serialize(sig);
            contract.Audit ??= new System.Collections.Generic.List<string>();
            contract.Audit.Add($"Light-signed by {tokenUserId} at {System.DateTime.UtcNow:o}");

            // persist contract changes
            _db.Contracts.Update(contract, contract.Id);

            return Ok(new { message = "Contract signed" });
        }
    }

    public class TokenRequest { public string UserId { get; set; } }
    public class SendRequest { public string RecipientEmail { get; set; } public string UserId { get; set; } }
}
