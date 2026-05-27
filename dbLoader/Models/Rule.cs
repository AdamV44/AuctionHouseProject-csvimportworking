using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace dbLoader.Models
{
    public class Rule : DataHandler.Models.IIdentifyable
    {
        public string Id { get; set; }
        public string Version { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
