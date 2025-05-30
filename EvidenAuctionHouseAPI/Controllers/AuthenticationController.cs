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
        public AuthenticationController(AuctionHouseDatabase db)
        {
            this.myDb = db;
        }

        private AuctionHouseDatabase myDb;

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

            TokensService t = new TokensService();

            var token = t.CreateUserToken(user.Id, user.isAdmin);

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
