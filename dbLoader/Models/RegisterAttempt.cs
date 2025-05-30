using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataHandler.Models
{
    public class RegisterAttempt : IIdentifyable
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string Token { get; set; }
        public DateTime TimeStamp { get; set; } = DateTime.Now;
    }
}
