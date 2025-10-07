import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';
import { OnescriptManager } from './onescriptManager';
import { InfoBase, CreateBaseOptions, UpdateBaseOptions, ExtensionOptions, DumpOptions } from './models';

export class InfobaseManager {
    private static instance: InfobaseManager;
    private logger: Logger;
    private onescriptManager: OnescriptManager;
    private extensionPath: string;

    private constructor(context: vscode.ExtensionContext) {
        this.logger = Logger.getInstance();
        this.onescriptManager = OnescriptManager.getInstance();
        this.extensionPath = context.extensionPath;
    }

    public static getInstance(context?: vscode.ExtensionContext): InfobaseManager {
        if (!InfobaseManager.instance && context) {
            InfobaseManager.instance = new InfobaseManager(context);
        }
        return InfobaseManager.instance;
    }

    /**
     * Получает список всех информационных баз через cpdb
     */
    public async listInfobases(): Promise<InfoBase[]> {
        try {
            this.logger.info('Получение списка информационных баз...');
            const result = await this.onescriptManager.executeScript('listBases.os');
            
            if (result.success && result.stdout) {
                const bases: InfoBase[] = JSON.parse(result.stdout);
                this.logger.info(`Найдено баз: ${bases.length}`);
                return bases;
            }
            
            return [];
        } catch (error) {
            this.logger.error('Ошибка при получении списка баз', error as Error);
            return [];
        }
    }

