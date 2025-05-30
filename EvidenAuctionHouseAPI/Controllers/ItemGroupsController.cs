using dbLoader;
using EvidenAuctionHouseAPI.Attributes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using DataHandler;

namespace EvidenAuctionHouseAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemGroupsController : ControllerBase
    {
        private readonly AuctionHouseDatabase myDb;
        
        public ItemGroupsController(AuctionHouseDatabase db)
        {
            this.myDb = db;
        }

        // Zakomentuj [SecuredUser] pro testování
        [SecuredUser]
        [HttpGet("get")]
        public ObjectResult GetGroups()
        {
            return Ok(this.myDb.ItemGroups.GetData());
        }

        [SecuredUser]
        [HttpGet("get/{groupName}")]
        public ObjectResult GetGroupByName(string groupName)
        {
            return Ok(this.myDb.ItemGroups.Find(group => group.Name.ToLower() == groupName.ToLower()));
        }

        // Existující reload endpoint
        [HttpPost("reload")]
        public IActionResult ReloadItemGroups()
        {
            try
            {
                Console.WriteLine("[DEBUG] Starting ItemGroups reload...");
                
                // Znovu načti itemGroups z JSON souboru
                myDb.ReloadItemGroups();
                
                var count = myDb.ItemGroups.Count();
                Console.WriteLine($"[DEBUG] ItemGroups reloaded successfully. Count: {count}");
                
                return Ok(new { 
                    message = "ItemGroups reloaded successfully",
                    count = count,
                    timestamp = DateTime.Now,
                    status = "success"
                });
            }
            catch (FileNotFoundException ex)
            {
                Console.WriteLine($"[ERROR] ItemGroups file not found: {ex.Message}");
                return NotFound(new {
                    message = "ItemGroups file not found",
                    error = ex.Message,
                    status = "file_not_found"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to reload ItemGroups: {ex.Message}");
                Console.WriteLine($"[ERROR] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new {
                    message = "Error reloading itemGroups",
                    error = ex.Message,
                    status = "error"
                });
            }
        }

        // Nový endpoint - status reloadu bez autentizace pro admin účely
        [HttpGet("reload/status")]
        public IActionResult GetReloadStatus()
        {
            try
            {
                var count = myDb.ItemGroups.Count();
                var itemGroups = myDb.ItemGroups.Take(3).ToList(); // Prvních 3 pro preview
                
                Console.WriteLine($"[DEBUG] ItemGroups status check - Count: {count}");
                
                return Ok(new {
                    totalCount = count,
                    lastChecked = DateTime.Now,
                    status = "active",
                    preview = itemGroups.Select(ig => new { 
                        id = ig.Id, 
                        name = ig.Name,
                        paramsCount = ig.AdditionalParamsKeys?.Count ?? 0
                    })
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to get ItemGroups status: {ex.Message}");
                return StatusCode(500, new {
                    message = "Error getting reload status",
                    error = ex.Message,
                    status = "error"
                });
            }
        }

        // Nový endpoint - získej konkrétní ItemGroup podle ID (místo jména)
        [SecuredUser]
        [HttpGet("get-by-id/{groupId}")]
        public IActionResult GetGroupById(string groupId)
        {
            try
            {
                var itemGroup = this.myDb.ItemGroups.Find(group => group.Id.ToLower() == groupId.ToLower());
                
                if (itemGroup == null)
                {
                    return NotFound(new {
                        message = $"ItemGroup with ID '{groupId}' not found",
                        status = "not_found"
                    });
                }
                
                Console.WriteLine($"[DEBUG] Found ItemGroup: {itemGroup.Name} (ID: {itemGroup.Id})");
                
                return Ok(itemGroup);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to get ItemGroup by ID {groupId}: {ex.Message}");
                return StatusCode(500, new {
                    message = "Error getting itemGroup",
                    error = ex.Message,
                    status = "error"
                });
            }
        }

        // Nový endpoint - získej seznam všech ID a názvů (pro dropdown/select)
        [SecuredUser]
        [HttpGet("list")]
        public IActionResult GetGroupsList()
        {
            try
            {
                var groupsList = this.myDb.ItemGroups.GetData()
                    .Select(group => new {
                        id = group.Id,
                        name = group.Name,
                        paramsCount = group.AdditionalParamsKeys?.Count ?? 0
                    })
                    .OrderBy(g => g.name)
                    .ToList();
                
                Console.WriteLine($"[DEBUG] Retrieved {groupsList.Count} ItemGroups for list");
                
                return Ok(new {
                    groups = groupsList,
                    totalCount = groupsList.Count,
                    status = "success"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to get ItemGroups list: {ex.Message}");
                return StatusCode(500, new {
                    message = "Error getting itemGroups list",
                    error = ex.Message,
                    status = "error"
                });
            }
        }

        // Nový endpoint - test connectivity (pro admin účely)
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            try
            {
                var isDbConnected = myDb != null;
                var itemGroupsCount = isDbConnected ? myDb.ItemGroups.Count() : 0;
                
                return Ok(new {
                    status = "healthy",
                    dbConnected = isDbConnected,
                    itemGroupsCount = itemGroupsCount,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new {
                    status = "unhealthy",
                    error = ex.Message,
                    timestamp = DateTime.Now
                });
            }
        }
    }
}
