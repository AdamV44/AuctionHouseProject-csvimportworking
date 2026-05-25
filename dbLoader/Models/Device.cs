using System.Text.Json.Serialization;
using DataHandler.Models;

namespace dbLoader.Models
{
    /// <summary>
    /// Device model for IT Bazar - represents IT equipment available for auction
    /// Based on specification 4.1: Import zařízení pro prodej
    /// </summary>
    public class Device : IIdentifyable
    {
        /// <summary>
        /// Unique identifier (GUID)
        /// </summary>
        public string Id { get; set; }
        
        /// <summary>
        /// Inventory/Asset number from Inventory Assistant
        /// </summary>
        [JsonPropertyName("inventoryNumber")]
        public string InventoryNumber { get; set; }
        
        /// <summary>
        /// Device name/type (e.g., "Dell XPS 13", "iPhone 12")
        /// </summary>
        [JsonPropertyName("name")]
        public string Name { get; set; }
        
        /// <summary>
        /// Serial number - unique device identifier
        /// </summary>
        [JsonPropertyName("serialNumber")]
        public string SerialNumber { get; set; }
        
        /// <summary>
        /// Current user assignment (from Inventory Assistant)
        /// </summary>
        [JsonPropertyName("assignedUser")]
        public string AssignedUser { get; set; }
        
        /// <summary>
        /// Team assignment (from Inventory Assistant)
        /// </summary>
        [JsonPropertyName("team")]
        public string Team { get; set; }
        
        /// <summary>
        /// Physical location (from Inventory Assistant)
        /// </summary>
        [JsonPropertyName("location")]
        public string Location { get; set; }
        
        /// <summary>
        /// Creation timestamp
        /// </summary>
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// Device condition/status
        /// Values: "OK", "použitý" (used), "vadný" (broken)
        /// SPEC 4.1: stav (např. OK / použitý / vadný)
        /// </summary>
        [JsonPropertyName("status")]
        public string Status { get; set; }
        
        /// <summary>
        /// Detailed description of the device
        /// SPEC 4.1: popis
        /// </summary>
        [JsonPropertyName("description")]
        public string Description { get; set; }
        
        /// <summary>
        /// Optional photograph of the device (file path or URL)
        /// SPEC 4.1: fotografie (volitelně)
        /// </summary>
        [JsonPropertyName("photoPath")]
        public string PhotoPath { get; set; }
        
        /// <summary>
        /// Minimum starting price for auction (in CZK)
        /// SPEC 4.1: minimální cena
        /// </summary>
        [JsonPropertyName("minimumPrice")]
        public int? MinimumPrice { get; set; }
        
        /// <summary>
        /// Maximum automatic bid price (optional for future automation)
        /// SPEC 4.1: (maximální cena pro příhozy / automat?)
        /// </summary>
        [JsonPropertyName("maximumPrice")]
        public int? MaximumPrice { get; set; }
        
        /// <summary>
        /// Track which auction this device belongs to (empty string if not assigned)
        /// </summary>
        [JsonPropertyName("auctionId")]
        public string AuctionId { get; set; } = "";
        
        /// <summary>
        /// Extension data for additional device properties
        /// Allows flexible addition of custom fields per device
        /// </summary>
        [JsonExtensionData]
        public Dictionary<string, object> AdditionalParams { get; set; } = new Dictionary<string, object>();

        public void PrintSelf()
        {
            Console.WriteLine("=== Device Information ===");
            Console.WriteLine($"ID: {this.Id}");
            Console.WriteLine($"Name: {this.Name}");
            Console.WriteLine($"Serial Number: {this.SerialNumber}");
            Console.WriteLine($"Inventory Number: {this.InventoryNumber}");
            Console.WriteLine($"Status: {this.Status}");
            Console.WriteLine($"Description: {this.Description}");
            Console.WriteLine($"Assigned User: {this.AssignedUser}");
            Console.WriteLine($"Team: {this.Team}");
            Console.WriteLine($"Location: {this.Location}");
            Console.WriteLine($"Created At: {this.CreatedAt}");
            Console.WriteLine($"Minimum Price: {this.MinimumPrice} CZK");
            Console.WriteLine($"Maximum Price: {this.MaximumPrice} CZK");
            Console.WriteLine($"Photo Path: {this.PhotoPath}");
            Console.WriteLine($"Auction ID: {this.AuctionId}");
            
            if (this.AdditionalParams.Any())
            {
                Console.WriteLine("Additional Parameters:");
                foreach (var param in this.AdditionalParams)
                {
                    Console.WriteLine($"  {param.Key}: {param.Value}");
                }
            }
        }
    }
}
