using DataHandler.Collections;
using DataHandler.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace DataHandler
{
    public static class IOHandler
    {

        public static List<T> LoadFromFile<T>(string filePath) where T : IIdentifyable
        {
            filePath = filePath.Replace('\\', Path.DirectorySeparatorChar);
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var json = File.ReadAllText(filePath);
            List<T>? rawList = JsonSerializer.Deserialize<List<T>>(json, options);

            if (rawList == null)
            {
                throw new Exception($"failed to deserialize json on path: {filePath}");
            }
            return rawList;

        }

        public static void SaveDataToFile<T>(DataSet<T> items, string filePath) where T : class, IIdentifyable
        {
            filePath = filePath.Replace('\\', Path.DirectorySeparatorChar);
            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                //vypne escapování znaků s háčky a čárky
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping

            };
            var json = JsonSerializer.Serialize(items.GetDataUnsafe(), options);
            File.WriteAllText(filePath, json);
        }
        public static void SaveDataToFile<T>(List<T> items, string filePath) where T : class, IIdentifyable
        {
            filePath = filePath.Replace('\\', Path.DirectorySeparatorChar);
            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                //vypne escapování znaků s háčky a čárky
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping

            };
            var json = JsonSerializer.Serialize(items, options);
            File.WriteAllText(filePath, json);
        }



    }
}
