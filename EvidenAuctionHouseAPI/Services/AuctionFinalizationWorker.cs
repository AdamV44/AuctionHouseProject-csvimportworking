using dbLoader;
using DataHandler.Models;
using EvidenAuctionHouseAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Collections.Concurrent;

namespace EvidenAuctionHouseAPI.Services
{
    // Worker that encapsulates report generation and persistence logic
    public class AuctionFinalizationWorker
    {
        private readonly AuctionHouseDatabase db;
        // simple in-memory per-auction locks to avoid concurrent finalization of the same auction
        private static readonly ConcurrentDictionary<string, object> Locks = new ConcurrentDictionary<string, object>();

        public AuctionFinalizationWorker(AuctionHouseDatabase db)
        {
            this.db = db;
        }

        // Generate and optionally persist report for a single auction id. Returns true on success.
        // dryRun=true will build the DTO and perform no writes to the persistent datasets.
        public bool GenerateAndPersistReport(string auctionId, out AuctionReportDTO dto, out string error, bool dryRun = false)
        {
            dto = new AuctionReportDTO();
            error = null;

            var myLock = Locks.GetOrAdd(auctionId, _ => new object());
            try
            {
                lock (myLock)
                {
                    try
                    {
                        var stored = this.db.Reports.Find(r => r.AuctionId == auctionId);
                        if (stored != null)
                        {
                            dto.AuctionId = stored.AuctionId;
                            dto.AuctionName = stored.AuctionName;
                            dto.TotalRevenue = (int)stored.TotalRevenue;
                            foreach (var sid in stored.SoldItemIds)
                            {
                                var sold = this.db.SoldItems.Find(s => s.Id == sid);
                                if (sold != null)
                                {
                                    dto.SoldItems.Add(new SoldItemDTO { Id = sold.AuctionItemId, Name = sold.Name, FinalPrice = (int)sold.FinalPrice, WinnerFullName = sold.WinnerFullName, WinnerEmail = sold.WinnerEmail });
                                }
                            }
                            foreach (var uid in stored.UnsoldItemIds)
                            {
                                var item = this.db.AuctionItems.Find(i => i.Id == uid);
                                if (item != null)
                                {
                                    dto.UnsoldItems.Add(new { Id = item.Id, Name = item.Name, StartingPrice = item.StartingPrice });
                                }
                            }
                            return true;
                        }

                        var auction = this.db.Auctions.Find(a => a.Id == auctionId);
                        if (auction == null)
                        {
                            error = "Unknown auction id: " + auctionId;
                            return false;
                        }

                        var items = this.db.AuctionItems.Where(i => i.AuctionId == auctionId).ToList();
                        dto.AuctionId = auction.Id;
                        dto.AuctionName = auction.Name;

                        var generatedReport = new AuctionReport
                        {
                            AuctionId = auction.Id,
                            AuctionName = auction.Name,
                        };

                        // Build a per-report pseudonym map so public views can show stable pseudonyms like P1, P2
                        var pseudonymMap = new Dictionary<string, string>();
                        int pseudonymCounter = 1;

                        foreach (var item in items)
                        {
                            var bids = this.db.Bids.Where(b => b.AuctionItemId == item.Id).ToList();
                            if (bids != null && bids.Count > 0)
                            {
                                var final = bids.Aggregate(item.StartingPrice, (acc, b) => acc + b.AmountAdded);
                                var lastBid = bids.OrderByDescending(b => b.CreatedAt).First();
                                var winner = this.db.Users.Find(u => u.Id == lastBid.UserId);
                                dto.SoldItems.Add(new SoldItemDTO
                                {
                                    Id = item.Id,
                                    Name = item.Name,
                                    FinalPrice = (int)final,
                                    WinnerFullName = winner != null ? winner.Name : "",
                                    WinnerEmail = winner != null ? winner.Email : ""
                                });

                                var soldItem = new SoldItem
                                {
                                    AuctionItemId = item.Id,
                                    AuctionId = auctionId,
                                    Name = item.Name,
                                    FinalPrice = final,
                                    WinnerUserId = lastBid.UserId,
                                    WinnerFullName = winner != null ? winner.Name : "",
                                    WinnerEmail = winner != null ? winner.Email : ""
                                };
                                // ensure winner has a pseudonym in this report
                                if (!string.IsNullOrEmpty(lastBid.UserId) && !pseudonymMap.ContainsKey(lastBid.UserId))
                                {
                                    pseudonymMap[lastBid.UserId] = "P" + pseudonymCounter.ToString();
                                    pseudonymCounter++;
                                }
                                if (!dryRun)
                                {
                                    this.db.SoldItems.Add(soldItem);
                                    generatedReport.SoldItemIds.Add(soldItem.Id);
                                }

                                dto.TotalRevenue += (int)final;
                            }
                            else
                            {
                                dto.UnsoldItems.Add(new { Id = item.Id, Name = item.Name, StartingPrice = item.StartingPrice });
                                generatedReport.UnsoldItemIds.Add(item.Id);
                            }
                        }

                        generatedReport.TotalRevenue = dto.TotalRevenue;
                        // attach pseudonym map to the persisted report
                        generatedReport.PseudonymMap = pseudonymMap;
                        // also include pseudonym map in DTO for API consumers (admin may inspect it)
                        dto.PseudonymMap = new Dictionary<string, string>(pseudonymMap);
                        if (!dryRun)
                        {
                            this.db.Reports.Add(generatedReport);

                            // mark auction as inactive and persist
                            auction.IsActive = false;
                            this.db.Auctions.Update(auction, auction.Id);
                            this.db.Auctions.SaveChanges();
                        }

                        return true;
                    }
                    catch (Exception ex)
                    {
                        error = ex.Message;
                        return false;
                    }
                }
            }
            finally
            {
                // release lock object to avoid memory growth
                Locks.TryRemove(auctionId, out _);
            }
        }
    }
}
