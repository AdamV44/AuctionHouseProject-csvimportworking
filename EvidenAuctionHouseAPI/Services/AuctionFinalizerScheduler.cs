using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using dbLoader;
using Microsoft.Extensions.DependencyInjection;

namespace EvidenAuctionHouseAPI.Services
{
    // Hosted scheduler/orchestrator that periodically finds ended auctions and delegates finalization to the worker
    public class AuctionFinalizerScheduler : IHostedService, IDisposable
    {
        private readonly ILogger<AuctionFinalizerScheduler> logger;
        private readonly IServiceProvider services;
        private Timer timer;

        public AuctionFinalizerScheduler(ILogger<AuctionFinalizerScheduler> logger, IServiceProvider services)
        {
            this.logger = logger;
            this.services = services;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                using (var scope = services.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AuctionHouseDatabase>();
                    var cfg = db.configReader; // access YamlReader via db
                    var control = cfg.GetAuctionControl();
                    int interval = Math.Max(1, control.AutoFinalizeIntervalSeconds);
                    bool enabled = control.AutoFinalizeEnabled;
                    int lookback = Math.Max(0, control.AutoFinalizeLookbackSeconds);

                    if (!enabled)
                    {
                        logger.LogInformation("AuctionFinalizerScheduler disabled via config (AuctionControl.AutoFinalizeEnabled = false)");
                    }

                    // start timer only if enabled
                    if (enabled)
                    {
                        // initial delay small, then run every 'interval' seconds
                        timer = new Timer(DoWork, lookback, TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(interval));
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "AuctionFinalizerScheduler failed to start");
            }
            return Task.CompletedTask;
        }

        private void DoWork(object? state)
        {
            try
            {
                using (var scope = services.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AuctionHouseDatabase>();
                    var finalizerWorker = scope.ServiceProvider.GetRequiredService<AuctionFinalizationWorker>();
                    // Find auctions that have ended
                    var now = DateTime.Now;
                    int lookbackSeconds = 0;
                    if (state is int s) lookbackSeconds = s;
                    else if (state is long l) lookbackSeconds = (int)l;
                    // threshold: only finalize auctions that ended within the lookback window
                    var threshold = now.AddSeconds(-lookbackSeconds);
                    var toFinalize = db.Auctions.Where(a => a.EndDate <= now && a.EndDate >= threshold).ToList();
                    foreach (var a in toFinalize)
                    {
                        // Check if report already exists
                        var existing = db.Reports.Find(r => r.AuctionId == a.Id);
                        if (existing != null) continue;

                        logger.LogInformation($"Auto-finalizing auction {a.Id}");
                        if (finalizerWorker.GenerateAndPersistReport(a.Id, out var dto, out var error))
                        {
                            logger.LogInformation($"Auction {a.Id} finalized and report stored");
                        }
                        else
                        {
                            logger.LogError($"Failed to finalize auction {a.Id}: {error}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in AuctionFinalizerScheduler DoWork");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            timer?.Dispose();
        }
    }
}
