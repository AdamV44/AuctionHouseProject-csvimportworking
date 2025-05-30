using dbLoader.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataHandler.Models
{
    public class Auction : IIdentifyable
    {
        public string Id { get; set; }
        public string Name { get; set; }
        //public bool Anonymous { get; set; } zeptat se radka, jestli má smysl
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        //public List<string> AuctionItemsIds { get; set; } = new List<string>();

        public void PrintSelf()
        {
            Console.WriteLine($"Id : {this.Id} ");
            Console.WriteLine($"Name : {this.Name} ");

            Console.WriteLine($"StartDate : {this.StartDate} ");
            Console.WriteLine($"EndDate : {this.EndDate} ");
        }
    }
}
