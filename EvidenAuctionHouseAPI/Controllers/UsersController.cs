using dbLoader;
using dbLoader.Models;
using EvidenAuctionHouseAPI.Attributes;
using EvidenAuctionHouseAPI.Models;
using EvidenAuctionHouseAPI.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        public UsersController(AuctionHouseDatabase db)
        {
            this.myDb = db; 
        }

        private AuctionHouseDatabase myDb;


        [SecuredUser]
        [HttpGet("get/{userId}")]
        public ObjectResult GetUserById(string userId)
        {
            var user = this.myDb.Users.Find(user => user.Id == userId);
            if (user == null)
            {
                throw new Exception($"User with id: {userId} doesn't exist");
            }
            return Ok(user);
        }


        [SecuredAdmin]
        [HttpPost("create")]
        public IActionResult CreateUser(RegistrationInformation info)
        {
            User u = new User()
            {
                Email = info.Email,
                isAdmin = false,
                Name = info.Name,
                PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(info.Password)
            };
            this.myDb.Users.Add(u);
            return Ok(new { message = "User registered successfully" });
        }
        [SecuredUser]
        [HttpPost("change-password")]
        public IActionResult ChangePassword(PasswordChangeDTO info)
        {
            TokensService service = new TokensService();
            string header = this.Request.Headers["Authorization"];
            string userId = service.GetUserId(header);

            User user = this.myDb.Users.Find(user => user.Id == userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }
            if (!BCrypt.Net.BCrypt.EnhancedVerify(info.OldPassword, user.PasswordHash))
            {
                return Unauthorized("Wrong password");
            }
            User updatedUser = user;
            updatedUser.PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(info.NewPassword);

            this.myDb.Users.Update(updatedUser, info.UserId);
            return Ok(new { message = "Password changed successfully" });
        }

    }
}
