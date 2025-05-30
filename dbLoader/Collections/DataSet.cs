using DataHandler.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading;

namespace DataHandler.Collections
{

    public class DataSet<T> : IEnumerable<T> where T : class, IIdentifyable
    {
        public DataSet(string assetsPath)
        {
            AssetsPath = assetsPath;

            DataSetLock.GlobalLock.EnterReadLock();
            try
            {
                data = IOHandler.LoadFromFile<T>(AssetsPath);
            }
            finally
            {
                DataSetLock.GlobalLock.ExitReadLock();
            }
        }

        public string AssetsPath;
        private List<T> data { get; set; }

        public void SaveChanges()
        {
            IOHandler.SaveDataToFile(this, AssetsPath);
        }
        
        public List<T> GetDataUnsafe()
        {
            return new List<T>(data);
        }
        public List<T> GetData()
        {
            DataSetLock.GlobalLock.EnterReadLock();
            try
            {
                // Vracíme kopii seznamu, aby se vnějšek nemohl měnit bez zámku
                return new List<T>(data);
            }
            finally
            {
                DataSetLock.GlobalLock.ExitReadLock();
            }
        }

        public void Add(T item)
        {
            DataSetLock.GlobalLock.EnterWriteLock();
            try
            {
                item.Id = Guid.NewGuid().ToString();
                data.Add(item);

                SaveChanges();
            }
            finally
            {
                DataSetLock.GlobalLock.ExitWriteLock();
            }
        }

        public void AddRange(IEnumerable<T> items)
        {
            DataSetLock.GlobalLock.EnterWriteLock();
            try
            {
                foreach (T item in items)
                {
                    item.Id = Guid.NewGuid().ToString();
                    data.Add(item);
                }

                SaveChanges();
            }
            finally
            {
                DataSetLock.GlobalLock.ExitWriteLock();
            }
        }

        public void Remove(T item)
        {
            DataSetLock.GlobalLock.EnterWriteLock();
            try
            {
                data.Remove(item);

                SaveChanges();
            }
            finally
            {
                DataSetLock.GlobalLock.ExitWriteLock();
            }
        }
        public void RemoveById(string id)
        {
            DataSetLock.GlobalLock.EnterWriteLock();
            try
            {
                for (int i = 0; i < data.Count; i++)
                {
                    if (data[i].Id == id)
                    {
                        data.RemoveAt(i);
                        break;
                    }
                }
                SaveChanges();
            }
            finally
            {
                DataSetLock.GlobalLock.ExitWriteLock();
            }
        }

        public void RemoveRange(IEnumerable<T> items)
        {
            DataSetLock.GlobalLock.EnterWriteLock();
            try
            {
                foreach (T item in items)
                {
                    data.Remove(item);
                }

                SaveChanges();
            }
            finally
            {
                DataSetLock.GlobalLock.ExitWriteLock();
            }
        }

        public void Update(T newItem, string Id)
        {
            DataSetLock.GlobalLock.EnterWriteLock();
            try
            {
                for (int i = 0; i < data.Count; i++)
                {
                    if (data[i].Id == Id)
                    {
                        data[i] = newItem;
                        SaveChanges();
                        return;
                    }
                }
                throw new Exception($"item with id {Id} not found");
            }
            finally
            {
                DataSetLock.GlobalLock.ExitWriteLock();
            }
        }
        public T? Find(Func<T, bool> condition)
        {
            DataSetLock.GlobalLock.EnterReadLock();
            try
            {
                foreach (T item in data)
                {
                    if (condition(item))
                    {
                        return item;
                    }
                }
            }
            finally
            {
                DataSetLock.GlobalLock.ExitReadLock();
            }
            return null;
        }

        public IEnumerator<T> GetEnumerator()
        {
            DataSetLock.GlobalLock.EnterReadLock();
            try
            {
                // Iterovat přes kopii, aby nedocházelo k race condition při enumeraci
                return new List<T>(data).GetEnumerator();
            }
            finally
            {
                DataSetLock.GlobalLock.ExitReadLock();
            }
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
