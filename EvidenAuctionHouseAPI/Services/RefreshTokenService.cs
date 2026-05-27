using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;

namespace EvidenAuctionHouseAPI.Services
{
    // Simple file-backed refresh token store. Not intended for high-scale production
    public class RefreshTokenService
    {
        private readonly string path;
        private readonly ReaderWriterLockSlim rw = new ReaderWriterLockSlim();

        private class Record
        {
            public string Id { get; set; }
            public string Token { get; set; }
            public string UserId { get; set; }
            public DateTime ExpiresAt { get; set; }
        }

        public RefreshTokenService(string dbFolder)
        {
            Directory.CreateDirectory(dbFolder);
            this.path = Path.Combine(dbFolder, "refresh_tokens.json");
            if (!File.Exists(this.path)) File.WriteAllText(this.path, "[]");
        }

        private List<Record> ReadAll()
        {
            rw.EnterReadLock();
            try
            {
                var txt = File.ReadAllText(this.path);
                return JsonSerializer.Deserialize<List<Record>>(txt) ?? new List<Record>();
            }
            finally { rw.ExitReadLock(); }
        }

        private void WriteAll(List<Record> all)
        {
            rw.EnterWriteLock();
            try
            {
                var txt = JsonSerializer.Serialize(all);
                File.WriteAllText(this.path, txt);
            }
            finally { rw.ExitWriteLock(); }
        }

        // Create refresh token record and return id and token
        public (string id, string token) Create(string userId, TimeSpan lifetime)
        {
            var id = Guid.NewGuid().ToString();
            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).TrimEnd('=');
            var rec = new Record { Id = id, Token = token, UserId = userId, ExpiresAt = DateTime.UtcNow.Add(lifetime) };
            var all = ReadAll();
            all.Add(rec);
            WriteAll(all);
            return (id, token);
        }

        // Validate token by id and value. Returns userId if valid, null otherwise
        public string? Validate(string id, string token)
        {
            var all = ReadAll();
            var rec = all.FirstOrDefault(r => r.Id == id && r.Token == token);
            if (rec == null) return null;
            if (rec.ExpiresAt < DateTime.UtcNow) return null;
            return rec.UserId;
        }

        public void Revoke(string id)
        {
            var all = ReadAll();
            var remaining = all.Where(r => r.Id != id).ToList();
            WriteAll(remaining);
        }
    }
}
