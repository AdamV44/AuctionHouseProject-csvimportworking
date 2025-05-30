using System.Net;
using System.Net.Mail;
using System.Security.Cryptography.X509Certificates;

namespace EvidenAuctionHouseAPI.Services
{
    public class EmailService
    {
        private readonly string smtpServer;
        private readonly int smtpPort;
        private readonly string smtpUser;
        private readonly string smtpPassword;

        private const string subject = "Potvrzení registrace aukce";
        private const string body = "Kliknutím na odkaz potvrdíte registraci ";
        public EmailService(string smtpServer, int smtpPort, string smtpUser, string smtpPass)
        {
            this.smtpServer = smtpServer;
            this.smtpPort = smtpPort;
            this.smtpUser = smtpUser;
            this.smtpPassword = smtpPass;
        }
        public void SendEmailVerification(string reciever, string endpointUrl)
        {

            var smtp = new SmtpClient
            {
                Host = this.smtpServer,       
                Port = 587,                    
                EnableSsl = true,              
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(this.smtpUser, this.smtpPassword)
            };

            using (var message = new MailMessage(this.smtpUser, reciever)
            {
                Subject = subject,
                Body = body + endpointUrl
            })
            {
                try
                {
                    smtp.Send(message);
                    Console.WriteLine("E-mail byl úspěšně odeslán.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Chyba při odesílání e-mailu: " + ex.Message);
                }
            }
        }
    }
}
