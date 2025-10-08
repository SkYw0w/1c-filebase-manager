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
            this.logger.debug(`OneScript check: success=${result.success}, exitCode=${result.exitCode}`);
            return result.success && result.exitCode === 0;
        } catch (error) {
            this.logger.debug(`OneScript not found during check: ${error}`);
            return false;
        }
    }

    public async checkDependencies(): Promise<{ [key: string]: boolean }> {
        const dependencies = ['vanessa-runner', 'cpdb', 'fs', 'ParserFileV8i', 'gitsync'];
        const results: { [key: string]: boolean } = {};

        for (const dep of dependencies) {
            const result = await this.executeCommand(`-check ${dep}`);
            results[dep] = result.success && result.exitCode === 0;
            this.logger.debug(`Dependency ${dep}: ${results[dep] ? 'installed' : 'not installed'}`);
        }

        return results;
    }

    public async installDependencies(): Promise<boolean> {
        const dependencies = ['vanessa-runner', 'cpdb', 'fs', 'ParserFileV8i', 'gitsync'];
        
        this.logger.info('Starting OneScript dependencies installation...');

        for (const dep of dependencies) {
            try {
                this.logger.info(`Installing ${dep}...`);
                const result = await this.executeOpmCommand(`install ${dep}`);
                
                if (!result.success) {
                    this.logger.error(`Error installing ${dep}: ${result.stderr}`);
                    return false;
                }
                
                this.logger.info(`${dep} successfully installed`);
            } catch (error) {
                this.logger.error(`Error installing ${dep}`, error as Error);
                return false;
            }
        }

        this.logger.info('All dependencies successfully installed');
        return true;
    }

    private async executeCommand(args: string): Promise<OnescriptExecutionResult> {
        return new Promise((resolve) => {
            const onescriptPath = this.getOnescriptPath();
            
            // Обрамляем путь в кавычки, если содержит пробелы
            const quotedPath = onescriptPath.includes(' ') ? `"${onescriptPath}"` : onescriptPath;
            const command = `${quotedPath} ${args}`;
            
            this.logger.debug(`Executing command: ${command}`);

            exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                const result: OnescriptExecutionResult = {
                    success: !error,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: error ? error.code || 1 : 0
                };

                if (error) {
                    this.logger.debug(`Execution error: exitCode=${result.exitCode}, stderr=${stderr}`);
                }
                
                // Всегда resolve, чтобы можно было проверить exitCode
                resolve(result);
            });
        });
    }

    private async executeOpmCommand(args: string): Promise<OnescriptExecutionResult> {
        return new Promise((resolve) => {
            const command = `opm ${args}`;
            this.logger.debug(`Executing command: ${command}`);

            exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                const result: OnescriptExecutionResult = {
                    success: !error,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: error ? error.code || 1 : 0
                };

                if (error) {
                    this.logger.debug(`OPM execution error: exitCode=${result.exitCode}, stderr=${stderr}`);
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
            
            this.logger.debug(`Executing script: ${command}`);

            exec(command, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' }, (error, stdout, stderr) => {
                const result: OnescriptExecutionResult = {
                    success: !error,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: error ? error.code || 1 : 0
                };

                if (error) {
                    this.logger.error(`Script execution error ${scriptName}: exitCode=${result.exitCode}, stderr=${stderr}`);
                } else {
                    this.logger.debug(`Script ${scriptName} executed successfully`);
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

