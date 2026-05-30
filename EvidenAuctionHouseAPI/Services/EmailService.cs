using System;
using System.Threading.Tasks;
using EvidenAuctionHouseAPI.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace EvidenAuctionHouseAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly string smtpHost;
        private readonly int smtpPort;
        private readonly string smtpUser;
        private readonly string smtpPass;
        private readonly string fromAddress;

        public EmailService()
        {
            smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? "localhost";
            smtpPort = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT"), out var p) ? p : 25;
            smtpUser = Environment.GetEnvironmentVariable("SMTP_USER") ?? string.Empty;
            smtpPass = Environment.GetEnvironmentVariable("SMTP_PASS") ?? string.Empty;
            fromAddress = Environment.GetEnvironmentVariable("SMTP_FROM") ?? "no-reply@example.com";
        }

    // keep synchronous contract but perform async send inside and wait - it's fine for small use
    public bool SendEmail(string to, string subject, string body)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(MailboxAddress.Parse(fromAddress));
                message.To.Add(MailboxAddress.Parse(to));
                message.Subject = subject;

                var builder = new BodyBuilder { TextBody = body };
                message.Body = builder.ToMessageBody();

                // run async client in a Task and wait - map exceptions to false
                var task = Task.Run(async () =>
                {
                    using var client = new SmtpClient();
                    try
                    {
                        // prefer STARTTLS when available
                        await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTlsWhenAvailable);

                        if (!string.IsNullOrEmpty(smtpUser))
                        {
                            await client.AuthenticateAsync(smtpUser, smtpPass);
                        }

                        await client.SendAsync(message);
                        await client.DisconnectAsync(true);
                    }
                    finally
                    {
                        client.Dispose();
                    }
                });

                task.GetAwaiter().GetResult();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService-MailKit] Failed to send email to {to}: {ex.Message}");
                return false;
            }
        }

        // HTML-capable send. Prefer HTML if htmlBody provided, otherwise falls back to text body.
        public bool SendEmail(string to, string subject, string textBody, string htmlBody)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(MailboxAddress.Parse(fromAddress));
                message.To.Add(MailboxAddress.Parse(to));
                message.Subject = subject;

                var builder = new BodyBuilder();
                builder.TextBody = textBody ?? string.Empty;
                if (!string.IsNullOrEmpty(htmlBody)) builder.HtmlBody = htmlBody;
                message.Body = builder.ToMessageBody();

                var task = Task.Run(async () =>
                {
                    using var client = new SmtpClient();
                    try
                    {
                        await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTlsWhenAvailable);
                        if (!string.IsNullOrEmpty(smtpUser)) await client.AuthenticateAsync(smtpUser, smtpPass);
                        await client.SendAsync(message);
                        await client.DisconnectAsync(true);
                    }
                    finally { client.Dispose(); }
                });

                task.GetAwaiter().GetResult();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService-MailKit] Failed to send email to {to}: {ex.Message}");
                return false;
            }
        }

        // Convenience helper for contract emails (HTML preferred)
        public bool SendContractEmail(string to, string subject, string plainText, string htmlBody)
        {
            return SendEmail(to, subject, plainText, htmlBody);
        }

        public bool SendWinnerNotification(string toEmail, string winnerName, string itemName, int finalPrice, string auctionName)
        {
            var subject = $"You won: {itemName} in {auctionName}";
            var body = $"Hello {winnerName},\n\nCongratulations — you won {itemName} for {finalPrice} in auction {auctionName}.\n\nPlease follow up with the administrator to complete pickup and paperwork.\n\nThanks.";
            return SendEmail(toEmail, subject, body);
        }

        public bool SendAdminNotification(string adminEmail, AuctionReportDTO report)
        {
            var subject = $"Auction {report.AuctionName} finalized: revenue {report.TotalRevenue}";
            var body = $"Auction {report.AuctionName} ({report.AuctionId}) finalized. Total revenue: {report.TotalRevenue}.\nSold items:\n";
            foreach (var s in report.SoldItems)
            {
                body += $"- {s.Name}: {s.FinalPrice} (winner: {s.WinnerFullName} {s.WinnerEmail})\n";
            }
            return SendEmail(adminEmail, subject, body);
        }

        public void SendEmailVerification(string receiver, string endpointUrl)
        {
            var subject = "Potvrzení registrace aukce";
            var body = "Kliknutím na odkaz potvrdíte registraci: " + endpointUrl;
            // best-effort send
            SendEmail(receiver, subject, body);
        }
    }
}
