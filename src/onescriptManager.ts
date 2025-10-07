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
            return result.success;
        } catch (error) {
            this.logger.error('OneScript не установлен или недоступен', error as Error);
            return false;
        }
    }

    public async checkDependencies(): Promise<{ [key: string]: boolean }> {
        const dependencies = ['vanessa-runner', 'cpdb', 'fs', 'ParserFileV8i', 'gitsync'];
        const results: { [key: string]: boolean } = {};

        for (const dep of dependencies) {
            try {
                const result = await this.executeCommand(`-check ${dep}`);
                results[dep] = result.exitCode === 0;
            } catch {
                results[dep] = false;
            }
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
        return new Promise((resolve, reject) => {
            const onescriptPath = this.getOnescriptPath();
            
            this.logger.debug(`Выполнение: ${onescriptPath} ${args}`);

            exec(`${onescriptPath} ${args}`, (error, stdout, stderr) => {
                const result: OnescriptExecutionResult = {
                    success: !error,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: error ? error.code || 1 : 0
                };

                if (error) {
                    this.logger.debug(`Ошибка выполнения: ${stderr}`);
                    reject(result);
                } else {
                    resolve(result);
                }
            });
        });
    }

    private async executeOpmCommand(args: string): Promise<OnescriptExecutionResult> {
        return new Promise((resolve, reject) => {
            this.logger.debug(`Выполнение: opm ${args}`);

            exec(`opm ${args}`, (error, stdout, stderr) => {
                const result: OnescriptExecutionResult = {
                    success: !error,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: error ? error.code || 1 : 0
                };

                if (error) {
                    this.logger.debug(`Ошибка выполнения opm: ${stderr}`);
                    reject(result);
                } else {
                    resolve(result);
                }
            });
        });
    }

    public async executeScript(scriptName: string, args: string[] = []): Promise<OnescriptExecutionResult> {
        const scriptPath = path.join(this.extensionPath, 'scripts', scriptName);
        const argsString = args.map(arg => `"${arg}"`).join(' ');
        
        return new Promise((resolve, reject) => {
            const onescriptPath = this.getOnescriptPath();
            const command = `${onescriptPath} "${scriptPath}" ${argsString}`;
            
            this.logger.debug(`Выполнение скрипта: ${command}`);

            exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
                const result: OnescriptExecutionResult = {
                    success: !error,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: error ? error.code || 1 : 0
                };

                if (error) {
                    this.logger.error(`Ошибка выполнения скрипта ${scriptName}: ${stderr}`);
                    reject(result);
                } else {
                    this.logger.debug(`Скрипт ${scriptName} выполнен успешно`);
                    resolve(result);
                }
            });
        });
    }

    public async get1CPlatformVersion(): Promise<string> {
        const config = vscode.workspace.getConfiguration('1c-filebase-manager');
        return config.get<string>('platformVersion', '8.3.27.1688');
    }
}

