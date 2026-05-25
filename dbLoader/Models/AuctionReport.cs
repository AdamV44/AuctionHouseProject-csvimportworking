using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataHandler.Models;

namespace DataHandler.Models
{
    public class AuctionReport : IIdentifyable
    {
        public string Id { get; set; }
        public string AuctionId { get; set; }
        public string AuctionName { get; set; }
        public List<string> SoldItemIds { get; set; } = new List<string>();
        public List<string> UnsoldItemIds { get; set; } = new List<string>();
    // Per-report pseudonym map: UserId -> Pseudonym (eg. "P1", "P2")
    public Dictionary<string, string> PseudonymMap { get; set; } = new Dictionary<string, string>();

    public decimal TotalRevenue { get; set; }

        public void PrintSelf()
        {
            Console.WriteLine($"Report {Id} for Auction {AuctionId} Revenue: {TotalRevenue}");
        }
    }
}
