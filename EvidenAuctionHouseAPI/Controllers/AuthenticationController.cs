using BCrypt.Net;
using dbLoader;
using dbLoader.Models;
using EvidenAuctionHouseAPI.Models;
using EvidenAuctionHouseAPI.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly AuctionHouseDatabase myDb;
        private readonly TokensService _tokens;

        public AuthenticationController(AuctionHouseDatabase db, TokensService tokens)
        {
            this.myDb = db;
            this._tokens = tokens;
        }

        [HttpPost("login")]
        public IActionResult Login(Credentials c)
        {
            var user = this.myDb.Users.Find(u => u.Email == c.Email);
            if (user == null)
            {
                return NotFound($"User with email {c.Email} not found");
            }
            if (!BCrypt.Net.BCrypt.EnhancedVerify(c.Password, user.PasswordHash))
            {
                return StatusCode(403, "Incorrect password");
            }

            var accessToken = _tokens.CreateUserToken(user.Id, user.isAdmin);

            // create refresh token and set HttpOnly cookie
            var refreshSvc = HttpContext.RequestServices.GetService(typeof(EvidenAuctionHouseAPI.Services.RefreshTokenService)) as EvidenAuctionHouseAPI.Services.RefreshTokenService;
            if (refreshSvc != null)
            {
                var (id, token) = refreshSvc.Create(user.Id, TimeSpan.FromDays(30));
                // cookie value will be id:token
                var cookieVal = System.Net.WebUtility.UrlEncode(id + ":" + token);
                Response.Cookies.Append("refresh_token", cookieVal, new CookieOptions {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddDays(30),
                    Path = "/"
                });
            }

            return Ok(new AuthenticationResult(accessToken, new AuthenticatedUserInformation()
            {
                Email = user.Email,
                Id = user.Id,
                IsAdmin = user.isAdmin,
                Name = user.Name
            }));

    }

    [HttpPost("refresh")]
        public IActionResult Refresh()
        {
            try
            {
                if (!Request.Cookies.ContainsKey("refresh_token")) return Unauthorized("no refresh token");
                var cookie = Request.Cookies["refresh_token"];
                var decoded = System.Net.WebUtility.UrlDecode(cookie);
                var parts = decoded.Split(':');
                if (parts.Length != 2) return Unauthorized("invalid cookie");
                var id = parts[0];
                var token = parts[1];
                var refreshSvc = HttpContext.RequestServices.GetService(typeof(EvidenAuctionHouseAPI.Services.RefreshTokenService)) as EvidenAuctionHouseAPI.Services.RefreshTokenService;
                if (refreshSvc == null) return StatusCode(500, "refresh service not available");
                var userId = refreshSvc.Validate(id, token);
                if (userId == null) return Unauthorized("invalid refresh");
                var user = this.myDb.Users.Find(u => u.Id == userId);
                if (user == null) return Unauthorized("unknown user");
                // issue new access token
                var newAccess = _tokens.CreateUserToken(user.Id, user.isAdmin);
                return Ok(new { accessToken = newAccess, user = new AuthenticatedUserInformation { Email = user.Email, Id = user.Id, IsAdmin = user.isAdmin, Name = user.Name } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "refresh failed", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            try
            {
                if (Request.Cookies.ContainsKey("refresh_token"))
                {
                    var cookie = Request.Cookies["refresh_token"];
                    var decoded = System.Net.WebUtility.UrlDecode(cookie);
                    var parts = decoded.Split(':');
                    if (parts.Length == 2)
                    {
                        var id = parts[0];
                        var refreshSvc = HttpContext.RequestServices.GetService(typeof(EvidenAuctionHouseAPI.Services.RefreshTokenService)) as EvidenAuctionHouseAPI.Services.RefreshTokenService;
                        refreshSvc?.Revoke(id);
                    }
                }
                // expire cookie
                Response.Cookies.Append("refresh_token", "", new CookieOptions { Expires = DateTimeOffset.UtcNow.AddDays(-1), HttpOnly = true, Secure = true, SameSite = SameSiteMode.None, Path = "/" });
                return Ok(new { ok = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "logout failed", error = ex.Message });
            }
        }
    }
}
