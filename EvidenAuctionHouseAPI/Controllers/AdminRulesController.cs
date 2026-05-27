using System;
using dbLoader;
using dbLoader.Models;
using EvidenAuctionHouseAPI.Attributes;
using Microsoft.AspNetCore.Mvc;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/admin/rules")]
    [ApiController]
    public class AdminRulesController : ControllerBase
    {
        private readonly AuctionHouseDatabase myDb;

        public AdminRulesController(AuctionHouseDatabase db)
        {
            this.myDb = db;
        }

    // Return the raw markdown body from the inline dataset Body
        [SecuredUser]
        [HttpGet("raw")]
        public IActionResult GetRaw()
        {
            var rules = this.myDb.Rules.GetData();
            if (rules.Count == 0) return NotFound("No rules configured");
            var rule = rules[0];
            // Always return the inline Body stored in the dataset
            return Ok(new { body = rule.Body ?? string.Empty });
        }

        // Overwrite the markdown file
    [SecuredAdmin]
    [HttpPut("raw")]
        public IActionResult PutRaw([FromBody] RawDTO dto)
        {
            try
            {
                var rules = this.myDb.Rules.GetData();
                if (rules.Count == 0) return NotFound("No rules configured");
                var rule = rules[0];
                // Always update the inline Body in the dataset
                rule.Body = dto?.raw ?? string.Empty;
                this.myDb.Rules.Update(rule, rule.Id);
                return Ok(new { ok = true, inline = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "write failed", error = ex.Message });
            }
        }

        // Update metadata (title/version) in assets.json dataset entry
        [SecuredAdmin]
        [HttpPut("meta")]
        public IActionResult PutMeta([FromBody] RuleMetaDTO dto)
        {
            try
            {
                var list = this.myDb.Rules.GetData();
                if (list.Count == 0) return NotFound("No rules configured");
                var rule = list[0];
                if (!string.IsNullOrWhiteSpace(dto.Title)) rule.Title = dto.Title;
                if (!string.IsNullOrWhiteSpace(dto.Version)) rule.Version = dto.Version;
                // update dataset file on disk by using Rules.Update
                this.myDb.Rules.Update(rule, rule.Id);
                return Ok(new { ok = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "update failed", error = ex.Message });
            }
        }

    public class RuleMetaDTO { public string Title { get; set; } public string Version { get; set; } }
    public class RawDTO { public string raw { get; set; } }
    }
}
