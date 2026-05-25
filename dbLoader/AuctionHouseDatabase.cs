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
        public string RegisterAttemptsFilePath { get; set; }




        public void ReloadContext()
        {

            this.AuctionItems = new DataSet<AuctionItem>(this.dbFolderPath + this.configReader.GetAssetsForNode("AuctionItems"));

            this.Users = new DataSet<User>(this.dbFolderPath + this.configReader.GetAssetsForNode("Users"));

            this.Auctions = new DataSet<Auction>(this.dbFolderPath + this.configReader.GetAssetsForNode("Auctions"));

            this.Bids = new DataSet<Bid>(this.dbFolderPath + this.configReader.GetAssetsForNode("Bids"));

            this.ItemGroups = new DataSet<ItemGroup>(this.dbFolderPath + this.configReader.GetAssetsForNode("ItemGroups"));

            // New datasets for reports and sold items
            this.Reports = new DataSet<AuctionReport>(this.dbFolderPath + this.configReader.GetAssetsForNode("Reports"));
            this.SoldItems = new DataSet<SoldItem>(this.dbFolderPath + this.configReader.GetAssetsForNode("SoldItems"));

            this.RegisterAttemptsFilePath = this.dbFolderPath + this.configReader.GetAssetsForNode("RegisterAttempts");

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
