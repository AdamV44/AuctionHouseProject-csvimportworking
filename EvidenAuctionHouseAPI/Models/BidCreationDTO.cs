using DataHandler.Models;
using System.Text.Json.Serialization;

namespace EvidenAuctionHouseAPI.Models
{
    public class BidCreationDTO
    {
        public Bid Bid { get; set; }
        public int ItemPerceivedPrice { get; set; }
        
        // Bezparametrový konstruktor pro JSON deserializaci
        public BidCreationDTO()
        {
        }
        
        // Konstruktor s parametry pro ruční vytváření
        [JsonConstructor]
        public BidCreationDTO(Bid bid, int itemPerceivedPrice)
        {
            Bid = bid;
            ItemPerceivedPrice = itemPerceivedPrice;
        }
    }
}
