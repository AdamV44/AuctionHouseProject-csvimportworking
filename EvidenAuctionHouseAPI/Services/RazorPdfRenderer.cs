using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Diagnostics;

namespace EvidenAuctionHouseAPI.Services
{
    public class RazorPdfRenderer
    {
        private readonly IRazorViewEngine _viewEngine;
        private readonly ITempDataProvider _tempDataProvider;
        private readonly IServiceProvider _serviceProvider;

        public RazorPdfRenderer(IRazorViewEngine viewEngine, ITempDataProvider tempDataProvider, IServiceProvider serviceProvider)
        {
            _viewEngine = viewEngine;
            _tempDataProvider = tempDataProvider;
            _serviceProvider = serviceProvider;
        }

    public async Task<string> RenderViewToStringAsync<TModel>(string viewName, TModel model)
        {
            var httpContext = new DefaultHttpContext { RequestServices = _serviceProvider };
            var actionContext = new Microsoft.AspNetCore.Mvc.ActionContext(httpContext, new Microsoft.AspNetCore.Routing.RouteData(), new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor());

            using (var sw = new StringWriter())
            {
                // Quick physical-file shortcut: if a .cshtml exists under ContentRoot/Templates/... use it
                try
                {
                    var envShortcut = _serviceProvider.GetService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
                    if (envShortcut != null)
                    {
                        var phys = Path.Combine(envShortcut.ContentRootPath, viewName.TrimStart('~', '/'));
                        if (File.Exists(phys))
                        {
                            var template = File.ReadAllText(phys);
                            try
                            {
                                var objModel = (object?)model ?? new object();
                                var json = System.Text.Json.JsonSerializer.Serialize(objModel);
                                var dict = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, object?>>(json) ?? new System.Collections.Generic.Dictionary<string, object?>();
                                foreach (var kv in dict)
                                {
                                    var placeholder = "@Model." + kv.Key;
                                    var val = kv.Value?.ToString() ?? string.Empty;
                                    val = System.Net.WebUtility.HtmlEncode(val);
                                    template = template.Replace(placeholder, val);
                                }
                            }
                            catch { }
                            return template;
                        }
                    }
                }
                catch { }
                // Try FindView first (looks for views by name within areas/controllers).
                var viewResult = _viewEngine.FindView(actionContext, viewName, false);
                if (viewResult.View == null)
                {
                    // Try GetView with the original path
                    var getViewResult = _viewEngine.GetView(executingFilePath: null, viewPath: viewName, isMainPage: false);
                    if (getViewResult.View == null)
                    {
                        // Try stripping ~/ to / (Razor view engine expects absolute-style paths without ~)
                        if (viewName.StartsWith("~/") || viewName.StartsWith("~/"))
                        {
                            var alt = "/" + viewName.TrimStart('~', '/');
                            getViewResult = _viewEngine.GetView(null, alt, false);
                        }
                    }

                    if (getViewResult.View == null)
                    {
                        // As a last resort, try the physical file path relative to the content root
                        try
                        {
                            var env = _serviceProvider.GetService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
                            if (env != null)
                            {
                                var physical = System.IO.Path.Combine(env.ContentRootPath, viewName.TrimStart('~', '/'));
                                getViewResult = _viewEngine.GetView(null, physical, false);
                            }
                        }
                        catch { }
                    }

                    if (getViewResult.View == null)
                    {
                        throw new FileNotFoundException($"View {viewName} not found.");
                    }
                    viewResult = getViewResult;
                }

                var viewDictionary = new ViewDataDictionary(new EmptyModelMetadataProvider(), new ModelStateDictionary())
                {
                    Model = model
                };

                var tempData = new TempDataDictionary(actionContext.HttpContext, _tempDataProvider);

                var viewContext = new ViewContext(
                    actionContext,
                    viewResult.View,
                    viewDictionary,
                    tempData,
                    sw,
                    new HtmlHelperOptions()
                );

                try
                {
                    await viewResult.View.RenderAsync(viewContext);
                    return sw.ToString();
                }
                catch (FileNotFoundException)
                {
                    // If the Razor engine couldn't load the view at runtime, try a simple physical-file fallback:
                    try
                    {
                        var env = _serviceProvider.GetService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
                        if (env != null)
                        {
                            var physPath = Path.Combine(env.ContentRootPath, viewName.TrimStart('~', '/'));
                            if (File.Exists(physPath))
                            {
                                var template = File.ReadAllText(physPath);
                                // simple replacement of @Model.PropertyName occurrences using JSON reflection
                                try
                                {
                                    var objModel = (object?)model ?? new object();
                                    var json = System.Text.Json.JsonSerializer.Serialize(objModel);
                                    var dict = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, object?>>(json) ?? new System.Collections.Generic.Dictionary<string, object?>();
                                    foreach (var kv in dict)
                                    {
                                        var placeholder = "@Model." + kv.Key;
                                        var val = kv.Value?.ToString() ?? string.Empty;
                                        val = System.Net.WebUtility.HtmlEncode(val);
                                        template = template.Replace(placeholder, val);
                                    }
                                }
                                catch { }
                                return template;
                            }
                        }
                    }
                    catch { }

                    throw;
                }
            }
        }

        // Try to convert HTML to PDF using wkhtmltopdf if available. Returns path to PDF or null.
        // If wkhtmltopdf is not available, fall back to PuppeteerSharp-based conversion.
        public async Task<string?> HtmlToPdfAsync(string html, string outputPath)
        {
            // write temp html file
            var tmpHtml = Path.GetTempFileName() + ".html";
            File.WriteAllText(tmpHtml, html);

            try
            {
                var psi = new ProcessStartInfo("wkhtmltopdf")
                {
                    Arguments = $"--enable-local-file-access \"{tmpHtml}\" \"{outputPath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                try
                {
                    using (var proc = Process.Start(psi))
                    {
                        proc.WaitForExit(30000); // 30s
                        var err = proc.StandardError.ReadToEnd();
                        if (proc.ExitCode != 0)
                        {
                            // log error to file and fall through to puppeteer
                            File.AppendAllText(outputPath + ".log", err);
                        }
                        else
                        {
                            return outputPath;
                        }
                    }
                }
                catch
                {
                    // Fall back to PuppeteerSharp if wkhtmltopdf not found or fails
                }

                // PuppeteerSharp fallback
                try
                {
                    // ensure a browser is available - downloads headless chromium on first run
                    var browserFetcher = new PuppeteerSharp.BrowserFetcher();
                    await browserFetcher.DownloadAsync(PuppeteerSharp.BrowserFetcher.DefaultChromiumRevision);
                    var launchOptions = new PuppeteerSharp.LaunchOptions { Headless = true };
                    using var browser = await PuppeteerSharp.Puppeteer.LaunchAsync(launchOptions);
                    using var page = await browser.NewPageAsync();
                    await page.SetContentAsync(html);
                    // use default PdfAsync overload; it's sufficient for simple PDF generation
                    await page.PdfAsync(outputPath);
                    return outputPath;
                }
                catch (System.Exception ex)
                {
                    File.AppendAllText(outputPath + ".log", ex.ToString());
                    return null;
                }
            }
            catch (System.Exception ex)
            {
                // wkhtmltopdf not available or failed
                File.AppendAllText(outputPath + ".log", ex.ToString());
                return null;
            }
            finally
            {
                try { File.Delete(tmpHtml); } catch { }
            }
        }
    }
}
