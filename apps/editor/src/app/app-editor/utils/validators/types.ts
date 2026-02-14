export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

export interface ValidationError {
    path: string;      // e.g., "fields[2].type"
    message: string;   // Human-readable error
    severity: 'error' | 'warning';
}
