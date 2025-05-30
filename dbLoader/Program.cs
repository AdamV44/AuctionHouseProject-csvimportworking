using dbLoader.YamlParsingObjects;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace dbLoader
{
    public class Program
    {
        static void Main(string[] args)
        {
            Stopwatch watch = new Stopwatch();
            watch.Start();
            string dbPath = "C:\\Users\\sasas\\OneDrive\\Plocha\\projekt_praxe\\Database";
            string configFilepath = "C:\\Users\\sasas\\OneDrive\\Plocha\\projekt_praxe\\Database\\config.yml";

            AuctionHouseDatabase context = new AuctionHouseDatabase(configFilepath, dbPath);
            watch.Stop();

            context.PrintDb();

            Console.WriteLine(watch.Elapsed.TotalSeconds);
        }
    }
}
