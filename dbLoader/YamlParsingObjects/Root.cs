using DataHandler.YamlParsingObjects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace dbLoader.YamlParsingObjects
{
    public class Root
    {
        public Database Database { get; set; }
        public SMTPConfig SMTPConfig { get; set; }
        public BidLimits BidLimits { get; set; }
        public ImagePaths ImagePaths { get; set; }
    public AuctionControl AuctionControl { get; set; }
    public GDPRConfig GDPR { get; set; }
    }

    public class BidLimits
    {
        public int minBid { get; set; }
        public int maxBid { get; set; }
    }

    public class ImagePaths
    {
        public string AuctionItemImages { get; set; } = string.Empty;
        public string UserAvatars { get; set; } = string.Empty;
        public string CategoryImages { get; set; } = string.Empty;
        public string DefaultImage { get; set; } = string.Empty;
    }

    public class AuctionControl
    {
        public bool AutoFinalizeEnabled { get; set; }
        public int AutoFinalizeIntervalSeconds { get; set; }
        public int AutoFinalizeLookbackSeconds { get; set; }
    }

    public class GDPRConfig
    {
        // whether admin exports of sensitive data are allowed
        public bool AllowAdminExport { get; set; } = true;
    }
}
