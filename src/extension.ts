import * as vscode from 'vscode';
import { FilebaseManagerViewProvider } from './webviewProvider';
import { Logger } from './logger';
import { OnescriptManager } from './onescriptManager';
import { InfobaseManager } from './infobaseManager';

export async function activate(context: vscode.ExtensionContext) {
    console.log('1C FileBase Manager активирован');

    // Инициализация логгера
    const logger = Logger.getInstance(context);
    logger.info('1C FileBase Manager запущен');

    // Инициализация менеджеров
    const onescriptManager = OnescriptManager.getInstance(context);
    const infobaseManager = InfobaseManager.getInstance(context);

    // Регистрация WebView провайдера
    const provider = new FilebaseManagerViewProvider(context.extensionUri, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            FilebaseManagerViewProvider.viewType, 
            provider
        )
    );

    // Регистрация команд
    context.subscriptions.push(
        vscode.commands.registerCommand('1c-filebase-manager.openManager', () => {
            vscode.commands.executeCommand('workbench.view.extension.1c-filebase-manager');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('1c-filebase-manager.checkDependencies', async () => {
            const installed = await onescriptManager.checkOnescriptInstalled();
            
            if (!installed) {
                vscode.window.showErrorMessage('OneScript не установлен. Установите OneScript для работы расширения.');
                return;
            }

            const deps = await onescriptManager.checkDependencies();
            const missing = Object.entries(deps)
                .filter(([_, installed]) => !installed)
                .map(([name, _]) => name);

            if (missing.length === 0) {
                vscode.window.showInformationMessage('Все зависимости установлены!');
            } else {
                vscode.window.showWarningMessage(
                    `Отсутствуют зависимости: ${missing.join(', ')}. Установите их через команду "Установить зависимости OneScript"`
                );
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('1c-filebase-manager.installDependencies', async () => {
            const installed = await onescriptManager.checkOnescriptInstalled();
            
            if (!installed) {
                vscode.window.showErrorMessage('OneScript не установлен. Установите OneScript сначала.');
                return;
            }

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Установка зависимостей OneScript...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                
                const success = await onescriptManager.installDependencies();
                
                if (success) {
                    vscode.window.showInformationMessage('Зависимости успешно установлены!');
                } else {
                    vscode.window.showErrorMessage('Ошибка при установке зависимостей. Проверьте логи.');
                }
                
                progress.report({ increment: 100 });
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('1c-filebase-manager.refreshBases', async () => {
            const bases = await infobaseManager.listInfobases();
            vscode.window.showInformationMessage(`Найдено баз: ${bases.length}`);
        })
    );

    logger.info('1C FileBase Manager полностью загружен');
}

export function deactivate() {
    const logger = Logger.getInstance();
    logger.info('1C FileBase Manager деактивирован');
}
