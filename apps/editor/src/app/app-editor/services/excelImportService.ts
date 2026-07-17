import { ApiClient } from '@/common/api/ApiClient';

export interface ExcelSheet {
    name: string;
}

export interface ExcelColumn {
    original_header: string;
    name: string; // slug
    type: 'text' | 'number' | 'date' | 'boolean';
    is_primary: boolean;
    source_index?: number;
}

export interface ImportPreviewResponse {
    sheets: string[];
    columns: ExcelColumn[];
    preview: any[]; // Array of objects
    total_rows?: number; // Backend might not return total_rows in preview for speed
}

export const ExcelImportService = {
    async upload(file: File): Promise<{ file_path: string; original_name: string }> {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await ApiClient.post('/excel/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async uploadChunk(
        file: File,
        chunk: Blob,
        chunkIndex: number,
        totalChunks: number,
        uuid: string
    ): Promise<any> {
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunk_index', chunkIndex.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('uuid', uuid);
        formData.append('filename', file.name);

        const response = await ApiClient.post('/excel/upload-chunk', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async uploadChunked(
        file: File,
        onProgress: (percent: number) => void
    ): Promise<{ file_path: string; original_name: string }> {
        const chunkSize = 5 * 1024 * 1024; // 5MB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        // Use crypto.randomUUID() — supported in all target browsers (Chrome 92+, Android 10+)
        const uuid = crypto.randomUUID();

        let result: any = null;
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            
            result = await this.uploadChunk(file, chunk, i, totalChunks, uuid);
            onProgress(Math.round(((i + 1) / totalChunks) * 100));
        }
        return result;
    },

    async preview(filePath: string, sheet?: string): Promise<ImportPreviewResponse> {
        const response = await ApiClient.post('/excel/preview', {
            file_path: filePath,
            sheet
        });
        return response.data;
    },

    async import(appId: string | number, tableName: string, filePath: string, columns: ExcelColumn[], sheet?: string): Promise<{ success: true; table_id: string; job_id: string }> {
        const response = await ApiClient.post('/excel/import', {
            app_id: appId,
            table_name: tableName,
            file_path: filePath,
            sheet,
            columns
        });
        return response.data;
    },

    async checkStatus(jobId: string): Promise<{ status: string; rows_processed: number; message: string }> {
        const response = await ApiClient.get(`/excel/status/${jobId}`);
        return response.data;
    }
};
