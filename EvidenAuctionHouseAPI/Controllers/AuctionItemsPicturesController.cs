using dbLoader;
using EvidenAuctionHouseAPI.Attributes;
using EvidenAuctionHouseAPI.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static System.Net.Mime.MediaTypeNames;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuctionItemsPicturesController : ControllerBase
    {
        public AuctionItemsPicturesController(AuctionHouseDatabase db)
        {
            this.myDb = db;
            this.service = new FileService(Path.Combine(this.myDb.dbFolderPath, "AuctionItemsPictures"));
        }
        private AuctionHouseDatabase myDb;
        private FileService service;

        [SecuredUser]
        [HttpPost("upload")]
        public IActionResult UploadPicturesForItem([FromForm] List<IFormFile> images, [FromForm] string itemId)
        {
            if (images == null || images.Count == 0)
                return BadRequest("No files uploaded");

            var uploadDir = Path.Combine(this.myDb.dbFolderPath, "AuctionItemsPictures", itemId);

            Directory.CreateDirectory(uploadDir); // pro jistotu vytvoří složku, pokud neexistuje

            var uploadedFiles = new List<string>();

            foreach (var image in images)
            {
                var item = this.myDb.AuctionItems.Find(item => item.Id == itemId);
                var filePath = Path.Combine(uploadDir, image.FileName);

                if (item == null)
                {
                    return NotFound($"Item with ID {itemId} not found");
                }
                if (Path.Exists(filePath))
                {
                    return BadRequest($"File {image.FileName} already exists in the directory, please rename the file");
                }
                using var stream = new FileStream(filePath, FileMode.Create);
                    image.CopyTo(stream);

                uploadedFiles.Add(image.FileName);
                item.PicturesPaths.Add(this.service.ToRelativePath(filePath));


                this.myDb.AuctionItems.Update(item, itemId);
            }

            return Ok(new
            {
                Message = "Files uploaded successfully",
                Files = uploadedFiles
            });
        }

        [SecuredUser]
        [HttpGet("get/{id}")]
        public ObjectResult GetAuctionItemPictures(string id)
        {
            return Ok(this.service.GetPicturesForAuctionItem(id, this.myDb));
        }
    }
}
