using DataHandler;
using DataHandler.Models;
using dbLoader;
using dbLoader.Models;
using EvidenAuctionHouseAPI.Models;
using Newtonsoft.Json;
using System.Text.Json;

namespace EvidenAuctionHouseAPI.Services
{
    public class RegistrationService
    {

        private readonly string pendingUsersFilePath;
        private readonly TokensService _tokens;

        public RegistrationService(string pendingUsersFilePath, TokensService tokens)
        {
            this.pendingUsersFilePath = pendingUsersFilePath;
            this._tokens = tokens;
        }



        public User CreateUser(RegisterAttempt info)
        {
            return new User()
            {
                isAdmin = false,
                Email = info.Email,
                Id = "neco",
                Name = info.Name,
                PasswordHash = info.PasswordHash
            };

        }
        public RegisterAttempt GetAttemptFromToken(string token)
        {
            List<RegisterAttempt> attempts = IOHandler.LoadFromFile<RegisterAttempt>(this.pendingUsersFilePath);

            return attempts.Where(att => att.Token == token).FirstOrDefault();
        }

        public string SubmitRegistrationForm(RegistrationInformation info)
        {
            TokensService service = _tokens;
            List<RegisterAttempt> attempts = IOHandler.LoadFromFile<RegisterAttempt>(this.pendingUsersFilePath);

            RegisterAttempt attempt = new RegisterAttempt()
            {
                Id = Guid.NewGuid().ToString(),
                Email = info.Email,
                Name = info.Name,
                PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(info.Password),
                Token = service.CreateEmailConfirmationToken()
            };
            attempts.Add(attempt);

            IOHandler.SaveDataToFile(attempts, this.pendingUsersFilePath);

            return attempt.Token;
        }

        public bool ConfirmEmail(string token)
        {
            TokensService service = _tokens;
            List<RegisterAttempt> attempts = IOHandler.LoadFromFile<RegisterAttempt>(this.pendingUsersFilePath);
            RegisterAttempt attempt = attempts.Find(attempt => attempt.Token == token);
            if (attempt != null)
            {
                if (service.VerifyEmail(token))
                {
                    return true;
                }
            }
            return false;
        }
    }
}
