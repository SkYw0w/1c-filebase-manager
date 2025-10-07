import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
    private logFilePath: string;
    private currentLogLevel: LogLevel = LogLevel.INFO;

    private constructor(context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('1C FileBase Manager');
        this.logFilePath = path.join(context.extensionPath, 'logs', 'extension.log');
        
        // Создаем директорию для логов
        const logDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Получаем уровень логирования из настроек
        this.updateLogLevel();
    }

    public static getInstance(context?: vscode.ExtensionContext): Logger {
        if (!Logger.instance && context) {
            Logger.instance = new Logger(context);
        }
        return Logger.instance;
    }

    public updateLogLevel(): void {
        const config = vscode.workspace.getConfiguration('1c-filebase-manager');
        const level = config.get<string>('logLevel', 'INFO');
        this.currentLogLevel = LogLevel[level as keyof typeof LogLevel];
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.currentLogLevel;
    }

    private formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }

    private writeToFile(message: string): void {
        try {
            fs.appendFileSync(this.logFilePath, message + '\n', 'utf8');
            
            // Ротация логов по размеру (10MB)
            const stats = fs.statSync(this.logFilePath);
            if (stats.size > 10 * 1024 * 1024) {
                const backupPath = this.logFilePath + '.old';
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                }
                fs.renameSync(this.logFilePath, backupPath);
            }
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    public error(message: string, error?: Error): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const fullMessage = error ? `${message}: ${error.message}\n${error.stack}` : message;
            const formattedMessage = this.formatMessage('ERROR', fullMessage);
            this.outputChannel.appendLine(formattedMessage);
            this.writeToFile(formattedMessage);
            vscode.window.showErrorMessage(`1C FileBase Manager: ${message}`);
        }
    }

    public warn(message: string): void {
        if (this.shouldLog(LogLevel.WARN)) {
            const formattedMessage = this.formatMessage('WARN', message);
            this.outputChannel.appendLine(formattedMessage);
            this.writeToFile(formattedMessage);
            vscode.window.showWarningMessage(`1C FileBase Manager: ${message}`);
        }
    }

    public info(message: string): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const formattedMessage = this.formatMessage('INFO', message);
            this.outputChannel.appendLine(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }

    public debug(message: string): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            const formattedMessage = this.formatMessage('DEBUG', message);
            this.outputChannel.appendLine(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }

    public show(): void {
        this.outputChannel.show();
    }

    public getLogFilePath(): string {
        return this.logFilePath;
    }
}

