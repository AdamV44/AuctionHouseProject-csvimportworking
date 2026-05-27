using DataHandler.Models;
using dbLoader;
using dbLoader.Models;
using EvidenAuctionHouseAPI.Attributes;
using EvidenAuctionHouseAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuctionsController : ControllerBase
    {
        private readonly EvidenAuctionHouseAPI.Services.AuctionFinalizationWorker finalizationWorker;

        public AuctionsController(AuctionHouseDatabase db, EvidenAuctionHouseAPI.Services.AuctionFinalizationWorker finalizationWorker)
        {
            this.myDb = db;
            this.finalizationWorker = finalizationWorker;
        }

        private AuctionHouseDatabase myDb;

        [SecuredAdmin]
        [HttpGet("get")]
        public ObjectResult GetAuctions()
        {
            return Ok(this.myDb.Auctions.GetData());
        }

        [SecuredUser]
        [HttpGet("get-active")]
        public ObjectResult GetActiveAuctions()
        {
            // Use UTC comparison because auction StartDate/EndDate are stored as UTC (ISO Z) and DateTime.Now is local.
            var nowUtc = DateTime.UtcNow;
            return Ok(this.myDb.Auctions.Where(a => a.IsActive && a.StartDate <= nowUtc && a.EndDate >= nowUtc));
        }



        [SecuredUser]
        [HttpGet("get/{id}")]
        public ObjectResult GetAuctionByID(string id)
        {
            Auction? a = this.myDb.Auctions.Where(auction => auction.Id == id).FirstOrDefault();

            if (a == null)
            {
                return BadRequest($"Auction with id: {id} doesn't exist");
            }

            return Ok(a);
        }

        [SecuredAdmin]
        [HttpPost("create")]
        public IActionResult CreateAuction(AuctionCreationDTO info)
        {
            this.myDb.Auctions.Add(info.Auction);
            List<AuctionItem> items = this.myDb.AuctionItems.Where(i => info.AuctionItemsIds.Contains(i.Id)).ToList();
            foreach (var item in info.AuctionItemsIds)
            {
                var auctionItem = this.myDb.AuctionItems.Find(auctionItem => auctionItem.Id == item);
                auctionItem.AuctionId = info.Auction.Id;
            }
            this.myDb.AuctionItems.SaveChanges();
            return Ok(new { message = "Auction created successfully" });

        }

        // DEBUG endpoint: create auction without admin auth to validate persistence
        [HttpPost("debug/create-noauth")]
        public IActionResult DebugCreateNoAuth(AuctionCreationDTO info)
        {
            try
            {
                Console.WriteLine("[AuctionsController] DebugCreateNoAuth called");
                Console.WriteLine($"[AuctionsController] Incoming auction name={info?.Auction?.Name}");
                this.myDb.Auctions.Add(info.Auction);
                // attach items if any
                if (info.AuctionItemsIds != null && info.AuctionItemsIds.Length > 0)
                {
                    foreach (var itemId in info.AuctionItemsIds)
                    {
                        var auctionItem = this.myDb.AuctionItems.Find(ai => ai.Id == itemId);
                        if (auctionItem != null)
                        {
                            auctionItem.AuctionId = info.Auction.Id;
                        }
                    }
                    this.myDb.AuctionItems.SaveChanges();
                }
                var count = this.myDb.Auctions.GetData().Count;
                Console.WriteLine($"[AuctionsController] Debug added. Current count={count}. AssetsPath={this.myDb.Auctions.AssetsPath}");
                return Ok(new { ok = true, count });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuctionsController] Debug error: {ex}");
                return StatusCode(500, new { message = "debug failed", error = ex.Message });
            }
        }

        [HttpGet("debug/list")]
        public IActionResult DebugList()
        {
            try
            {
                var data = this.myDb.Auctions.GetData();
                return Ok(new { count = data.Count, items = data.Take(10) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "failed to list", error = ex.Message });
            }
        }

        [SecuredAdmin]
        [HttpGet("report/{auctionId}")]
        public IActionResult GetAuctionReport(string auctionId)
        {
            try
            {
                // If a report was previously generated and stored, return it
                var stored = this.myDb.Reports.Find(r => r.AuctionId == auctionId);
                if (stored != null)
                {
                    // build DTO from stored report
                    var dto = new EvidenAuctionHouseAPI.Models.AuctionReportDTO
                    {
                        AuctionId = stored.AuctionId,
                        AuctionName = stored.AuctionName,
                        TotalRevenue = (int)stored.TotalRevenue
                    };
                    foreach (var sid in stored.SoldItemIds)
                    {
                        var sold = this.myDb.SoldItems.Find(s => s.Id == sid);
                        if (sold != null)
                        {
                            dto.SoldItems.Add(new EvidenAuctionHouseAPI.Models.SoldItemDTO
                            {
                                Id = sold.AuctionItemId,
                                Name = sold.Name,
                                FinalPrice = (int)sold.FinalPrice,
                                WinnerFullName = sold.WinnerFullName,
                                WinnerEmail = sold.WinnerEmail
                            });
                        }
                    }
                    // include pseudonym map when present
                    if (stored.PseudonymMap != null)
                    {
                        dto.PseudonymMap = new Dictionary<string, string>(stored.PseudonymMap);
                    }
                    foreach (var uid in stored.UnsoldItemIds)
                    {
                        var item = this.myDb.AuctionItems.Find(i => i.Id == uid);
                        if (item != null)
                        {
                            dto.UnsoldItems.Add(new { Id = item.Id, Name = item.Name, StartingPrice = item.StartingPrice });
                        }
                    }
                    return Ok(dto);
                }

                var auction = this.myDb.Auctions.Find(a => a.Id == auctionId);
                if (auction == null) return BadRequest("Unknown auction id: " + auctionId);

                var items = this.myDb.AuctionItems.Where(i => i.AuctionId == auctionId).ToList();
                var report = new EvidenAuctionHouseAPI.Models.AuctionReportDTO
                {
                    AuctionId = auction.Id,
                    AuctionName = auction.Name
                };

                var generatedReport = new DataHandler.Models.AuctionReport
                {
                    AuctionId = auction.Id,
                    AuctionName = auction.Name,
                };

                foreach (var item in items)
                {
                    var bids = this.myDb.Bids.Where(b => b.AuctionItemId == item.Id).ToList();
                    if (bids != null && bids.Count > 0)
                    {
                        var final = bids.Aggregate(item.StartingPrice, (acc, b) => acc + b.AmountAdded);
                        var lastBid = bids.OrderByDescending(b => b.CreatedAt).First();
                        var winner = this.myDb.Users.Find(u => u.Id == lastBid.UserId);
                        var winnerName = winner != null ? winner.Name : "";
                        var winnerEmail = winner != null ? winner.Email : "";
                        // admin-only endpoint: include full winner info
                        report.SoldItems.Add(new EvidenAuctionHouseAPI.Models.SoldItemDTO
                        {
                            Id = item.Id,
                            Name = item.Name,
                            FinalPrice = (int)final,
                            WinnerFullName = winnerName,
                            WinnerEmail = winnerEmail
                        });

                        // create sold item record
                        var soldItem = new DataHandler.Models.SoldItem
                        {
                            AuctionItemId = item.Id,
                            AuctionId = auctionId,
                            Name = item.Name,
                            FinalPrice = final,
                            WinnerUserId = lastBid.UserId,
                            WinnerFullName = winner != null ? winner.Name : "",
                            WinnerEmail = winner != null ? winner.Email : ""
                        };
                        this.myDb.SoldItems.Add(soldItem);
                        generatedReport.SoldItemIds.Add(soldItem.Id);

                        report.TotalRevenue += (int)final;
                    }
                    else
                    {
                        report.UnsoldItems.Add(new { Id = item.Id, Name = item.Name, StartingPrice = item.StartingPrice });
                        generatedReport.UnsoldItemIds.Add(item.Id);
                    }
                }

                generatedReport.TotalRevenue = report.TotalRevenue;
                // include pseudonym map when present
                if (generatedReport.PseudonymMap != null)
                {
                    report.PseudonymMap = new Dictionary<string, string>(generatedReport.PseudonymMap);
                }
                this.myDb.Reports.Add(generatedReport);

                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "failed to build report", error = ex.Message });
            }
        }

        [SecuredAdmin]
        [HttpPost("finalize/{auctionId}")]
        public IActionResult FinalizeAuction(string auctionId, [FromQuery] bool dryRun = false)
        {
            try
            {
                var auction = this.myDb.Auctions.Find(a => a.Id == auctionId);
                if (auction == null) return BadRequest("Unknown auction id: " + auctionId);

                // call finalization worker to build and (optionally) persist report and sold items
                if (!this.finalizationWorker.GenerateAndPersistReport(auctionId, out var dto, out var error, dryRun))
                {
                    return StatusCode(500, new { message = "failed to generate report", error });
                }

                // Optionally: mark auction as finished or remove from active list - here we keep auction records but clients should filter by EndDate

                if (dryRun)
                {
                    return Ok(new { ok = true, message = "Dry-run: auction report generated but not stored", report = dto });
                }

                return Ok(new { ok = true, message = "Auction finalized and report stored" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "failed to finalize auction", error = ex.Message });
            }
        }

        [SecuredAdmin]
        [HttpGet("report-exists/{auctionId}")]
        public IActionResult ReportExists(string auctionId)
        {
            try
            {
                var stored = this.myDb.Reports.Find(r => r.AuctionId == auctionId);
                bool exists = stored != null;
                return Ok(new { exists });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "failed to check report existence", error = ex.Message });
            }
        }

        [SecuredAdmin]
        [HttpPost("edit/{auctionId}")]
        public IActionResult EditAuction(AuctionCreationDTO info, string auctionId)
        {
            foreach (var item in this.myDb.AuctionItems.Where(item => item.AuctionId == auctionId))
            {
                item.AuctionId = "";
            }
            foreach (var item in this.myDb.AuctionItems.Where(item => info.AuctionItemsIds.Contains(item.Id)))
            {
                item.AuctionId = auctionId;
            }
            this.myDb.Auctions.Update(info.Auction, auctionId);
            this.myDb.AuctionItems.SaveChanges();
            return Ok(new { message = "Auction edited successfully" });
        }

        [SecuredAdmin]
        [HttpDelete("delete/{id}")]
        public IActionResult DeleteAuction(string id)
        {
            var auction = this.myDb.Auctions.Find(auction => auction.Id == id);
            if (auction == null)
            {
                return BadRequest("Unknown auction id: " + id);
            }

            foreach (var item in this.myDb.AuctionItems)
            {
                if (item.AuctionId == id)
                {
                    item.AuctionId = "";
                }
            }
            this.myDb.Auctions.RemoveById(id);
            return Ok(new { message = "Auction deleted successfully" });
        }

        [SecuredUser]
        [HttpGet("get-items/{auctionId}")]
        public ObjectResult GetItemsForAuctionById(string auctionId)
        {
            List<AuctionItem> result = new List<AuctionItem>(); 

            return Ok(this.myDb.AuctionItems.Where(item => item.AuctionId == auctionId).ToList());
        }

    }
}
