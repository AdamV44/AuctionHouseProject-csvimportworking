using dbLoader;
using System.IO;

namespace EvidenAuctionHouseAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            string dbPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Database"));
            string configFilepath = Path.Combine(dbPath, "config.yml");

            Console.WriteLine($"Config path: {configFilepath}");

            var db = new AuctionHouseDatabase(configFilepath, dbPath);

            builder.Services.AddSingleton<AuctionHouseDatabase>(db);
            // TokensService provides token creation/verification and reads secrets from env vars
            builder.Services.AddSingleton<EvidenAuctionHouseAPI.Services.TokensService>();
            // refresh token persistence
            builder.Services.AddSingleton<EvidenAuctionHouseAPI.Services.RefreshTokenService>(sp =>
            {
                return new EvidenAuctionHouseAPI.Services.RefreshTokenService(db.dbFolderPath);
            });
            // RegistrationService depends on the path to pending users file and TokensService
            builder.Services.AddSingleton<EvidenAuctionHouseAPI.Services.RegistrationService>(sp =>
            {
                var tokens = sp.GetService<EvidenAuctionHouseAPI.Services.TokensService>();
                return new EvidenAuctionHouseAPI.Services.RegistrationService(db.RegisterAttemptsFilePath, tokens!);
            });
            // Register finalization worker and hosted scheduler
            builder.Services.AddSingleton<EvidenAuctionHouseAPI.Services.AuctionFinalizationWorker>();
            builder.Services.AddHostedService<EvidenAuctionHouseAPI.Services.AuctionFinalizerScheduler>();
            // Email service
            builder.Services.AddSingleton<EvidenAuctionHouseAPI.Services.IEmailService, EvidenAuctionHouseAPI.Services.EmailService>();
            // Contract token store (single-use token persistence)
            builder.Services.AddSingleton<EvidenAuctionHouseAPI.Services.ContractTokenService>(sp =>
            {
                return new EvidenAuctionHouseAPI.Services.ContractTokenService(db.dbFolderPath);
            });

            // SETUP CORS
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(
                    builder =>
                    {
                        // allow credentials and use explicit origin(s) from env if provided
                        var originEnv = Environment.GetEnvironmentVariable("EVIDEN_CLIENT_ORIGIN") ?? "http://127.0.0.1:4200";
                        var origins = originEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
                        // always include common localhost host used by angular dev server
                        if (!origins.Contains("http://localhost:4200")) origins.Add("http://localhost:4200");
                        builder.WithOrigins(origins.ToArray())
                               .AllowAnyHeader()
                               .AllowAnyMethod()
                               .AllowCredentials();
                    }
                );
            });

            // Add services to the container.

            // Enable controllers with views so we can render Razor views server-side
            builder.Services.AddControllersWithViews();
            builder.Services.AddRazorPages();
            // Register Razor PDF renderer
            builder.Services.AddSingleton<EvidenAuctionHouseAPI.Services.RazorPdfRenderer>();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();


            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // Routing is required so CORS middleware can see endpoint metadata and
            // correctly handle preflight requests. Place UseCors after UseRouting
            // but before UseHttpsRedirection so OPTIONS requests are not redirected.
            app.UseRouting();

            app.UseCors();

            // Short-circuit OPTIONS preflight requests to prevent any later middleware
            // (such as HTTPS redirection) from issuing a redirect which browsers will
            // reject for preflight requests.
            app.Use(async (context, next) =>
            {
                if (string.Equals(context.Request.Method, "OPTIONS", System.StringComparison.OrdinalIgnoreCase))
                {
                    // Let the CORS middleware set the appropriate headers; just end the pipeline.
                    context.Response.StatusCode = StatusCodes.Status204NoContent;
                    await context.Response.CompleteAsync();
                    return;
                }
                await next();
            });

            // Don't force HTTPS in Development: redirects can break dev tooling and CORS preflight.
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseAuthorization();


            app.MapControllers();

            app.Run();


            
        }
    }
}
