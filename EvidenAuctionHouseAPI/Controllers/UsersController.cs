using System;
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
        private readonly AuctionHouseDatabase myDb;
        private readonly TokensService _tokens;

        public UsersController(AuctionHouseDatabase db, TokensService tokens)
        {
            this.myDb = db;
            this._tokens = tokens;
        }


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
            string header = this.Request.Headers["Authorization"];
            string userId = _tokens.GetUserId(header);

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

        [SecuredUser]
        [HttpGet("me")]
        public IActionResult GetMyProfile()
        {
            string header = this.Request.Headers["Authorization"];
            string userId = _tokens.GetUserId(header);
            if (string.IsNullOrWhiteSpace(userId))
            {
                // token invalid or couldn't be decoded - return 401 so clients can attempt refresh
                return Unauthorized(new { message = "Unauthorized" });
            }
            User user = this.myDb.Users.Find(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("User not found");
            }
            return Ok(new {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                isAdmin = user.isAdmin,
                acceptedRules = user.AcceptedRules,
                acceptedRulesAt = user.AcceptedRulesAt,
                acceptedRulesVersion = user.AcceptedRulesVersion
            });
        }

        [SecuredUser]
        [HttpPost("accept-rules")]
        public IActionResult AcceptRules()
        {
            string header = this.Request.Headers["Authorization"];
            string userId = _tokens.GetUserId(header);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { message = "Unauthorized" });
            }
            User user = this.myDb.Users.Find(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("User not found");
            }
            // Read rules version from DB if available, otherwise fallback to environment or default
            string rulesVersion = "v1.0";
            try
            {
                var rulesList = this.myDb.Rules.GetData();
                if (rulesList != null && rulesList.Count > 0)
                {
                    // assume first entry is current; dataset is file-backed and intended for small set
                    rulesVersion = rulesList[0].Version ?? rulesVersion;
                }
                else
                {
                    rulesVersion = Environment.GetEnvironmentVariable("RULES_VERSION") ?? rulesVersion;
                }
            }
            catch
            {
                // fallback to environment/default
                rulesVersion = Environment.GetEnvironmentVariable("RULES_VERSION") ?? rulesVersion;
            }
            // idempotent set
            user.AcceptedRules = true;
            user.AcceptedRulesAt = DateTime.UtcNow;
            user.AcceptedRulesVersion = rulesVersion;

            this.myDb.Users.Update(user, user.Id);

            // Optional: write an audit log entry; RegisterAttempts dataset is not exposed here, so log to console
            try
            {
                Console.WriteLine($"[Audit] User {user.Id} accepted rules {rulesVersion} at {user.AcceptedRulesAt}");
            }
            catch
            {
                // ignore
            }

            return Ok(new { accepted = true, acceptedAt = user.AcceptedRulesAt, version = user.AcceptedRulesVersion });
        }

    }
}
