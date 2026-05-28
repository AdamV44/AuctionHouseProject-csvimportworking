using dbLoader;
using EvidenAuctionHouseAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace EvidenAuctionHouseAPI.Attributes
{
    public class SecuredAdminAttribute : Attribute, IActionFilter
    {
        public void OnActionExecuted(ActionExecutedContext context)
        {

        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            try
            {
                var service = context.HttpContext.RequestServices.GetService(typeof(TokensService)) as TokensService;
                if (service == null)
                {
                    context.Result = new UnauthorizedObjectResult(new { message = "Admin auth service not available" });
                    return;
                }

                if (context.Controller is not ControllerBase controller)
                {
                    context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized to use admin tools" });
                    return;
                }

                string? header = controller.Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrWhiteSpace(header))
                {
                    context.Result = controller.Unauthorized(new { message = "Missing Authorization header" });
                    return;
                }

                // Accept either 'Bearer <token>' or a bare token value
                header = header.Trim();
                if (!header.StartsWith("Bearer ", System.StringComparison.OrdinalIgnoreCase))
                {
                    header = "Bearer " + header;
                }

                // Quick check: token must be valid and include isAdmin claim
                if (!service.VerifyAdmin(header))
                {
                    context.Result = controller.Unauthorized(new { message = "Invalid or expired admin token" });
                    return;
                }

                // get userId from token and verify user record still exists and is admin
                string userId = service.GetUserId(header);
                if (string.IsNullOrEmpty(userId))
                {
                    context.Result = controller.Unauthorized(new { message = "Unable to extract userId from token" });
                    return;
                }

                var db = context.HttpContext.RequestServices.GetService(typeof(AuctionHouseDatabase)) as AuctionHouseDatabase;
                var user = db?.Users.Find(u => u.Id == userId);
                if (user == null)
                {
                    context.Result = controller.Unauthorized(new { message = "Unknown user" });
                    return;
                }

                if (!user.isAdmin)
                {
                    // Defensive: token claimed admin but DB record does not — refuse
                    context.Result = controller.Unauthorized(new { message = "User is not an admin" });
                    return;
                }

                // Expose userId to downstream controller/action if needed
                context.HttpContext.Items["UserId"] = userId;
            }
            catch (System.Exception ex)
            {
                // In dev it's useful to see the reason; in production keep message generic
                var env = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                if (!string.IsNullOrEmpty(env) && env.Equals("Development", System.StringComparison.OrdinalIgnoreCase))
                {
                    context.Result = new UnauthorizedObjectResult(new { message = "Admin token verification failed", error = ex.Message });
                }
                else
                {
                    context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized to use admin tools" });
                }
            }
        }
    }
}
