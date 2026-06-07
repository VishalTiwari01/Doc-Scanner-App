import { apiSlice } from '../../../services/api';

export interface HistoryItem {
  id: string;
  type: 'pdf_compress' | 'jpg_to_pdf' | 'ocr' | 'image_compress';
  fileName: string;
  originalSize: string;
  compressedSize: string;
  originalUrl: string;
  resultUrl: string;
  createdAt: string;
  extractedText?: string;
  structuredData?: Record<string, any>;
}

export const historyApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHistory: builder.query<{ success: boolean; data: HistoryItem[] }, void>({
      query: () => '/history',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'FileHistory' as const, id })),
              ...result.data.map(({ id }) => ({ type: 'OCRHistory' as const, id })),
              { type: 'FileHistory', id: 'LIST' },
              { type: 'OCRHistory', id: 'LIST' },
            ]
          : [
              { type: 'FileHistory', id: 'LIST' },
              { type: 'OCRHistory', id: 'LIST' },
            ],
    }),
    deleteHistoryItem: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/history/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'FileHistory', id },
        { type: 'OCRHistory', id },
        { type: 'FileHistory', id: 'LIST' },
        { type: 'OCRHistory', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const { useGetHistoryQuery, useDeleteHistoryItemMutation } = historyApi;
