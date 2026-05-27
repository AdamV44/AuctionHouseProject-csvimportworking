namespace EvidenAuctionHouseAPI.Models
{
    public class AuthenticatedUserInformation
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public bool IsAdmin { get; set; }
        public bool AcceptedRules { get; set; }
        public DateTime? AcceptedRulesAt { get; set; }
        public string? AcceptedRulesVersion { get; set; }

    }
}
