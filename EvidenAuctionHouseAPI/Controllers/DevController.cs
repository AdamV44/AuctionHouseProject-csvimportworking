using dbLoader;
using EvidenAuctionHouseAPI.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DevController : ControllerBase
    {
        private readonly AuctionHouseDatabase _db;
        private readonly IWebHostEnvironment _env;
    private readonly TokensService _tokens;

        public DevController(AuctionHouseDatabase db, IWebHostEnvironment env, TokensService tokens)
        {
            _db = db;
            _env = env;
            _tokens = tokens;
        }

        // Dev-only helper: return a signed user token for a given userId
        // Only available when ASPNETCORE_ENVIRONMENT=Development
        [HttpGet("token/{userId}")]
        public IActionResult TokenForUser(string userId)
        {
            if (!_env.IsDevelopment())
            {
                return NotFound(); // hide in non-dev environments
            }

            var user = _db.Users.Find(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "user not found" });
            }

            var token = _tokens.CreateUserToken(user.Id, user.isAdmin);
            return Ok(new { token, user = new { user.Id, user.Name, user.Email, user.isAdmin } });
        }

        // Dev-only helper: create a refresh token cookie and return access token
        [HttpPost("impersonate/{userId}")]
        public IActionResult Impersonate(string userId)
        {
            if (!_env.IsDevelopment()) return NotFound();
            var user = _db.Users.Find(u => u.Id == userId);
            if (user == null) return NotFound(new { message = "user not found" });
            var token = _tokens.CreateUserToken(user.Id, user.isAdmin);
            // create refresh token and set HttpOnly cookie
            var refreshSvc = HttpContext.RequestServices.GetService(typeof(EvidenAuctionHouseAPI.Services.RefreshTokenService)) as EvidenAuctionHouseAPI.Services.RefreshTokenService;
            if (refreshSvc != null)
            {
                var (id, rt) = refreshSvc.Create(user.Id, TimeSpan.FromDays(30));
                var cookieVal = System.Net.WebUtility.UrlEncode(id + ":" + rt);
                Response.Cookies.Append("refresh_token", cookieVal, new Microsoft.AspNetCore.Http.CookieOptions {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = Microsoft.AspNetCore.Http.SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddDays(30),
                    Path = "/"
                });
            }

            return Ok(new { token, user = new { user.Id, user.Name, user.Email, user.isAdmin } });
        }
    }
}
