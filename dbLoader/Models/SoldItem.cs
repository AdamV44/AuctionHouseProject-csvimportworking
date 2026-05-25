using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataHandler.Models;

namespace DataHandler.Models
{
    public class SoldItem : IIdentifyable
    {
        public string Id { get; set; }
        public string AuctionItemId { get; set; }
        public string AuctionId { get; set; }
        public string Name { get; set; }
        public decimal FinalPrice { get; set; }
        public string WinnerUserId { get; set; }
        public string WinnerFullName { get; set; }
    // added to persist winner email for reporting
    public string WinnerEmail { get; set; }

        public void PrintSelf()
        {
            Console.WriteLine($"SoldItem Id: {Id} Name: {Name} FinalPrice: {FinalPrice} Winner: {WinnerFullName} Email: {WinnerEmail}");
        }
    }
}
