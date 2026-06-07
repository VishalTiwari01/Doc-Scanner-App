import { apiSlice } from '../../../services/api';

export interface OCRResponse {
  success: boolean;
  documentType: 'generic' | 'aadhaar' | 'pan' | 'passport';
  extractedText: string;
  structuredData?: Record<string, any>;
  imageUrl: string;
  historyId: string;
}

export const ocrApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    processOCR: builder.mutation<OCRResponse, FormData>({
      query: (formData) => ({
        url: '/ocr/process',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['OCRHistory'],
    }),
  }),
  overrideExisting: true,
});

export const { useProcessOCRMutation } = ocrApi;
