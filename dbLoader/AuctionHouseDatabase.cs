using DataHandler.Collections;
using DataHandler.Models;
using dbLoader.Models;
using System.Text.Json;

namespace dbLoader
{
    public class AuctionHouseDatabase
    {
        public AuctionHouseDatabase(string configFilePath, string dbFolderPath)
        {
            this.configReader = new YamlReader(configFilePath);
            this.dbFolderPath = dbFolderPath;
            this.ReloadContext();
        }

        public string dbFolderPath;
        public YamlReader configReader;
        
        public DataSet<AuctionItem> AuctionItems { get; set; }
        public DataSet<User> Users { get; set; }
        public DataSet<Auction> Auctions { get; set; }
        public DataSet<Bid> Bids { get; set; }
        public DataSet<ItemGroup> ItemGroups { get; set; }
        public DataSet<AuctionReport> Reports { get; set; }
        public DataSet<SoldItem> SoldItems { get; set; }
        public DataSet<Contract> Contracts { get; set; }
        public DataSet<Rule> Rules { get; set; }
        public string RegisterAttemptsFilePath { get; set; }




        public void ReloadContext()
        {

            string CombineAsset(string node)
            {
                var rel = (this.configReader.GetAssetsForNode(node) ?? string.Empty).TrimStart('\\', '/');
                return Path.GetFullPath(Path.Combine(this.dbFolderPath, rel));
            }

            this.AuctionItems = new DataSet<AuctionItem>(CombineAsset("AuctionItems"));

            this.Users = new DataSet<User>(CombineAsset("Users"));

            this.Auctions = new DataSet<Auction>(CombineAsset("Auctions"));

            this.Bids = new DataSet<Bid>(CombineAsset("Bids"));

            this.ItemGroups = new DataSet<ItemGroup>(CombineAsset("ItemGroups"));

            // New datasets for reports and sold items
            this.Reports = new DataSet<AuctionReport>(CombineAsset("Reports"));
            this.SoldItems = new DataSet<SoldItem>(CombineAsset("SoldItems"));

            // Contracts dataset (for generated contract PDFs and metadata)
            this.Contracts = new DataSet<Contract>(CombineAsset("Contracts"));

            // Rules dataset
            this.Rules = new DataSet<Rule>(CombineAsset("Rules"));

            this.RegisterAttemptsFilePath = CombineAsset("RegisterAttempts");

        }
        public void PrintDb()
        {
            foreach (var item in this.AuctionItems)
            {
                item.PrintSelf();
            }
            foreach (var item in this.Users)
            {
                item.PrintSelf();
            }
            foreach (var item in this.Auctions)
            {
                item.PrintSelf();
            }
            foreach (var item in this.Bids)
            {
                item.PrintSelf();
            }
            foreach (var item in this.ItemGroups)
            {
                item.PrintSelf();
            }
            
        }
        public void ReloadItemGroups()
        {
            // Znovu načti ItemGroups z JSON souboru - oprav použití configReader
            string itemGroupsPath = this.dbFolderPath + this.configReader.GetAssetsForNode("ItemGroups");
            
            if (File.Exists(itemGroupsPath))
            {
                Console.WriteLine($"[DEBUG] Reloading ItemGroups from: {itemGroupsPath}");
                
                // Vytvoř nový DataSet s aktuálními daty ze souboru
                this.ItemGroups = new DataSet<ItemGroup>(itemGroupsPath);
                
                Console.WriteLine($"[DEBUG] ItemGroups reloaded successfully");
                Console.WriteLine($"[DEBUG] Loaded {this.ItemGroups.Count()} item groups");
            }
            else
            {
                throw new FileNotFoundException($"ItemGroups file not found: {itemGroupsPath}");
            }
        }
    }
}
