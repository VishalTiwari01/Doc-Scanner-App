import { apiSlice } from '../../../services/api';

export const imageToPdfApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    imageToPDF: builder.mutation<
      {
        success: boolean;
        pdfUrl: string;
        historyId: string;
        originalSize?: string;
        pdfSize?: string;
      },
      FormData
    >({
      query: (formData) => ({
        url: '/pdf/image-to-pdf',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['FileHistory'],
    }),
  }),
  overrideExisting: true,
});

export const { useImageToPDFMutation } = imageToPdfApi;
