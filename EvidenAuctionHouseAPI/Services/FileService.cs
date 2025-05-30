using dbLoader;

namespace EvidenAuctionHouseAPI.Services
{
    public class FileService
    {

        public FileService(string picturesFolderPath)
        {
            PicturesFolderPath = picturesFolderPath;
        }
        private string PicturesFolderPath;
        public List<object> GetPicturesForAuctionItem(string auctionItemId, AuctionHouseDatabase db)
        {
            var filePaths = new List<string>();
            var imageList = new List<object>();
            var auctionItem = db.AuctionItems.Find(item => item.Id == auctionItemId);
            foreach (var item in auctionItem.PicturesPaths)
            {
                filePaths.Add(Path.Combine(db.dbFolderPath, item));
            }

            foreach (var file in filePaths)
            {
                var bytes = System.IO.File.ReadAllBytes(file);
                var base64 = Convert.ToBase64String(bytes);
                var contentType = GetContentType(file); // například image/jpeg

                imageList.Add(new
                {
                    FileName = Path.GetFileName(file),
                    ContentType = contentType,
                    Base64Data = base64
                });
            }
            return imageList;
        }

        private string GetContentType(string filePath)
        {
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            return ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };
        }
        public string ToRelativePath(string path)
        {

            string folderName = this.PicturesFolderPath.Split("\\").Last();

            int startIndex = path.IndexOf(folderName);


            return path.Substring(startIndex);
        }
    }
}
