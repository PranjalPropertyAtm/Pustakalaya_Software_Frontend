import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  Enquiry,
  FollowUp,
  ReminderLog,
  EnquiryTimelineEvent,
  EnquiryDashboardMetrics,
  EnquiryReports,
} from "@/types/enquiry";

export const enquiriesService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<{ items: Enquiry[]; pagination?: { total: number; page: number; limit: number } }>(
      apiClient.get(endpoints.enquiries, { params })
    ),
  getById: (id: string) => unwrap<Enquiry>(apiClient.get(endpoints.enquiry(id))),
  create: (body: Record<string, unknown>) =>
    unwrap<Enquiry>(apiClient.post(endpoints.enquiries, body)),
  update: (id: string, body: Record<string, unknown>) =>
    unwrap<Enquiry>(apiClient.patch(endpoints.enquiry(id), body)),
  remove: (id: string) =>
    unwrap<{ deletedEnquiryId: string; enquiryCode: string }>(
      apiClient.delete(endpoints.enquiry(id))
    ),
  close: (id: string, body?: { reason?: string }) =>
    unwrap<Enquiry>(apiClient.post(endpoints.enquiryClose(id), body ?? {})),
  cancel: (id: string, body?: { reason?: string }) =>
    unwrap<Enquiry>(apiClient.post(endpoints.enquiryCancel(id), body ?? {})),
  convert: (id: string, body: { studentId: string }) =>
    unwrap<Enquiry>(apiClient.post(endpoints.enquiryConvert(id), body)),
  listFollowUps: (id: string) =>
    unwrap<{ items: FollowUp[] }>(apiClient.get(endpoints.enquiryFollowUps(id))),
  addFollowUp: (id: string, body: Record<string, unknown>) =>
    unwrap<FollowUp>(apiClient.post(endpoints.enquiryFollowUps(id), body)),
  listReminders: (id: string) =>
    unwrap<{ items: ReminderLog[] }>(apiClient.get(endpoints.enquiryReminders(id))),
  createReminder: (id: string, body: Record<string, unknown>) =>
    unwrap<ReminderLog>(apiClient.post(endpoints.enquiryReminders(id), body)),
  getTimeline: (id: string) =>
    unwrap<{ enquiry: Enquiry; events: EnquiryTimelineEvent[] }>(
      apiClient.get(endpoints.enquiryTimeline(id))
    ),
  dashboard: (params?: Record<string, unknown>) =>
    unwrap<EnquiryDashboardMetrics>(apiClient.get(endpoints.enquiryDashboard, { params })),
  reports: (params?: Record<string, unknown>) =>
    unwrap<EnquiryReports>(apiClient.get(endpoints.enquiryReports, { params })),
  export: (params?: Record<string, unknown>) =>
    unwrap<{ columns: { key: string; header: string }[]; rows: Record<string, string>[] }>(
      apiClient.get(endpoints.enquiryExport, { params })
    ),
};
