using System;
using dbLoader;
using dbLoader.Models;
using EvidenAuctionHouseAPI.Attributes;
using Microsoft.AspNetCore.Mvc;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RulesController : ControllerBase
    {
        private readonly AuctionHouseDatabase myDb;

        public RulesController(AuctionHouseDatabase db)
        {
            this.myDb = db;
        }

        [HttpGet("current")]
        public IActionResult GetCurrentRules()
        {
            // Return the rule with the highest version or the first if single
            var rulesList = this.myDb.Rules.GetData();
            var rule = rulesList.Count > 0 ? rulesList[0] : null;
            if (rule == null)
            {
                return NotFound("No rules defined");
            }
            // Always use the inline Body stored in the dataset
            var body = rule.Body ?? string.Empty;
            // include CreatedAt if present on the dataset model
            object createdAt = null;
            try { createdAt = rule.CreatedAt; } catch { }
            try { Console.WriteLine($"[DEBUG] RulesController: returning rule id={rule.Id} title='{rule.Title}' bodyLength={(body==null?0:body.Length)}"); } catch {}
            return Ok(new { id = rule.Id, version = rule.Version, title = rule.Title, body = body, createdAt });
        }
    }
}
