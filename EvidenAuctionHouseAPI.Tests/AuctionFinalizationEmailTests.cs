using System;
using System.IO;
using Xunit;
using dbLoader;
using EvidenAuctionHouseAPI.Services;
using EvidenAuctionHouseAPI.Models;
using dbLoader.Models;
using DataHandler.Models;
using System.Linq;

namespace EvidenAuctionHouseAPI.Tests
{
    public class AuctionFinalizationEmailTests : IDisposable
    {
        private readonly string tempDbPath;
        private readonly AuctionHouseDatabase db;

        public AuctionFinalizationEmailTests()
        {
            string repoDatabasePath = null;
            var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
            for (int i = 0; i < 8; i++)
            {
                var candidate = Path.Combine(dir.FullName, "Database");
                if (Directory.Exists(candidate))
                {
                    repoDatabasePath = candidate;
                    break;
                }
                if (dir.Parent == null) break;
                dir = dir.Parent;
            }
            if (repoDatabasePath == null) throw new Exception("Could not locate Database folder in repository tree");

            tempDbPath = Path.Combine(Path.GetTempPath(), "eh_testdb_" + Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempDbPath);
            CopyDirectory(repoDatabasePath, tempDbPath);

            db = new AuctionHouseDatabase(Path.Combine(tempDbPath, "config.yml"), tempDbPath);
        }

        [Fact]
        public void DryRun_DoesNotSendEmails()
        {
            // arrange
            var auction = new Auction { Name = "T1", StartDate = DateTime.Now.AddDays(-1), EndDate = DateTime.Now.AddHours(-1), IsActive = true };
            db.Auctions.Add(auction);
            var user = new User { Name = "U1", Email = "u1@ex.com" };
            db.Users.Add(user);
            var item = new AuctionItem { Name = "I1", StartingPrice = 10, AuctionId = auction.Id };
            db.AuctionItems.Add(item);
            var bid = new Bid { AuctionItemId = item.Id, UserId = user.Id, AmountAdded = 20, CreatedAt = DateTime.Now.AddMinutes(-5) };
            db.Bids.Add(bid);

            var mock = new SimpleEmailMock();
            var svc = new AuctionFinalizationWorker(db, mock);

            // act
            var ok = svc.GenerateAndPersistReport(auction.Id, out var dto, out var error, dryRun: true);

            // assert
            Assert.True(ok, error);
            Assert.Single(dto.SoldItems);
            Assert.Equal(0, mock.WinnerNotifications);
            Assert.Equal(0, mock.AdminNotifications);
        }

        [Fact]
        public void RealRun_SendsEmails()
        {
            // arrange
            var auction = new Auction { Name = "T2", StartDate = DateTime.Now.AddDays(-1), EndDate = DateTime.Now.AddHours(-1), IsActive = true };
            db.Auctions.Add(auction);
            var user = new User { Name = "U2", Email = "u2@ex.com" };
            db.Users.Add(user);
            var item = new AuctionItem { Name = "I2", StartingPrice = 50, AuctionId = auction.Id };
            db.AuctionItems.Add(item);
            var bid = new Bid { AuctionItemId = item.Id, UserId = user.Id, AmountAdded = 30, CreatedAt = DateTime.Now.AddMinutes(-5) };
            db.Bids.Add(bid);

            var mock = new SimpleEmailMock();
            var svc = new AuctionFinalizationWorker(db, mock);

            // ensure env admin email
            Environment.SetEnvironmentVariable("ADMIN_EMAIL", "admin@ex.com");

            // act
            var ok = svc.GenerateAndPersistReport(auction.Id, out var dto, out var error, dryRun: false);

            // assert
            Assert.True(ok, error);
            Assert.Single(dto.SoldItems);
            // mock should have recorded one winner and one admin notification
            Assert.Equal(1, mock.WinnerNotifications);
            Assert.Equal(1, mock.AdminNotifications);
        }

        private void CopyDirectory(string sourceDir, string targetDir)
        {
            foreach (var dirPath in Directory.GetDirectories(sourceDir, "*", SearchOption.AllDirectories))
            {
                Directory.CreateDirectory(dirPath.Replace(sourceDir, targetDir));
            }

            foreach (var newPath in Directory.GetFiles(sourceDir, "*.*", SearchOption.AllDirectories))
            {
                File.Copy(newPath, newPath.Replace(sourceDir, targetDir));
            }
        }

        public void Dispose()
        {
            try { if (Directory.Exists(tempDbPath)) Directory.Delete(tempDbPath, true); } catch { }
        }

        // Simple in-test mock that records calls
        private class SimpleEmailMock       : IEmailService      
        {
            public int WinnerNotifications { get; private set; } = 0;
            public int AdminNotifications { get; private set; } = 0;

            public bool SendEmail(string to, string subject, string body)
            {
                return true;
            }

            public bool SendWinnerNotification(string toEmail, string winnerName, string itemName, int finalPrice, string auctionName)
            {
                WinnerNotifications++;
                return true;
            }

            public bool SendAdminNotification(string adminEmail, AuctionReportDTO report)
            {
                AdminNotifications++;
                return true;
            }

            public void SendEmailVerification(string receiver, string endpointUrl)
            {
                // not used in these tests
            }
        }
    }
}
