# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy all .csproj files and restore dependencies first
# This leverages Docker layer caching to avoid re-downloading dependencies on every code change.
COPY EvidenAuctionHouseAPI/EvidenAuctionHouseAPI.csproj EvidenAuctionHouseAPI/
COPY dbLoader/DataHandler.csproj dbLoader/

RUN dotnet restore "EvidenAuctionHouseAPI/EvidenAuctionHouseAPI.csproj"

# Copy the rest of the source code
COPY . .
WORKDIR "/src/EvidenAuctionHouseAPI"
RUN dotnet build "EvidenAuctionHouseAPI.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "EvidenAuctionHouseAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EvidenAuctionHouseAPI.dll"]
