### Building and running your application

When you're ready, start your application by running:
`docker compose up --build`.

Your application will be available at http://localhost:4200.

### Local development (without Docker)

If you prefer to run services locally during development, follow these steps.

Start the backend API (recommended to run in foreground while developing):

```bash
cd EvidenAuctionHouseAPI
# ensure the port is free, default is 5110
lsof -iTCP:5110 -sTCP:LISTEN -P -n || true
export ASPNETCORE_URLS="http://127.0.0.1:5110"
dotnet run --urls "http://127.0.0.1:5110"
```

Convenience: a helper script is included which will free the port and start the API:

```bash
chmod +x ./scripts/start-api.sh
./scripts/start-api.sh 5110
```

Start the frontend (Angular):

```bash
cd EvidenAuctionHouse
npm install
npm run start
# or build for production
npm run build
```

Notes for testing admin endpoints
- Admin endpoints require a JWT. For local testing you can create a HS256 token with secret `GGALKANE` (this is used by `TokensService` in the API). Use caution and do not use this secret in production.


### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)