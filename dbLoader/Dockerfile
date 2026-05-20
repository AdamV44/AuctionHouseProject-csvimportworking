# This is a dummy Dockerfile for the dbLoader service.
# Its purpose is to be a target for the `build` context in docker-compose,
# allowing us to manage the "Database" volume consistently.
# It doesn't need to run anything, as the backend service directly accesses the volume.
FROM alpine:latest
WORKDIR /app
VOLUME /app/Database
CMD ["echo", "Data volume container for AuctionHouse database files."]