    /**
     * Создает новую информационную базу
     */
    public async createInfobase(options: CreateBaseOptions): Promise<boolean> {
        try {
            this.logger.info(`Создание информационной базы: ${options.name}`);

            const args = [
                options.name,
                options.basePath,
                options.sourceType,
                options.sourcePath,
                options.gitBranch || '',
                options.gitRepo || ''
            ];

            const result = await this.onescriptManager.executeScript('createBase.os', args);

            if (result.success) {
                this.logger.info(`База ${options.name} успешно создана`);
                vscode.window.showInformationMessage(`База ${options.name} успешно создана`);
                return true;
            } else {
                this.logger.error(`Ошибка создания базы: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Ошибка при создании информационной базы', error as Error);
            return false;
        }
    }

    /**
     * Обновляет конфигурацию информационной базы
     */
    public async updateConfiguration(options: UpdateBaseOptions): Promise<boolean> {
        try {
            this.logger.info(`Обновление конфигурации базы: ${options.baseName}`);

            const args = [
                options.baseName,
                options.sourceType,
                options.sourcePath,
                options.gitBranch || ''
            ];

            const result = await this.onescriptManager.executeScript('updateBase.os', args);

            if (result.success) {
                this.logger.info(`Конфигурация базы ${options.baseName} успешно обновлена`);
                vscode.window.showInformationMessage(`Конфигурация обновлена`);
                return true;
            } else {
                this.logger.error(`Ошибка обновления: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Ошибка при обновлении конфигурации', error as Error);
            return false;
        }
    }

    /**
     * Подключает расширение к информационной базе
     */
    public async attachExtension(options: ExtensionOptions): Promise<boolean> {
        try {
            this.logger.info(`Подключение расширения к базе: ${options.baseName}`);

            const args = [
                options.baseName,
                options.sourceType,
                options.sourcePath,
                options.extensionName
            ];

            const result = await this.onescriptManager.executeScript('attachExtension.os', args);

            if (result.success) {
                this.logger.info(`Расширение успешно подключено к базе ${options.baseName}`);
                vscode.window.showInformationMessage(`Расширение подключено`);
                return true;
            } else {
                this.logger.error(`Ошибка подключения расширения: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Ошибка при подключении расширения', error as Error);
            return false;
        }
    }

    /**
     * Выгружает базу в файлы
     */
    public async dumpToFiles(options: DumpOptions): Promise<boolean> {
        try {
            this.logger.info(`Выгрузка базы ${options.baseName} в ${options.dumpType}`);

            const args = [
                options.baseName,
                options.dumpType,
                options.destinationPath
            ];

            const result = await this.onescriptManager.executeScript('dumpBase.os', args);

            if (result.success) {
                this.logger.info(`База успешно выгружена в ${options.destinationPath}`);
                vscode.window.showInformationMessage(`База выгружена успешно`);
                return true;
            } else {
                this.logger.error(`Ошибка выгрузки: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Ошибка при выгрузке базы', error as Error);
            return false;
        }
    }

    /**
     * Открывает базу в 1С:Предприятие
     */
    public async openEnterprise(baseName: string): Promise<boolean> {
        try {
            this.logger.info(`Открытие базы ${baseName} в 1С:Предприятие`);
            const result = await this.onescriptManager.executeScript('openEnterprise.os', [baseName]);
            return result.success;
        } catch (error) {
            this.logger.error('Ошибка при открытии 1С:Предприятие', error as Error);
            return false;
        }
    }

    /**
     * Открывает базу в Конфигураторе
     */
    public async openDesigner(baseName: string): Promise<boolean> {
        try {
            this.logger.info(`Открытие базы ${baseName} в Конфигураторе`);
            const result = await this.onescriptManager.executeScript('openDesigner.os', [baseName]);
            return result.success;
        } catch (error) {
            this.logger.error('Ошибка при открытии Конфигуратора', error as Error);
            return false;
        }
    }

    /**
     * Получает информацию о базе
     */
    public async getBaseInfo(baseName: string): Promise<any> {
        try {
            this.logger.info(`Получение информации о базе: ${baseName}`);
            const result = await this.onescriptManager.executeScript('getBaseInfo.os', [baseName]);
            
            if (result.success && result.stdout) {
                return JSON.parse(result.stdout);
            }
            
            return null;
        } catch (error) {
            this.logger.error('Ошибка при получении информации о базе', error as Error);
            return null;
        }
    }

    /**
     * Создает резервную копию базы
     */
    public async createBackup(baseName: string, backupPath: string): Promise<boolean> {
        try {
            this.logger.info(`Создание резервной копии базы: ${baseName}`);
            const result = await this.onescriptManager.executeScript('backupBase.os', [baseName, backupPath]);
            
            if (result.success) {
                this.logger.info(`Резервная копия создана: ${backupPath}`);
                vscode.window.showInformationMessage(`Резервная копия создана`);
                return true;
            }
            
            return false;
        } catch (error) {
            this.logger.error('Ошибка при создании резервной копии', error as Error);
            return false;
        }
    }

    /**
     * Удаляет информационную базу
     */
    public async deleteInfobase(baseName: string): Promise<boolean> {
        try {
            const confirmation = await vscode.window.showWarningMessage(
                `Вы уверены, что хотите удалить базу "${baseName}"? Это действие необратимо!`,
                { modal: true },
                'Удалить'
            );

            if (confirmation !== 'Удалить') {
                return false;
            }

            this.logger.info(`Удаление базы: ${baseName}`);
            const result = await this.onescriptManager.executeScript('deleteBase.os', [baseName]);
            
            if (result.success) {
                this.logger.info(`База ${baseName} успешно удалена`);
                vscode.window.showInformationMessage(`База удалена`);
                return true;
            }
            
            return false;
        } catch (error) {
            this.logger.error('Ошибка при удалении базы', error as Error);
            return false;
        }
    }

    /**
     * Вычисляет размер директории
     */
    private getDirectorySize(dirPath: string): number {
        let totalSize = 0;

        try {
            if (!fs.existsSync(dirPath)) {
                return 0;
            }

            const files = fs.readdirSync(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);

                if (stats.isDirectory()) {
                    totalSize += this.getDirectorySize(filePath);
                } else {
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            this.logger.debug(`Ошибка при подсчете размера директории ${dirPath}`);
        }

        return totalSize;
    }
}

