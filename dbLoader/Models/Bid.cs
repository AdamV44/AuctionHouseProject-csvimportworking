using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataHandler.Models
{
    public class Bid : IIdentifyable
    {
        public string Id { get; set; }
        public string AuctionItemId { get; set; }
        public string UserId { get; set; }
        public int AmountAdded { get; set; }
        public DateTime CreatedAt { get; set; }

        public void PrintSelf()
        {
            Console.WriteLine($"id: {this.Id}");
            Console.WriteLine($"AuctionItemId: {this.AuctionItemId}");
            Console.WriteLine($"UserId: {this.UserId}");
            Console.WriteLine($"AmountAdded: {this.AmountAdded}");
            Console.WriteLine($"Date: {this.CreatedAt}");
        }
    }
}
