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

            var token = _tokens.CreateUserToken(user.Id, user.isAdmin);

            return Ok(new AuthenticationResult(token, new AuthenticatedUserInformation()
            {
                Email = user.Email,
                Id = user.Id,
                IsAdmin = user.isAdmin,
                Name = user.Name
            }));

        }
    }
}
