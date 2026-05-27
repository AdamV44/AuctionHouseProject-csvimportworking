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
            var service = context.HttpContext.RequestServices.GetService(typeof(TokensService)) as TokensService;
            if (service == null)
            {
                context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized" });
                return;
            }
            if (context.Controller is not ControllerBase controller)
            {
                context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized" });
                return;
            }

            string? header = controller.Request.Headers["Authorization"].FirstOrDefault();
            // diagnostic logging to help debug missing/invalid tokens during development
            try
            {
                Console.WriteLine($"[SecuredUser] Authorization header: {header}");
                var possibleUserId = service?.GetUserId(header);
                Console.WriteLine($"[SecuredUser] Decoded userId: {possibleUserId}");
            }
            catch
            {
                // swallow logging errors
            }
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
