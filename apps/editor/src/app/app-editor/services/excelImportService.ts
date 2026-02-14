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
