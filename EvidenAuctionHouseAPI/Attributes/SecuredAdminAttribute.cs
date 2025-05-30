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
            TokensService service = new TokensService();

            ControllerBase controller = context.Controller as ControllerBase;
            string header = controller.Request.Headers["Authorization"];

            if (!service.VerifyAdmin(header))
            {
                context.Result = controller.Unauthorized(new { message = "Unauthorized to use admin tools" });
            }
        }
    }
}
