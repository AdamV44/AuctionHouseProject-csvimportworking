using dbLoader;
using dbLoader.Models;
using EvidenAuctionHouseAPI.Attributes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuctionItemsController : ControllerBase
    {
        public AuctionItemsController(AuctionHouseDatabase db)
        {
            this.myDb = db;
        }
        private AuctionHouseDatabase myDb;


        [SecuredAdmin]
        [HttpPost("create")]
        public IActionResult CreateAuctionItem(AuctionItem item)
        {
            Console.WriteLine("[AuctionItemsController] CreateAuctionItem called");
            try
            {
                Console.WriteLine($"[AuctionItemsController] Incoming item name={item?.Name} startingPrice={item?.StartingPrice}");
                this.myDb.AuctionItems.Add(item);
                var count = this.myDb.AuctionItems.GetData().Count;
                Console.WriteLine($"[AuctionItemsController] Item added. Current count={count}. AssetsPath={this.myDb.AuctionItems.AssetsPath}");
                return Ok(item);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuctionItemsController] Error adding item: {ex}");
                return StatusCode(500, new { message = "failed to add item", error = ex.Message });
            }
        }

        // DEBUG endpoint: allow creating without admin auth to validate persistence
        [HttpPost("debug/create-noauth")]
        public IActionResult DebugCreateNoAuth(AuctionItem item)
        {
            Console.WriteLine("[AuctionItemsController] DebugCreateNoAuth called");
            try
            {
                this.myDb.AuctionItems.Add(item);
                var count = this.myDb.AuctionItems.GetData().Count;
                Console.WriteLine($"[AuctionItemsController] Debug added. Current count={count}. AssetsPath={this.myDb.AuctionItems.AssetsPath}");
                return Ok(new { ok = true, count });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuctionItemsController] Debug error: {ex}");
                return StatusCode(500, new { message = "debug failed", error = ex.Message });
            }
        }

        [HttpGet("debug/list")]
        public IActionResult DebugList()
        {
            try
            {
                var data = this.myDb.AuctionItems.GetData();
                return Ok(new { count = data.Count, items = data.Take(10) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "failed to list", error = ex.Message });
            }
        }

        [HttpPost("create-multiple")]
        public IActionResult CreateMultipleAuctionItems(AuctionItem[] items)
        {
            this.myDb.AuctionItems.AddRange(items);
            return Ok(items);
        }

        [SecuredUser]
        [HttpGet("get")]
        public ObjectResult GetAuctionItems()
        {
            return Ok(this.myDb.AuctionItems.GetData());
        }

        [SecuredUser]
        [HttpGet("get-unlisted")]
        public ObjectResult GetUnlistedAuctionItems()
        {
            return Ok(this.myDb.AuctionItems.Where(item => string.IsNullOrEmpty(item.AuctionId)));
        }

        [SecuredUser]
        [HttpGet("get/{id}")]
        public ObjectResult GetAuctionItemById(string id)
        {
            return Ok(this.myDb.AuctionItems.Find(auctionItem => auctionItem.Id == id));
        }

        [SecuredUser]
        [HttpGet("get/price/{id}")]
        public ObjectResult GetAuctionItemPrice(string id)
        {
            int startPrice = this.myDb.AuctionItems.Find(item => item.Id == id).StartingPrice;
            return Ok(
                this.myDb.Bids
                .Where(bid => bid.AuctionItemId == id)
                .Aggregate(startPrice, (acc, num) => acc + num.AmountAdded));
        }

        [SecuredAdmin]
        [HttpDelete("delete/{id}")]
        public IActionResult DeleteAuctionItemById(string id)
        {
            this.myDb.AuctionItems.RemoveById(id);
            return Ok(new { message = $"successfully removed AuctionItem with id: {id}" });
        }
        [SecuredAdmin]
        [HttpPost("delete-multiple")]
        public IActionResult DeleteMultipleAuctionItems(string[] ids)
        {
            foreach (var item in ids)
            {
                this.myDb.AuctionItems.RemoveById(item);
            }

            return Ok(this.myDb.AuctionItems);
        }

    }
}
