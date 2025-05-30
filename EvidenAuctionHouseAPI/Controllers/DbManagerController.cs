using dbLoader;
using EvidenAuctionHouseAPI.Attributes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DbManagerController : ControllerBase
    {
        public DbManagerController(AuctionHouseDatabase db)
        {
            this.myDb = db;
        }

        private AuctionHouseDatabase myDb;


        [SecuredAdmin]
        [HttpGet("force-database-reload")]
        public IActionResult ReloadDatabase()
        {
            this.myDb.ReloadContext();
            return Ok("Database reloaded successfully");
        }
    }
}
