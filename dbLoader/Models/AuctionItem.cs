using DataHandler.Models;
using System.Text.Json;
using System.Text.Json.Serialization;
using Newtonsoft.Json;

namespace dbLoader.Models
{
    public class AuctionItem : IIdentifyable
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public List<string> PicturesPaths { get; set; } = new List<string>();
        public string AuctionId { get; set; } = "";
        public int StartingPrice { get; set; }
        public string SerialNumber { get; set; } = "";

        // replaced dictionary with single string to match spec 4.1
        [JsonProperty("additionalParameters")]
        public string AdditionalParameters { get; set; }
        
    // state of the item: e.g. "new", "used", "working", "notWorking"
    public string State { get; set; } = "new";

        public void PrintSelf()
        {
            Console.WriteLine($"Id : {this.Id}");
            Console.WriteLine($"Name : {this.Name}");
            Console.WriteLine($"Starting price: {this.StartingPrice}");
            foreach (var item in this.PicturesPaths)
            {
                Console.WriteLine($"picture: {item}");
            }
            Console.WriteLine($"Additional params: {this.AdditionalParameters}");
            Console.WriteLine($"State: {this.State}");
            Console.WriteLine($"Serial Number: {this.SerialNumber}");
        }
    }
}
