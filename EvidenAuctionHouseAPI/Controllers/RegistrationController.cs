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

        public RegistrationController(AuctionHouseDatabase db)
        {
            this.myDb = db;
        }
        private AuctionHouseDatabase myDb;

        [HttpPost("register-submit")]
        public IActionResult SubmitRegisterForm(RegistrationInformation info)
        {
            RegistrationService regService = new RegistrationService(this.myDb.RegisterAttemptsFilePath);
            var smtpConfig = this.myDb.configReader.GetSMTPConfig();
            EmailService emailService = new EmailService(smtpConfig.Server, smtpConfig.Port, smtpConfig.User, smtpConfig.Password);
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

            emailService.SendEmailVerification(info.Email, confirmUrl);

            return Ok(new { message = "Registration submitted, verification email sent" });
        }

        [HttpGet("confirm-email/{token}")]

        public IActionResult ConfirmEmail(string token)
        {
            RegistrationService service = new RegistrationService(this.myDb.RegisterAttemptsFilePath);
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
