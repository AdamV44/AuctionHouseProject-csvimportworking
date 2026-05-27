using EvidenAuctionHouseAPI.Models;

namespace EvidenAuctionHouseAPI.Services
{
    public interface IEmailService
    {
        // low-level send
        bool SendEmail(string to, string subject, string body);

        // convenience methods
        bool SendWinnerNotification(string toEmail, string winnerName, string itemName, int finalPrice, string auctionName);
        bool SendAdminNotification(string adminEmail, AuctionReportDTO report);
    // verification email during registration
    void SendEmailVerification(string receiver, string endpointUrl);
    }
}
