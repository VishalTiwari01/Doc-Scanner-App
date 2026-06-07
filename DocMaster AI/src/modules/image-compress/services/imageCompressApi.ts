import { apiSlice } from '../../../services/api';

export interface ImageCompressResponse {
  success: boolean;
  fileName: string;
  originalSize: string;
  compressedSize: string;
  downloadUrl: string;
  historyId: string;
}

export const imageCompressApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    compressImage: builder.mutation<ImageCompressResponse, FormData>({
      query: (formData) => ({
        url: '/image/compress',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useCompressImageMutation } = imageCompressApi;
