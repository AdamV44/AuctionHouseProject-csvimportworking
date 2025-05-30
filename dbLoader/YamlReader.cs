using DataHandler.YamlParsingObjects;
using dbLoader.YamlParsingObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using YamlDotNet;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;


namespace dbLoader
{
    public class YamlReader
    {
        public YamlReader(string filePath)
        {
            this.yamlFilePath = filePath;
            var yaml = File.ReadAllText(this.yamlFilePath);
            var deserializer = new DeserializerBuilder().Build();
            this.root = deserializer.Deserialize<Root>(yaml);
        }

        private string yamlFilePath;
        private Root root;

        public SMTPConfig GetSMTPConfig()
        {
            if (this.root?.SMTPConfig == null)
            {
                throw new Exception("SMTPConfig section not found in YAML.");
            }
            return this.root.SMTPConfig;
        }
        public string GetAssetsForNode(string nodeName)
        {

            // Získání uzlu podle názvu
            var db = root.Database;
            object? node = nodeName switch
            {
                "AuctionItems" => db.AuctionItems,
                "Users" => db.Users,
                "Auctions" => db.Auctions,
                "Bids" => db.Bids,
                "ItemGroups" => db.ItemGroups,
                "RegisterAttempts" => db.RegisterAttempts,
                _ => null
            };


            if (node is List<object> list)
            {
                foreach (var entry in list)
                {
                    if (entry is Dictionary<object, object> dict && dict.ContainsKey("Assets"))
                    {
                        return dict["Assets"]?.ToString();
                    }
                }
            }
            throw new Exception($"Assets for node {nodeName} not found");
        }

    }
}
