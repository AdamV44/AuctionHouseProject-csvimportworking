using DataHandler.Models;

namespace EvidenAuctionHouseAPI.Models
{
    public class AuctionCreationDTO
    {
        public Auction Auction { get; set; }
        public string[] AuctionItemsIds { get; set; }
    }
}
