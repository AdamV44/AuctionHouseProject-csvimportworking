using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace EvidenAuctionHouseAPI.Services
{
    // Simple file-backed single-use token store for contract tokens.
    public class ContractTokenService
    {
        private readonly string path;
        private readonly object locker = new object();

        public class Record
        {
            public string Token { get; set; }
            public string ContractId { get; set; }
            public string UserId { get; set; }
            public DateTime ExpiresAt { get; set; }
            public bool Used { get; set; }
        }

        public ContractTokenService(string dbFolder)
        {
            Directory.CreateDirectory(dbFolder);
            path = Path.Combine(dbFolder, "contract_tokens.json");
            if (!File.Exists(path)) File.WriteAllText(path, "[]");
        }

        private List<Record> ReadAll()
        {
            lock (locker)
            {
                var txt = File.ReadAllText(path);
                return JsonSerializer.Deserialize<List<Record>>(txt) ?? new List<Record>();
            }
        }

        private void WriteAll(List<Record> all)
        {
            lock (locker)
            {
                var txt = JsonSerializer.Serialize(all, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(path, txt);
            }
        }

        public void Store(string token, string contractId, string userId, DateTime expiresAt)
        {
            var all = ReadAll();
            all.Add(new Record { Token = token, ContractId = contractId, UserId = userId, ExpiresAt = expiresAt, Used = false });
            WriteAll(all);
        }

        // Validate and consume (single-use). Returns true if valid and not used and not expired; marks used.
        public bool ValidateAndConsume(string token, out string contractId, out string userId)
        {
            contractId = null; userId = null;
            var all = ReadAll();
            var rec = all.FirstOrDefault(r => r.Token == token);
            if (rec == null) return false;
            if (rec.Used) return false;
            if (rec.ExpiresAt < DateTime.UtcNow) return false;

            // mark used
            rec.Used = true;
            WriteAll(all);

            contractId = rec.ContractId;
            userId = rec.UserId;
            return true;
        }
    }
}
