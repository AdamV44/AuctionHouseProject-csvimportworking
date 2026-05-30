using dbLoader;
using dbLoader.Models;
using EvidenAuctionHouseAPI.Models;
using JWT.Algorithms;
using JWT.Builder;
using System.Reflection.PortableExecutable;
using System.Text.Json;
namespace EvidenAuctionHouseAPI.Services
{
    public class TokensService
    {
        // Defaults kept for backwards-compatibility. Prefer setting the following
        // environment variables in dev/production instead of changing source:
        // - EVIDEN_USER_TOKEN_SECRET
        // - EVIDEN_EMAIL_TOKEN_SECRET
        private readonly string USERSPASSWORD;
        private readonly string EMAILSPASSWORD;

        public TokensService()
        {
            USERSPASSWORD = Environment.GetEnvironmentVariable("EVIDEN_USER_TOKEN_SECRET") ?? "GGALKANE";
            EMAILSPASSWORD = Environment.GetEnvironmentVariable("EVIDEN_EMAIL_TOKEN_SECRET") ?? "NEJSMECOOKED";
        }

        private AuctionHouseDatabase db;
        public string CreateUserToken(string userId, bool isAdmin)
        {
            return JwtBuilder.Create()
                .WithAlgorithm(new HMACSHA256Algorithm())
                .WithSecret(USERSPASSWORD)
                .AddClaim("exp", DateTimeOffset.UtcNow.AddDays(1).ToUnixTimeSeconds())
                .AddClaim("userId", userId)
                .AddClaim("isAdmin", isAdmin)
                .Encode();
        }
        public string CreateEmailConfirmationToken()
        {
            return JwtBuilder.Create()
                .WithAlgorithm(new HMACSHA256Algorithm())
                .WithSecret(EMAILSPASSWORD)
                .AddClaim("exp", DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds())
                .Encode();
        }
        public string GetUserId(string header)
        {
            try
            {
                if (header == null)
                {
                    return null;
                }
                string[] parts = header.Split(' ');
                if (parts.Length != 2)
                {
                    return null;
                }
                var payload = JwtBuilder.Create()
                            .WithAlgorithm(new HMACSHA256Algorithm())
                            .WithSecret(USERSPASSWORD)
                            .MustVerifySignature()
                            .Decode<IDictionary<string, object>>(parts[1]);

                JsonElement userId = (JsonElement)payload["userId"];
                return userId.ToString();
            }
            catch
            {
                return null;
            }
        }

        public bool VerifyEmail(string token)
        {
            try
            {
                var payload = JwtBuilder.Create()
                            .WithAlgorithm(new HMACSHA256Algorithm())
                            .WithSecret(EMAILSPASSWORD)
                            .MustVerifySignature()
                            .Decode<IDictionary<string, object>>(token);
                return true;
            }
            catch
            {
                return false;
            }
        }


        public bool VerifyUser(string header)
        {
            try
            {
                if (header == null)
                {
                    return false;
                }
                string[] parts = header.Split(' ');
                if (parts.Length != 2)
                {
                    return false;
                }
                var payload = JwtBuilder.Create()
                            .WithAlgorithm(new HMACSHA256Algorithm())
                            .WithSecret(USERSPASSWORD)
                            .MustVerifySignature()
                            .Decode<IDictionary<string, object>>(parts[1]);

                JsonElement userId = (JsonElement)payload["userId"];
                if (userId.ToString() == null)
                {
                    return false;
                }
                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool VerifyAdmin(string header)
        {
            try
            {
                if (header == null)
                {
                    return false;
                }
                string[] parts = header.Split(' ');
                if (parts.Length != 2)
                {
                    return false;
                }
                var payload = JwtBuilder.Create()
                            .WithAlgorithm(new HMACSHA256Algorithm())
                            .WithSecret(USERSPASSWORD)
                            .MustVerifySignature()
                            .Decode<IDictionary<string, object>>(parts[1]);

                JsonElement userId = (JsonElement)payload["userId"];
                JsonElement isAdmin = (JsonElement)payload["isAdmin"];
                if (userId.ToString() == null)
                {
                    return false;
                }
                if (!isAdmin.GetBoolean())
                {
                    return false;
                }
                return true;
            }
            catch
            {
                return false;
            }
        }

        // Create a one-time token tied to a contract and user. Use EMAILSPASSWORD so tokens for email/one-time purposes
        // are separate from user access tokens.
        public string CreateContractToken(string contractId, string userId, TimeSpan lifetime)
        {
            return JwtBuilder.Create()
                .WithAlgorithm(new HMACSHA256Algorithm())
                .WithSecret(EMAILSPASSWORD)
                .AddClaim("exp", DateTimeOffset.UtcNow.Add(lifetime).ToUnixTimeSeconds())
                .AddClaim("contractId", contractId)
                .AddClaim("userId", userId)
                .Encode();
        }

        // Verify a contract token and extract contractId/userId if valid. Returns true when valid.
        public bool VerifyContractToken(string token, out string contractId, out string userId)
        {
            contractId = null;
            userId = null;
            try
            {
                var payload = JwtBuilder.Create()
                            .WithAlgorithm(new HMACSHA256Algorithm())
                            .WithSecret(EMAILSPASSWORD)
                            .MustVerifySignature()
                            .Decode<IDictionary<string, object>>(token);

                if (payload.ContainsKey("contractId"))
                {
                    contractId = payload["contractId"].ToString();
                }
                if (payload.ContainsKey("userId"))
                {
                    userId = payload["userId"].ToString();
                }

                return !string.IsNullOrEmpty(contractId) && !string.IsNullOrEmpty(userId);
            }
            catch
            {
                return false;
            }
        }

    }
}
