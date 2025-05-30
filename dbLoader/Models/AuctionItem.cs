using DataHandler.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace dbLoader.Models
{
    public class AuctionItem : IIdentifyable
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public List<string> PicturesPaths { get; set; } = new List<string>();
        public string ItemGroupId { get; set; }
        public string AuctionId { get; set; } = "";
        public int StartingPrice { get; set; }

        [JsonExtensionData]
        public Dictionary<string, JsonElement> AdditionalParams { get; set; } = new Dictionary<string, JsonElement>();

        public void PrintSelf()
        {
            Console.WriteLine($"Id : {this.Id}");
            Console.WriteLine($"Name : {this.Name}");
            Console.WriteLine($"Starting price: {this.StartingPrice}");
            foreach (var item in this.PicturesPaths)
            {
                Console.WriteLine($"picture: {item}");
            }
            foreach (var item in this.AdditionalParams)
            {
                Console.WriteLine($"param : {item.Key} = {item.Value}");
            }
        }
    }
}
