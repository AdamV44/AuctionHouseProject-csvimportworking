using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace EvidenAuctionHouseAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagesController : ControllerBase // Oprav název třídy z ItemsController na ImagesController
    {
        private readonly IConfiguration _configuration;
        
        public ImagesController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("image/{itemId}")]
        public IActionResult GetItemImage(string itemId)
        {
            // Použij konfiguraci:
            string baseImagePath = _configuration.GetValue<string>("ImagePaths:AuctionItemImages") ?? "wwwroot/images/auction-items";
            string imagePath = Path.Combine(baseImagePath, itemId + ".jpg");
            
            // Přidej debug výpisy pro ověření načtení konfigurace
            Console.WriteLine($"[DEBUG] AuctionItemImages path: {_configuration.GetValue<string>("ImagePaths:AuctionItemImages")}");
            Console.WriteLine($"[DEBUG] Default image path: {_configuration.GetValue<string>("ImagePaths:DefaultImage")}");
            Console.WriteLine($"[DEBUG] Looking for image at: {imagePath}");
            
            if (!System.IO.File.Exists(imagePath))
            {
                // Fallback na default obrázek
                string defaultPath = _configuration.GetValue<string>("ImagePaths:DefaultImage") ?? "wwwroot/images/default/no-image.jpg";
                imagePath = defaultPath;
                Console.WriteLine($"[DEBUG] Using default image: {imagePath}");
            }
            
            if (!System.IO.File.Exists(imagePath))
            {
                return NotFound("Image not found");
            }
            
            var imageBytes = System.IO.File.ReadAllBytes(imagePath);
            return File(imageBytes, "image/jpeg");
        }
    }
}