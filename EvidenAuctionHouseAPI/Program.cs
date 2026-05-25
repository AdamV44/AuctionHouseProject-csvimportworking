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
            // RegistrationService depends on the path to pending users file and TokensService
            builder.Services.AddSingleton<EvidenAuctionHouseAPI.Services.RegistrationService>(sp =>
            {
                var tokens = sp.GetService<EvidenAuctionHouseAPI.Services.TokensService>();
                return new EvidenAuctionHouseAPI.Services.RegistrationService(db.RegisterAttemptsFilePath, tokens!);
            });
            // Register finalization worker and hosted scheduler
            builder.Services.AddSingleton<EvidenAuctionHouseAPI.Services.AuctionFinalizationWorker>();
            builder.Services.AddHostedService<EvidenAuctionHouseAPI.Services.AuctionFinalizerScheduler>();

            // SETUP CORS
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(
                    builder =>
                    {
                        builder.AllowAnyOrigin()
                               .AllowAnyHeader()
                               .AllowAnyMethod();
                    }
                );
            });

            // Add services to the container.

            builder.Services.AddControllers();
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

            app.UseHttpsRedirection();

            app.UseCors();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();


            
        }
    }
}
