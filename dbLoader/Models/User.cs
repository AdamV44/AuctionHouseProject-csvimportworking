using DataHandler.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace dbLoader.Models
{
    public class User : IIdentifyable
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string PasswordHash { get; set; }
        public string Email { get; set; }
        public bool isAdmin { get; set; }
    // First-login rules acceptance
    public bool AcceptedRules { get; set; } = false;
    public DateTime? AcceptedRulesAt { get; set; }
    public string? AcceptedRulesVersion { get; set; }

        public void PrintSelf()
        {
            Console.WriteLine($"Id: {this.Id}");
            Console.WriteLine($"Name: {this.Name}");
            Console.WriteLine($"password: {this.PasswordHash}");
            Console.WriteLine($"Email: {this.Email}");
            Console.WriteLine($"Admin?: {this.isAdmin}");
        }
    }
}
