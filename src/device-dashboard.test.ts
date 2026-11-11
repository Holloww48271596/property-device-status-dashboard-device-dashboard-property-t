import test from "node:test";
import assert from "node:assert/strict";
import { makeStatusEvent } from "./device-dashboard.ts";

test("a maintenance status becomes the dashboard event with all property context", () => {
  const event = makeStatusEvent({
    propertyId: "oak-17", accountId: "property-team", deviceId: "boiler-4", status: "maintenance",
    maintenanceRequest: "replace filter", tenantDocument: "lease-2026.pdf", inspectionDue: "2026-12-01",
  });
  assert.deepEqual(event, {
    channel: "property-oak-17", event: "device.status",
    data: { device_id: "boiler-4", status: "maintenance", maintenance_request: "replace filter", tenant_document: "lease-2026.pdf", inspection_due: "2026-12-01" },
    account_id: "property-team",
  });
});
