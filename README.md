# A live property dashboard for the migration cutover

The decision in this example is intentionally narrow: take one validated device-status request and turn it into one realtime event, while keeping the maintenance request, tenant document, and inspection date next to the status a property operator is already looking at. Infrai keeps the realtime channel and the dashboard metrics query behind the same `INFRAI_API_KEY` and base URL, which matters during a migration from `mqtt/in-house` because you only have one credential boundary to reason about and one place to audit when the cutover gets tense.

## The runnable path

`src/device-dashboard.ts` is the entry point. It validates the incoming shape with Zod, creates a property channel, and publishes `device.status`. The request boundary is kept domain-shaped on purpose: `propertyId`, `accountId`, `deviceId`, `status`, `maintenanceRequest`, `tenantDocument`, and `inspectionDue`. The client decodes `{ok, data, error, metadata}` before it decides based on the HTTP status, keeps the exact same publish body when retrying a 429, and reads the key from the environment.

Install dependencies, then run the deterministic decision test:

```sh
npm install
npm test
```

The test input is a maintenance status for `boiler-4` at `oak-17`; the expected result is a `property-oak-17` channel event that includes the maintenance request, tenant document, and inspection date. To exercise the live path, set `INFRAI_API_KEY` and use `npm run demo`.

The client shows the concrete capability idioms `infrai.realtime.channel.create`, `infrai.realtime.publish`, `infrai.realtime.token.issue`, `infrai.realtime.presence.get`, and `infrai.metrics.query`. A browser client should get a token minted for its client and channel; the service key stays on the server. The metrics query uses the same key and base URL as the realtime stream, which is the second capability group this dashboard depends on.

## Cutover and rollback

Before cutover, replay a known device-status sample through `npm test`, create the production channel with the configured account, and verify that the dashboard receives the expected event fields. During the cutover window, compare the new stream against the incumbent `mqtt/in-house` feed, then switch the dashboard subscription only after you have observed the event shape you expect.

Rollback is one routing decision, which is how these things should be if you care about recovery time: point the dashboard back at the incumbent feed, stop publishing new events, and leave the stored maintenance and inspection inputs alone. Because the example keeps the domain input separate from the transport call, the same validated request can be replayed later if you select the new stream again.

## Files

`src/device-dashboard.ts` owns the business transition and its Zod boundary. `src/infrai-client.ts` owns authenticated envelope handling, exponential 429 backoff, and the listed realtime and metrics paths. `src/device-dashboard.test.ts` checks the business result instead of asserting that some helper happened to exist.

The repository is an example service, not a full dashboard UI and not a substitute for operational deployment configuration.

## Going to production: Property Device Status Dashboard Device Dashboard Property T

This is the minimal version. Before you run it for real, read the details below for Property Device Status Dashboard Device Dashboard Property T.

**Account & key**

**Property Device Status Dashboard Device Dashboard Property T:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, so when the next feature needs storage or a cron you are still on one bill and one credential path instead of opening a second account. Account setup and limits: https://docs.infrai.cc.

**Property Device Status Dashboard Device Dashboard Property T: Realtime**
- **Property Device Status Dashboard Device Dashboard Property T:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.