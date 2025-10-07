export interface CreateBaseOptions {
    name: string;
    basePath: string;
    sourceType: 'cf' | 'sources' | 'git';
    sourcePath: string;
    gitBranch?: string;
    gitRepo?: string;
}

export interface UpdateBaseOptions {
    baseName: string;
    sourceType: 'cf' | 'sources' | 'git';
    sourcePath: string;
    gitBranch?: string;
}

export interface ExtensionOptions {
    baseName: string;
    sourceType: 'cfe' | 'sources';
    sourcePath: string;
    extensionName: string;
}

export interface DumpOptions {
    baseName: string;
    dumpType: 'sources' | 'cf' | 'dt';
    destinationPath: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class ConnectionStringValidator {
    /**
     * Проверяет строку подключения на отсутствие серверных параметров
     */
    public static validate(connectionString: string): ValidationResult {
        const errors: string[] = [];

        // Проверка на серверные подключения
        if (connectionString.includes('Srvr=') || connectionString.includes('/S')) {
            errors.push('Запрещены серверные подключения. Используйте только файловые базы.');
        }

        // Проверка на наличие параметра /F для файловых баз
        if (!connectionString.includes('/F') && !connectionString.includes('File=')) {
            errors.push('Укажите путь к файловой базе через параметр /F или File=');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Извлекает путь к базе из строки подключения
     */
    public static extractPath(connectionString: string): string | null {
        const fileMatch = connectionString.match(/\/F["']?([^"';]+)["']?/i) ||
                         connectionString.match(/File=["']?([^"';]+)["']?/i);
        
        return fileMatch ? fileMatch[1] : null;
    }

    /**
     * Создает безопасную строку подключения для файловой базы
     */
    public static createFileConnectionString(basePath: string): string {
        return `/F"${basePath}"`;
    }
}

