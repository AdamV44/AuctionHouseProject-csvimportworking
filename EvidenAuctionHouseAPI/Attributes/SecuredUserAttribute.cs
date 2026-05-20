using EvidenAuctionHouseAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace EvidenAuctionHouseAPI.Attributes
{
    public class SecuredUserAttribute : Attribute, IActionFilter
    {
        public void OnActionExecuted(ActionExecutedContext context)
        {
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            TokensService service = new TokensService();

            if (context.Controller is not ControllerBase controller)
            {
                context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized" });
                return;
            }

            string? header = controller.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(header))
            {
                context.Result = controller.Unauthorized(new { message = "Unauthorized" });
                return;
            }

            if (!service.VerifyUser(header))
            {
                context.Result = controller.Unauthorized(new { message = "Unauthorized" });
            }
        }
    }
}
