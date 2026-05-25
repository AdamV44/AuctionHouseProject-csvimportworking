using System;
using System.IO;
using Xunit;
using dbLoader;
using EvidenAuctionHouseAPI.Services;
using dbLoader.Models;
using DataHandler.Models;
using System.Linq;

namespace EvidenAuctionHouseAPI.Tests
{
    public class AuctionFinalizationServiceTests : IDisposable
    {
        private readonly string tempDbPath;
        private readonly AuctionHouseDatabase db;

        public AuctionFinalizationServiceTests()
        {
            // locate repo Database folder by walking up parent directories
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

            // create a temp copy of the Database folder to avoid modifying real test data
            tempDbPath = Path.Combine(Path.GetTempPath(), "eh_testdb_" + Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempDbPath);
            CopyDirectory(repoDatabasePath, tempDbPath);

            // construct AuctionHouseDatabase pointing to tempDB
            db = new AuctionHouseDatabase(Path.Combine(tempDbPath, "config.yml"), tempDbPath);
        }

        [Fact]
        public void WinnerSelection_LastBidWins()
        {
            // arrange: create auction, users, item, bids
            var auction = new Auction { Name = "Tst", StartDate = DateTime.Now.AddDays(-1), EndDate = DateTime.Now.AddHours(-1), IsActive = true };
            db.Auctions.Add(auction);

            var user1 = new User { Name = "Alice", Email = "a@ex.com" };
            var user2 = new User { Name = "Bob", Email = "b@ex.com" };
            db.Users.Add(user1);
            db.Users.Add(user2);

            var item = new AuctionItem { Name = "Itm", StartingPrice = 100, AuctionId = auction.Id };
            db.AuctionItems.Add(item);

            var bid1 = new Bid { AuctionItemId = item.Id, UserId = user1.Id, AmountAdded = 50, CreatedAt = DateTime.Now.AddMinutes(-30) };
            var bid2 = new Bid { AuctionItemId = item.Id, UserId = user2.Id, AmountAdded = 25, CreatedAt = DateTime.Now.AddMinutes(-10) };
            db.Bids.Add(bid1);
            db.Bids.Add(bid2);

            // act
            var svc = new AuctionFinalizationWorker(db);
            var ok = svc.GenerateAndPersistReport(auction.Id, out var dto, out var error);

            // assert
            Assert.True(ok, error);
            Assert.Single(dto.SoldItems);
            var sold = dto.SoldItems.First();
            Assert.Equal(item.Id, sold.Id);
            // last bid user2 should be winner
            Assert.Contains("Bob", sold.WinnerFullName);
        }

        [Fact]
        public void Idempotence_SecondCallReturnsExistingReport()
        {
            // arrange: create auction with a single bid
            var auction = new Auction { Name = "Tst2", StartDate = DateTime.Now.AddDays(-1), EndDate = DateTime.Now.AddHours(-1), IsActive = true };
            db.Auctions.Add(auction);
            var user = new User { Name = "Carol", Email = "c@ex.com" };
            db.Users.Add(user);
            var item = new AuctionItem { Name = "I2", StartingPrice = 20, AuctionId = auction.Id };
            db.AuctionItems.Add(item);
            var bid = new Bid { AuctionItemId = item.Id, UserId = user.Id, AmountAdded = 30, CreatedAt = DateTime.Now.AddMinutes(-5) };
            db.Bids.Add(bid);

            var svc = new AuctionFinalizationWorker(db);

            // first call
            var ok1 = svc.GenerateAndPersistReport(auction.Id, out var dto1, out var error1);
            Assert.True(ok1, error1);
            Assert.Single(dto1.SoldItems);

            // capture current Reports and SoldItems counts
            var reportsCount = db.Reports.GetData().Count;
            var soldCount = db.SoldItems.GetData().Count;

            // second call should not create duplicate sold items or reports
            var ok2 = svc.GenerateAndPersistReport(auction.Id, out var dto2, out var error2);
            Assert.True(ok2, error2);
            Assert.Equal(reportsCount, db.Reports.GetData().Count);
            Assert.Equal(soldCount, db.SoldItems.GetData().Count);
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
            try
            {
                if (Directory.Exists(tempDbPath)) Directory.Delete(tempDbPath, true);
            }
            catch { }
        }
    }
}
