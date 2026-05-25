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
            var service = context.HttpContext.RequestServices.GetService(typeof(TokensService)) as TokensService;
            if (service == null)
            {
                context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized to use admin tools" });
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
                context.Result = controller.Unauthorized(new { message = "Unauthorized to use admin tools" });
                return;
            }

            string userId = service.GetUserId(header);
            var db = context.HttpContext.RequestServices.GetService(typeof(AuctionHouseDatabase)) as AuctionHouseDatabase;
            var user = db?.Users.Find(user => user.Id == userId);

            if (user == null || !user.isAdmin)
            {
                context.Result = controller.Unauthorized(new { message = "Unauthorized to use admin tools" });
            }
        }
    }
}
