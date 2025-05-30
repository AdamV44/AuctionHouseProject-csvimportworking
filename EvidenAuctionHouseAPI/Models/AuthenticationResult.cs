using dbLoader.Models;

namespace EvidenAuctionHouseAPI.Models
{
    public class AuthenticationResult
    {
        public AuthenticationResult(string token, AuthenticatedUserInformation user)
        {
            this.Token = token;
            this.User = user;
        }
        public string Token { get; set; }
        public AuthenticatedUserInformation User { get; set; }
    }
}
