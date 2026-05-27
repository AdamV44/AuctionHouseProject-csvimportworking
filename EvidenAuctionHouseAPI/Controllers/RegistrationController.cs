using dbLoader;
using EvidenAuctionHouseAPI.Models;
using EvidenAuctionHouseAPI.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using YamlDotNet.Core.Tokens;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegistrationController : ControllerBase
    {

        private readonly AuctionHouseDatabase myDb;
        private readonly EvidenAuctionHouseAPI.Services.RegistrationService _registrationService;
        private readonly EvidenAuctionHouseAPI.Services.IEmailService _emailService;
        public RegistrationController(AuctionHouseDatabase db, EvidenAuctionHouseAPI.Services.RegistrationService registrationService, EvidenAuctionHouseAPI.Services.IEmailService emailService)
        {
            this.myDb = db;
            this._registrationService = registrationService;
            this._emailService = emailService;
        }

        [HttpPost("register-submit")]
        public IActionResult SubmitRegisterForm(RegistrationInformation info)
        {
            var regService = _registrationService;
            if (this.myDb.Users.Find(u => u.Email == info.Email) != null)
            {
                return BadRequest("Email is already registered");
            }
            if (this.myDb.Users.Find(u => u.Name == info.Name) != null)
            {
                return BadRequest("Name is already registered");
            }

            var token = regService.SubmitRegistrationForm(info);

            var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
            var confirmUrl = $"{baseUrl}/api/Registration/confirm-email/{token}";

            _emailService.SendEmailVerification(info.Email, confirmUrl);

            return Ok(new { message = "Registration submitted, verification email sent" });
        }

        [HttpGet("confirm-email/{token}")]

        public IActionResult ConfirmEmail(string token)
        {
            var service = _registrationService;
            if (service.ConfirmEmail(token))
            {
                this.myDb.Users.Add(service.CreateUser(service.GetAttemptFromToken(token)));
                return Ok(new { message = "Email confirmed successfully" });
            }
            else
            {
                return BadRequest("Invalid token");
            }

        }
    }
}
