import apiClient from './apiClient';

const workpassEndpoint = '/workpass-validation';

export async function validateWorkpass(serialNumber: string) {
  return apiClient.post(`${workpassEndpoint}/`, {
    serialNumber,
  });
}
