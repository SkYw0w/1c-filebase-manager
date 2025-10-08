import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';
import { OnescriptManager } from './onescriptManager';
import { CreateBaseOptions, UpdateBaseOptions, ExtensionOptions, DumpOptions } from './models';

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
    public async listInfobases(): Promise<string[]> {
        try {
            this.logger.info('Getting list of infobases...');
            const result = await this.onescriptManager.executeScript('listBases.os');
            
            if (result.success && result.stdout) {
                const bases: string[] = JSON.parse(result.stdout);
                this.logger.info(`Found ${bases.length} infobases`);
                return bases;
            }
            
            return [];
        } catch (error) {
            this.logger.error('Error getting list of infobases', error as Error);
            return [];
        }
    }

    /**
     * Создает новую информационную базу
     */
    public async createInfobase(options: CreateBaseOptions): Promise<boolean> {
        try {
            this.logger.info(`Creating infobase: ${options.name}`);

            // Получаем версию платформы из настроек
            const config = vscode.workspace.getConfiguration('1c-filebase-manager');
            const platformVersion = config.get<string>('platformVersion', '8.3.27.1688');

            const args = [
                options.name,
                options.basePath,
                options.sourceType,
                options.sourcePath,
                platformVersion,
                options.gitBranch || '',
                options.gitRepo || ''
            ];

            const result = await this.onescriptManager.executeScript('createBase.os', args);

            if (result.success) {
                this.logger.info(`Infobase ${options.name} successfully created`);
                vscode.window.showInformationMessage(`База ${options.name} успешно создана`);
                return true;
            } else {
                this.logger.error(`Infobase creation error: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Error creating infobase', error as Error);
            return false;
        }
    }

    /**
     * Обновляет конфигурацию информационной базы
     */
    public async updateConfiguration(options: UpdateBaseOptions): Promise<boolean> {
        try {
            this.logger.info(`Updating configuration: ${options.baseName}`);

            const config = vscode.workspace.getConfiguration('1c-filebase-manager');
            const platformVersion = config.get<string>('platformVersion', '8.3.27.1688');

            const args = [
                options.baseName,
                options.sourceType,
                options.sourcePath,
                platformVersion
            ];

            const result = await this.onescriptManager.executeScript('updateBase.os', args);

            if (result.success) {
                this.logger.info(`Configuration ${options.baseName} successfully updated`);
                vscode.window.showInformationMessage(`Конфигурация обновлена`);
                return true;
            } else {
                this.logger.error(`Update error: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Error updating configuration', error as Error);
            return false;
        }
    }

    /**
     * Подключает расширение к информационной базе
     */
    public async attachExtension(options: ExtensionOptions): Promise<boolean> {
        try {
            this.logger.info(`Attaching extension to: ${options.baseName}`);

            const config = vscode.workspace.getConfiguration('1c-filebase-manager');
            const platformVersion = config.get<string>('platformVersion', '8.3.27.1688');

            const args = [
                options.baseName,
                options.sourceType,
                options.sourcePath,
                options.extensionName,
                platformVersion
            ];

            const result = await this.onescriptManager.executeScript('attachExtension.os', args);

            if (result.success) {
                this.logger.info(`Extension successfully attached to ${options.baseName}`);
                vscode.window.showInformationMessage(`Расширение подключено`);
                return true;
            } else {
                this.logger.error(`Extension attachment error: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Error attaching extension', error as Error);
            return false;
        }
    }

    /**
     * Выгружает базу в файлы
     */
    public async dumpToFiles(options: DumpOptions): Promise<boolean> {
        try {
            this.logger.info(`Dumping ${options.baseName} to ${options.dumpType}`);

            const config = vscode.workspace.getConfiguration('1c-filebase-manager');
            const platformVersion = config.get<string>('platformVersion', '8.3.27.1688');

            const args = [
                options.baseName,
                options.dumpType,
                options.destinationPath,
                platformVersion
            ];

            const result = await this.onescriptManager.executeScript('dumpBase.os', args);

            if (result.success) {
                this.logger.info(`Successfully dumped to ${options.destinationPath}`);
                vscode.window.showInformationMessage(`База выгружена успешно`);
                return true;
            } else {
                this.logger.error(`Dump error: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Error dumping infobase', error as Error);
            return false;
        }
    }

    /**
     * Открывает базу в 1С:Предприятие
     */
    public async openEnterprise(baseName: string): Promise<boolean> {
        try {
            this.logger.info(`Opening ${baseName} in 1C:Enterprise`);
            
            const config = vscode.workspace.getConfiguration('1c-filebase-manager');
            const platformVersion = config.get<string>('platformVersion', '8.3.27.1688');
            
            const args = [baseName, platformVersion];
            const result = await this.onescriptManager.executeScript('openEnterprise.os', args);
            
            if (result.success) {
                vscode.window.showInformationMessage(`База ${baseName} открыта в 1С:Предприятие`);
                return true;
            } else {
                this.logger.error(`Error opening in 1C:Enterprise: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Error opening 1C:Enterprise', error as Error);
            return false;
        }
    }

    /**
     * Открывает базу в Конфигураторе
     */
    public async openDesigner(baseName: string): Promise<boolean> {
        try {
            this.logger.info(`Opening ${baseName} in Designer`);
            
            const config = vscode.workspace.getConfiguration('1c-filebase-manager');
            const platformVersion = config.get<string>('platformVersion', '8.3.27.1688');
            
            const args = [baseName, platformVersion];
            const result = await this.onescriptManager.executeScript('openDesigner.os', args);
            
            if (result.success) {
                vscode.window.showInformationMessage(`База ${baseName} открыта в Конфигураторе`);
                return true;
            } else {
                this.logger.error(`Error opening in Designer: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Error opening Designer', error as Error);
            return false;
        }
    }

    /**
     * Получает информацию о базе
     */
    public async getBaseInfo(baseName: string): Promise<any> {
        try {
            this.logger.info(`Getting infobase info: ${baseName}`);
            const result = await this.onescriptManager.executeScript('getBaseInfo.os', [baseName]);
            
            if (result.success && result.stdout) {
                return JSON.parse(result.stdout);
            }
            
            return null;
        } catch (error) {
            this.logger.error('Error getting infobase info', error as Error);
            return null;
        }
    }

    /**
     * Создает резервную копию базы
     */
    public async createBackup(baseName: string, backupPath: string): Promise<boolean> {
        try {
            this.logger.info(`Creating backup: ${baseName}`);
            const result = await this.onescriptManager.executeScript('backupBase.os', [baseName, backupPath]);
            
            if (result.success) {
                this.logger.info(`Backup created: ${backupPath}`);
                vscode.window.showInformationMessage(`Резервная копия создана`);
                return true;
            }
            
            return false;
        } catch (error) {
            this.logger.error('Error creating backup', error as Error);
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

            this.logger.info(`Deleting infobase: ${baseName}`);
            const result = await this.onescriptManager.executeScript('deleteBase.os', [baseName]);
            
            if (result.success) {
                this.logger.info(`Infobase ${baseName} successfully deleted`);
                vscode.window.showInformationMessage(`База удалена`);
                return true;
            }
            
            return false;
        } catch (error) {
            this.logger.error('Error deleting infobase', error as Error);
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
            this.logger.debug(`Error calculating directory size ${dirPath}`);
        }

        return totalSize;
    }
}

