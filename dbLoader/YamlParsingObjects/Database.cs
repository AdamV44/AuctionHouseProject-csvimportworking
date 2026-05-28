using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace dbLoader.YamlParsingObjects
{
    public class Database
    {
        public List<object> AuctionItems { get; set; }
    // Allows loading a YAML value that may be a string ('any') or a list of allowed states
    public object AuctionItemAllowedStates { get; set; }
        public List<object> Users { get; set; }
        public List<object> Auctions { get; set; }
        public List<object> Bids { get; set; }
        public List<object> ItemGroups { get; set; }
        public List<object> RegisterAttempts { get; set; }
        public List<object> Reports { get; set; }
        public List<object> SoldItems { get; set; }
        public List<object> Contracts { get; set; }
        public List<object> Rules { get; set; }

    }
}
