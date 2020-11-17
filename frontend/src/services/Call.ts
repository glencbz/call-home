import apiClient from './apiClient';

export interface RecentCall {
  id: number;
  duration: number;
  name: string;
  phoneNumber: string;
  startTime: string;
}

// TODO make this configurable
const callEndpoint = '/users/:userId/calls';

function userCallEndpoint(userId: string) {
  return callEndpoint.replace(':userId', userId);
}

export async function getRecentCalls(userId: string): Promise<RecentCall[]> {
  return apiClient.get(`${userCallEndpoint(userId)}/recent`);
}

// This is more of a debug endpoint than anything
export default async function getCallSummary(userId: string) {
  return apiClient.get(`${userCallEndpoint(userId)}/call-summary`);
}
