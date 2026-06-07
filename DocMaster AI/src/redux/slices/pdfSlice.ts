import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectedFile {
  name: string;
  size: number;
  uri: string;
  type?: string;
}

interface CompressedResult {
  fileName: string;
  originalSize: string;
  compressedSize: string;
  downloadUrl: string;
  historyId: string;
}

interface PdfState {
  selectedFile: SelectedFile | null;
  compressionLevel: 'low' | 'medium' | 'high';
  compressedResult: CompressedResult | null;
}

const initialState: PdfState = {
  selectedFile: null,
  compressionLevel: 'medium',
  compressedResult: null,
};

const pdfSlice = createSlice({
  name: 'pdf',
  initialState,
  reducers: {
    setSelectedFile: (state, action: PayloadAction<SelectedFile | null>) => {
      state.selectedFile = action.payload;
      state.compressedResult = null; // Clear previous results when selecting new file
    },
    setCompressionLevel: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.compressionLevel = action.payload;
    },
    setCompressedResult: (state, action: PayloadAction<CompressedResult | null>) => {
      state.compressedResult = action.payload;
    },
    clearPdfState: (state) => {
      state.selectedFile = null;
      state.compressionLevel = 'medium';
      state.compressedResult = null;
    },
  },
});

export const { setSelectedFile, setCompressionLevel, setCompressedResult, clearPdfState } = pdfSlice.actions;
export default pdfSlice.reducer;
