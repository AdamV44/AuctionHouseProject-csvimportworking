using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataHandler
{
    public static class DataSetLock
    {
        public static readonly ReaderWriterLockSlim GlobalLock = new(LockRecursionPolicy.NoRecursion);
    }
}
