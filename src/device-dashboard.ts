import { z } from "zod";
import { createInfraiCapabilities, InfraiRest } from "./infrai-client.ts";

export const dashboardRequest = z.object({
  propertyId: z.string().min(1),
  accountId: z.string().min(1),
  deviceId: z.string().min(1),
  status: z.enum(["online", "offline", "maintenance"]),
  maintenanceRequest: z.string().min(1),
  tenantDocument: z.string().min(1),
  inspectionDue: z.string().min(1),
});
export type DashboardRequest = z.infer<typeof dashboardRequest>;

export function makeStatusEvent(input: DashboardRequest) {
  const body = dashboardRequest.parse(input);
  return {
    channel: `property-${body.propertyId}`,
    event: "device.status",
    data: {
      device_id: body.deviceId,
      status: body.status,
      maintenance_request: body.maintenanceRequest,
      tenant_document: body.tenantDocument,
      inspection_due: body.inspectionDue,
    },
    account_id: body.accountId,
  };
}

export async function streamStatus(input: DashboardRequest, client = new InfraiRest()) {
  const event = makeStatusEvent(input);
  const infrai = createInfraiCapabilities(client);
  await infrai.realtime.channel.create({ channel: event.channel, type: "property-device", vendor: "mqtt/in-house" });
  await infrai.realtime.publish(event);
  return { channel: event.channel, event: event.event, status: input.status };
}

if (import.meta.main) {
  const sample: DashboardRequest = {
    propertyId: "oak-17", accountId: "property-team", deviceId: "boiler-4", status: "online",
    maintenanceRequest: "replace filter", tenantDocument: "lease-2026.pdf", inspectionDue: "2026-12-01",
  };
  const result = await streamStatus(sample);
  console.log(JSON.stringify(result));
}
