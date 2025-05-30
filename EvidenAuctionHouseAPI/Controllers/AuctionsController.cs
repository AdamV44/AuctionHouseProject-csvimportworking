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
        public AuctionsController(AuctionHouseDatabase db)
        {
            this.myDb = db;
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
            return Ok(this.myDb.Auctions.Where(a => a.StartDate <= DateTime.Now && a.EndDate >= DateTime.Now));
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
