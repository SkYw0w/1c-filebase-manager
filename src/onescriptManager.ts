import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import { Logger } from './logger';

export interface OnescriptExecutionResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
}

export class OnescriptManager {
    private static instance: OnescriptManager;
    private logger: Logger;
    private extensionPath: string;

    private constructor(context: vscode.ExtensionContext) {
        this.logger = Logger.getInstance();
        this.extensionPath = context.extensionPath;
    }

    public static getInstance(context?: vscode.ExtensionContext): OnescriptManager {
        if (!OnescriptManager.instance && context) {
            OnescriptManager.instance = new OnescriptManager(context);
        }
        return OnescriptManager.instance;
    }

    private getOnescriptPath(): string {
        const config = vscode.workspace.getConfiguration('1c-filebase-manager');
        return config.get<string>('onescriptPath', 'oscript');
    }

    public async checkOnescriptInstalled(): Promise<boolean> {
        try {
            const result = await this.executeCommand('--version');
            this.logger.debug(`OneScript проверка: success=${result.success}, exitCode=${result.exitCode}`);
            return result.success && result.exitCode === 0;
        } catch (error) {
            this.logger.debug(`OneScript не найден при проверке: ${error}`);
            return false;
        }
    }

    public async checkDependencies(): Promise<{ [key: string]: boolean }> {
        const dependencies = ['vanessa-runner', 'cpdb', 'fs', 'ParserFileV8i', 'gitsync'];
        const results: { [key: string]: boolean } = {};

        for (const dep of dependencies) {
            const result = await this.executeCommand(`-check ${dep}`);
            results[dep] = result.success && result.exitCode === 0;
            this.logger.debug(`Зависимость ${dep}: ${results[dep] ? 'установлена' : 'не установлена'}`);
        }

        return results;
    }

    public async installDependencies(): Promise<boolean> {
        const dependencies = ['vanessa-runner', 'cpdb', 'fs', 'ParserFileV8i', 'gitsync'];
        
        this.logger.info('Начинается установка зависимостей OneScript...');

        for (const dep of dependencies) {
            try {
                this.logger.info(`Установка ${dep}...`);
                const result = await this.executeOpmCommand(`install ${dep}`);
                
                if (!result.success) {
                    this.logger.error(`Ошибка при установке ${dep}: ${result.stderr}`);
                    return false;
                }
                
                this.logger.info(`${dep} успешно установлен`);
            } catch (error) {
                this.logger.error(`Ошибка при установке ${dep}`, error as Error);
                return false;
            }
        }

        this.logger.info('Все зависимости успешно установлены');
        return true;
    }

    private async executeCommand(args: string): Promise<OnescriptExecutionResult> {
        return new Promise((resolve) => {
            const onescriptPath = this.getOnescriptPath();
            
            // Обрамляем путь в кавычки, если содержит пробелы
            const quotedPath = onescriptPath.includes(' ') ? `"${onescriptPath}"` : onescriptPath;
            const command = `${quotedPath} ${args}`;
            
            this.logger.debug(`Выполнение команды: ${command}`);

            exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                const result: OnescriptExecutionResult = {
                    success: !error,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: error ? error.code || 1 : 0
                };

                if (error) {
                    this.logger.debug(`Ошибка выполнения: exitCode=${result.exitCode}, stderr=${stderr}`);
                }
                
                // Всегда resolve, чтобы можно было проверить exitCode
                resolve(result);
            });
        });
    }

    private async executeOpmCommand(args: string): Promise<OnescriptExecutionResult> {
        return new Promise((resolve) => {
            const command = `opm ${args}`;
            this.logger.debug(`Выполнение команды: ${command}`);

            exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                const result: OnescriptExecutionResult = {
                    success: !error,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: error ? error.code || 1 : 0
                };

                if (error) {
                    this.logger.debug(`Ошибка выполнения opm: exitCode=${result.exitCode}, stderr=${stderr}`);
                }
                
                // Всегда resolve для проверки exitCode
                resolve(result);
            });
        });
    }

    public async executeScript(scriptName: string, args: string[] = []): Promise<OnescriptExecutionResult> {
        const scriptPath = path.join(this.extensionPath, 'scripts', scriptName);
        const argsString = args.map(arg => `"${arg}"`).join(' ');
        
        return new Promise((resolve) => {
            const onescriptPath = this.getOnescriptPath();
            
            // Обрамляем путь в кавычки, если содержит пробелы
            const quotedPath = onescriptPath.includes(' ') ? `"${onescriptPath}"` : onescriptPath;
            
            // Для Windows устанавливаем UTF-8 кодовую страницу
            const command = process.platform === 'win32' 
                ? `chcp 65001 >nul && ${quotedPath} "${scriptPath}" ${argsString}`
                : `${quotedPath} "${scriptPath}" ${argsString}`;
            
            this.logger.debug(`Выполнение скрипта: ${command}`);

            exec(command, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' }, (error, stdout, stderr) => {
                const result: OnescriptExecutionResult = {
                    success: !error,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: error ? error.code || 1 : 0
                };

                if (error) {
                    this.logger.error(`Ошибка выполнения скрипта ${scriptName}: exitCode=${result.exitCode}, stderr=${stderr}`);
                } else {
                    this.logger.debug(`Скрипт ${scriptName} выполнен успешно`);
                }
                
                // Всегда resolve для проверки результата
                resolve(result);
            });
        });
    }

    public async get1CPlatformVersion(): Promise<string> {
        const config = vscode.workspace.getConfiguration('1c-filebase-manager');
        return config.get<string>('platformVersion', '8.3.27.1688');
    }
}

