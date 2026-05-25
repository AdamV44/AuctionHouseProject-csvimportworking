using dbLoader;
using Microsoft.AspNetCore.Mvc;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private AuctionHouseDatabase db;
        public AdminController(AuctionHouseDatabase db)
        {
            this.db = db;
        }

        [HttpGet("config")] 
        public IActionResult GetConfig()
        {
            try
            {
                bool allowAdminExport = true;
                try { allowAdminExport = this.db.configReader.GetGDPRAllowAdminExport(); } catch { allowAdminExport = true; }
                return Ok(new { allowAdminExport });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "failed to read config", error = ex.Message });
            }
        }
    }
}
