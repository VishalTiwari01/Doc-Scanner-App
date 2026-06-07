import { apiSlice } from '../../../services/api';

export const compressApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    compressPDF: builder.mutation<
      {
        success: boolean;
        fileName: string;
        originalSize: string;
        compressedSize: string;
        downloadUrl: string;
        historyId: string;
      },
      FormData
    >({
      query: (formData) => ({
        url: '/pdf/compress',
        method: 'POST',
        body: formData,
        // Ensure headers are handled automatically for multipart/form-data
        formData: true,
      }),
      invalidatesTags: ['FileHistory'],
    }),
  }),
  overrideExisting: true,
});

export const { useCompressPDFMutation } = compressApi;
