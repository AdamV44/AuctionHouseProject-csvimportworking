using DataHandler.Models;
using dbLoader;
using dbLoader.Models;
using EvidenAuctionHouseAPI.Attributes;
using EvidenAuctionHouseAPI.Models;
using EvidenAuctionHouseAPI.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BidsController : ControllerBase
    {
        private readonly AuctionHouseDatabase myDb;
        private readonly IConfiguration _configuration;

        // Oprav konstruktor - přidej inicializaci myDb
        public BidsController(AuctionHouseDatabase db, IConfiguration configuration)
        {
            this.myDb = db; // Toto bylo pravděpodobně chybějící!
            this._configuration = configuration;
        }

        [SecuredUser]
        [HttpPost("create")]
        public IActionResult CreateBid(BidCreationDTO info)
        {
            try 
            {
                Console.WriteLine($"[DEBUG] Received bid request for item: {info.Bid.AuctionItemId}");
                Console.WriteLine($"[DEBUG] Bid amount: {info.Bid.AmountAdded}");
                Console.WriteLine($"[DEBUG] Perceived price: {info.ItemPerceivedPrice}");

                // Najít položku, pro kterou se příhoz vztahuje.
                AuctionItem item = this.myDb.AuctionItems.Find(item => item.Id == info.Bid.AuctionItemId);
                if (item == null)
                {
                    Console.WriteLine($"[ERROR] Item not found: {info.Bid.AuctionItemId}");
                    return BadRequest("Unknown item");
                }

                // Výpočet aktuální ceny položky
                int itemStartPrice = item.StartingPrice;
                int currentPrice = this.myDb.Bids
                    .Where(b => b.AuctionItemId == info.Bid.AuctionItemId)
                    .Aggregate(itemStartPrice, (acc, bid) => acc + bid.AmountAdded);

                if (currentPrice != info.ItemPerceivedPrice)
                {
                    return Conflict("Item price changed");
                }

                // Načtení limitů příhozu z konfigurace
                int minBid = _configuration.GetValue<int>("BidLimits:minBid");
                int maxBid = _configuration.GetValue<int>("BidLimits:maxBid");

                // Pokud konfigurace nefunguje, použij pevné hodnoty
                if (maxBid == 0)
                {
                    minBid = 1;
                    maxBid = 2000;
                    Console.WriteLine("[DEBUG] Using fallback values - config not loaded properly");
                }

                Console.WriteLine($"[DEBUG] minBid: {minBid}, maxBid: {maxBid}, AmountAdded: {info.Bid.AmountAdded}");

                // Validace příhozu přímo dle hodnoty AmountAdded
                if (info.Bid.AmountAdded < minBid)
                {
                    return BadRequest($"Příhoz nemůže být menší než {minBid} Kč.");
                }
                if (info.Bid.AmountAdded > maxBid)
                {
                    return BadRequest($"Příhoz nemůže být větší než {maxBid} Kč.");
                }

                // Doplnění dalších údajů a uložení příhozu
                TokensService tokenService = new TokensService();
                string header = Request.Headers["Authorization"];
                info.Bid.CreatedAt = DateTime.Now;
                info.Bid.UserId = tokenService.GetUserId(header);

                this.myDb.Bids.Add(info.Bid);
                Console.WriteLine("[DEBUG] Bid created successfully");
                return Ok(new { message = "Bid created successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Exception in CreateBid: {ex.Message}");
                Console.WriteLine($"[ERROR] Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [SecuredUser]
        [HttpGet("get")]
        public ObjectResult GetBids()
        {
            return Ok(this.myDb.Bids.GetData());
        }

        [SecuredUser]
        [HttpGet("get/{itemId}")]
        public ObjectResult GetBidsByItemId(string itemId)
        {
            return Ok(this.myDb.Bids.Where(b => b.AuctionItemId == itemId).ToList());
        }

        [SecuredUser]
        [HttpGet("get-latest/{itemId}")]
        public ObjectResult GetLatestBidByItemId(string itemId)
        {
            return Ok(
                this.myDb.Bids
                .Where(b => b.AuctionItemId == itemId)
                .OrderByDescending(b => b.CreatedAt)
                .FirstOrDefault());
        }

        [SecuredUser]
        [HttpGet("get-latest-bidder/{itemId}")]
        public ObjectResult GetLatestBidderForItem(string itemId)
        {
            var latestBid = this.myDb.Bids
                .Where(bid => bid.AuctionItemId == itemId)
                .OrderByDescending(bid => bid.CreatedAt)
                .FirstOrDefault();
            if (latestBid == null)
            {
                return Ok(null);
            }
            return Ok(this.myDb.Users.Find(user => user.Id == latestBid.UserId));
        }
    }
}
