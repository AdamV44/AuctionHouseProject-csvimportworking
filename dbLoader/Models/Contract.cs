using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataHandler.Models;

namespace DataHandler.Models
{
    public class Contract : IIdentifyable
    {
        public string Id { get; set; }
        public string AuctionId { get; set; }
        public string ItemId { get; set; }
        public string WinnerUserId { get; set; }
        public decimal Price { get; set; }
        public string Currency { get; set; }
        public DateTime CreatedAt { get; set; }
        public string GeneratedBy { get; set; }
        public string TemplateVersion { get; set; }
        public string PdfPath { get; set; }
        public string SignedPdfPath { get; set; }
        public string SignatureMethod { get; set; }
        public string SignatureMetadata { get; set; }
        public string Status { get; set; }
        public List<string> Audit { get; set; }

        public void PrintSelf()
        {
            Console.WriteLine($"Contract Id: {Id} Auction: {AuctionId} Item: {ItemId} Winner: {WinnerUserId} Price: {Price}" +
                $"Currency: {Currency} CreatedAt: {CreatedAt} GeneratedBy: {GeneratedBy} TemplateVersion: {TemplateVersion} " +
                $"PdfPath: {PdfPath} SignedPdfPath: {SignedPdfPath} SignatureMethod: {SignatureMethod} SignatureMetadata: {SignatureMetadata} " +
                $"Status: {Status}");
        }
    }
}
