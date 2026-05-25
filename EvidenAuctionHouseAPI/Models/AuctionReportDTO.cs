using System;
using System.Collections.Generic;

namespace EvidenAuctionHouseAPI.Models
{
    public class SoldItemDTO
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public int FinalPrice { get; set; }
    public string WinnerFullName { get; set; }
    // added to include winner email in exported reports
    public string WinnerEmail { get; set; }
    }

    public class AuctionReportDTO
    {
        public string AuctionId { get; set; }
        public string AuctionName { get; set; }
    public List<SoldItemDTO> SoldItems { get; set; } = new List<SoldItemDTO>();
        public List<object> UnsoldItems { get; set; } = new List<object>();
    // Per-report pseudonym map: UserId -> Pseudonym (eg. "P1", "P2").
    // Filled when report is generated to provide consistent pseudonyms within a report.
    public Dictionary<string, string> PseudonymMap { get; set; } = new Dictionary<string, string>();
        public int SoldCount => SoldItems?.Count ?? 0;
        public int UnsoldCount => UnsoldItems?.Count ?? 0;
        public int TotalRevenue { get; set; }
    }
}
