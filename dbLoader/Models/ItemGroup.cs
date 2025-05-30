using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataHandler.Models
{
    public class ItemGroup : IIdentifyable
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public List<string> AdditionalParamsKeys { get; set; }


        public void PrintSelf()
        {
            Console.WriteLine($"Id: {this.Id}");
            Console.WriteLine($"Name: {this.Name}");
            foreach (var item in this.AdditionalParamsKeys)
            {
                Console.WriteLine($"AdditionalParamKey: {item}");
            }
            
        }
    }
}
