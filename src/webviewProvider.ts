import * as vscode from 'vscode';
import * as path from 'path';
import { Logger } from './logger';
import { InfobaseManager } from './infobaseManager';
import { OnescriptManager } from './onescriptManager';
import { CreateBaseOptions, UpdateBaseOptions, ExtensionOptions, DumpOptions, ConnectionStringValidator } from './models';

export class FilebaseManagerViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = '1c-filebase-manager.mainView';
    private _view?: vscode.WebviewView;
    private logger: Logger;
    private infobaseManager: InfobaseManager;
    private onescriptManager: OnescriptManager;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly context: vscode.ExtensionContext
    ) {
        this.logger = Logger.getInstance(context);
        this.infobaseManager = InfobaseManager.getInstance(context);
        this.onescriptManager = OnescriptManager.getInstance(context);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Обработка сообщений от webview
        webviewView.webview.onDidReceiveMessage(async data => {
            await this.handleMessage(data);
        });
    }

    private async handleMessage(data: any) {
        switch (data.type) {
            case 'getConfig':
                this.sendConfig();
                break;

            case 'updateConfig':
                await this.updateConfig(data.config);
                break;

            case 'listBases':
                await this.listBases();
                break;

            case 'createBase':
                await this.createBase(data.options);
                break;

            case 'updateBase':
                await this.updateBase(data.options);
                break;

            case 'attachExtension':
                await this.attachExtension(data.options);
                break;

            case 'dumpBase':
                await this.dumpBase(data.options);
                break;

            case 'openEnterprise':
                await this.openEnterprise(data.baseName);
                break;

            case 'openDesigner':
                await this.openDesigner(data.baseName);
                break;

            case 'getBaseInfo':
                await this.getBaseInfo(data.baseName);
                break;

            case 'createBackup':
                await this.createBackup(data.baseName, data.backupPath);
                break;

            case 'deleteBase':
                await this.deleteBase(data.baseName);
                break;

            case 'checkDependencies':
                await this.checkDependencies();
                break;

            case 'installDependencies':
                await this.installDependencies();
                break;

            case 'selectDirectory':
                await this.selectDirectory(data.purpose);
                break;

            case 'selectFile':
                await this.selectFile(data.purpose, data.filters);
                break;

            case 'getCurrentGitInfo':
                await this.getCurrentGitInfo();
                break;
        }
    }

    private sendConfig() {
        const config = vscode.workspace.getConfiguration('1c-filebase-manager');
        this._view?.webview.postMessage({
            type: 'config',
            config: {
                baseDirectory: config.get('baseDirectory', ''),
                sourceDirectory: config.get('sourceDirectory', 'src/cf'),
                platformVersion: config.get('platformVersion', '8.3.27.1688'),
                logLevel: config.get('logLevel', 'INFO')
            }
        });
    }

    private async updateConfig(newConfig: any) {
        const config = vscode.workspace.getConfiguration('1c-filebase-manager');
        
        for (const key in newConfig) {
            await config.update(key, newConfig[key], vscode.ConfigurationTarget.Global);
        }

        this.logger.info('Настройки обновлены');
        this.sendConfig();
    }

    private async listBases() {
        try {
            const bases = await this.infobaseManager.listInfobases();
            this._view?.webview.postMessage({
                type: 'basesList',
                bases: bases
            });
        } catch (error) {
            this.logger.error('Ошибка при получении списка баз', error as Error);
        }
    }

    private async createBase(options: CreateBaseOptions) {
        try {
            // Валидация пути базы
            const validation = ConnectionStringValidator.validate(`/F"${options.basePath}"`);
            if (!validation.isValid) {
                this._view?.webview.postMessage({
                    type: 'error',
                    message: validation.errors.join('\n')
                });
                return;
            }

            this._view?.webview.postMessage({ type: 'operationStart', operation: 'createBase' });
            
            const success = await this.infobaseManager.createInfobase(options);
            
            this._view?.webview.postMessage({ 
                type: 'operationEnd', 
                operation: 'createBase',
                success: success
            });

            if (success) {
                await this.listBases();
            }
        } catch (error) {
            this.logger.error('Ошибка при создании базы', error as Error);
            this._view?.webview.postMessage({
                type: 'operationEnd',
                operation: 'createBase',
                success: false
            });
        }
    }

    private async updateBase(options: UpdateBaseOptions) {
        try {
            this._view?.webview.postMessage({ type: 'operationStart', operation: 'updateBase' });
            
            const success = await this.infobaseManager.updateConfiguration(options);
            
            this._view?.webview.postMessage({ 
                type: 'operationEnd', 
                operation: 'updateBase',
                success: success
            });
        } catch (error) {
            this.logger.error('Ошибка при обновлении базы', error as Error);
        }
    }

    private async attachExtension(options: ExtensionOptions) {
        try {
            this._view?.webview.postMessage({ type: 'operationStart', operation: 'attachExtension' });
            
            const success = await this.infobaseManager.attachExtension(options);
            
            this._view?.webview.postMessage({ 
                type: 'operationEnd', 
                operation: 'attachExtension',
                success: success
            });
        } catch (error) {
            this.logger.error('Ошибка при подключении расширения', error as Error);
        }
    }

    private async dumpBase(options: DumpOptions) {
        try {
            this._view?.webview.postMessage({ type: 'operationStart', operation: 'dumpBase' });
            
            const success = await this.infobaseManager.dumpToFiles(options);
            
            this._view?.webview.postMessage({ 
                type: 'operationEnd', 
                operation: 'dumpBase',
                success: success
            });
        } catch (error) {
            this.logger.error('Ошибка при выгрузке базы', error as Error);
        }
    }

    private async openEnterprise(baseName: string) {
        await this.infobaseManager.openEnterprise(baseName);
    }

    private async openDesigner(baseName: string) {
        await this.infobaseManager.openDesigner(baseName);
    }

    private async getBaseInfo(baseName: string) {
        try {
            const info = await this.infobaseManager.getBaseInfo(baseName);
            this._view?.webview.postMessage({
                type: 'baseInfo',
                info: info
            });
        } catch (error) {
            this.logger.error('Ошибка при получении информации о базе', error as Error);
        }
    }

    private async createBackup(baseName: string, backupPath: string) {
        try {
            this._view?.webview.postMessage({ type: 'operationStart', operation: 'backup' });
            
            const success = await this.infobaseManager.createBackup(baseName, backupPath);
            
            this._view?.webview.postMessage({ 
                type: 'operationEnd', 
                operation: 'backup',
                success: success
            });
        } catch (error) {
            this.logger.error('Ошибка при создании резервной копии', error as Error);
        }
    }

    private async deleteBase(baseName: string) {
        const success = await this.infobaseManager.deleteInfobase(baseName);
        
        if (success) {
            await this.listBases();
        }
    }

    private async checkDependencies() {
        try {
            const installed = await this.onescriptManager.checkOnescriptInstalled();
            
            if (!installed) {
                this._view?.webview.postMessage({
                    type: 'dependenciesStatus',
                    onescriptInstalled: false,
                    dependencies: {}
                });
                return;
            }

            const deps = await this.onescriptManager.checkDependencies();
            
            this._view?.webview.postMessage({
                type: 'dependenciesStatus',
                onescriptInstalled: true,
                dependencies: deps
            });
        } catch (error) {
            this.logger.error('Ошибка при проверке зависимостей', error as Error);
        }
    }

    private async installDependencies() {
        try {
            this._view?.webview.postMessage({ type: 'operationStart', operation: 'installDeps' });
            
            const success = await this.onescriptManager.installDependencies();
            
            this._view?.webview.postMessage({ 
                type: 'operationEnd', 
                operation: 'installDeps',
                success: success
            });

            if (success) {
                await this.checkDependencies();
            }
        } catch (error) {
            this.logger.error('Ошибка при установке зависимостей', error as Error);
        }
    }

    private async selectDirectory(purpose: string) {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: `Выберите директорию для ${purpose}`
        });

        if (result && result[0]) {
            this._view?.webview.postMessage({
                type: 'directorySelected',
                purpose: purpose,
                path: result[0].fsPath
            });
        }
    }

    private async selectFile(purpose: string, filters: any) {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: filters,
            title: `Выберите файл для ${purpose}`
        });

        if (result && result[0]) {
            this._view?.webview.postMessage({
                type: 'fileSelected',
                purpose: purpose,
                path: result[0].fsPath
            });
        }
    }

    private async getCurrentGitInfo() {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            
            if (!workspaceFolders) {
                this._view?.webview.postMessage({
                    type: 'gitInfo',
                    hasGit: false
                });
                return;
            }

            // Получаем информацию о Git репозитории
            const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
            const api = gitExtension?.getAPI(1);

            if (api && api.repositories.length > 0) {
                const repo = api.repositories[0];
                const branch = repo.state.HEAD?.name || '';

                this._view?.webview.postMessage({
                    type: 'gitInfo',
                    hasGit: true,
                    branch: branch,
                    repoPath: repo.rootUri.fsPath
                });
            } else {
                this._view?.webview.postMessage({
                    type: 'gitInfo',
                    hasGit: false
                });
            }
        } catch (error) {
            this.logger.error('Ошибка при получении Git информации', error as Error);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css'));

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>1C FileBase Manager</title>
</head>
<body>
    <div id="app">
        <div id="settings-panel" class="panel">
            <h2>Настройки</h2>
            <div class="settings-grid">
                <div class="setting-item">
                    <label for="baseDirectory">Каталог для создания ИБ:</label>
                    <div class="input-group">
                        <input type="text" id="baseDirectory" placeholder="C:\\1C\\Bases">
                        <button class="btn-icon" onclick="selectDirectory('baseDirectory')">📁</button>
                    </div>
                </div>
                <div class="setting-item">
                    <label for="sourceDirectory">Путь к исходникам:</label>
                    <input type="text" id="sourceDirectory" placeholder="src/cf">
                </div>
                <div class="setting-item">
                    <label for="platformVersion">Версия платформы 1С:</label>
                    <input type="text" id="platformVersion" placeholder="8.3.27.1688">
                </div>
                <button class="btn btn-primary" onclick="saveSettings()">Сохранить настройки</button>
            </div>
        </div>

        <div id="main-menu" class="panel">
            <h2>Менеджер баз 1С</h2>
            <div class="button-group">
                <button class="btn btn-large btn-primary" onclick="showCreateBase()">
                    <span class="btn-icon">➕</span>
                    Создать новую базу
                </button>
                <button class="btn btn-large btn-secondary" onclick="showExistingBases()">
                    <span class="btn-icon">📋</span>
                    Работать с существующими базами
                </button>
            </div>
        </div>

        <div id="create-base-panel" class="panel hidden">
            <h2>Создание новой базы</h2>
            <button class="btn btn-back" onclick="showMainMenu()">← Назад</button>
            
            <div class="source-type-selector">
                <label>Выберите источник:</label>
                <div class="radio-group">
                    <label class="radio-label">
                        <input type="radio" name="sourceType" value="cf" onchange="updateSourceFields()">
                        Из файла конфигурации (.cf)
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="sourceType" value="sources" onchange="updateSourceFields()">
                        Из исходников конфигурации
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="sourceType" value="git" onchange="updateSourceFields()">
                        Из Git репозитория
                    </label>
                </div>
            </div>

            <div id="cf-fields" class="source-fields hidden">
                <div class="input-group">
                    <label>Путь к файлу .cf:</label>
                    <div class="input-group">
                        <input type="text" id="cfPath" placeholder="C:\\path\\to\\config.cf">
                        <button class="btn-icon" onclick="selectCfFile()">📁</button>
                    </div>
                </div>
            </div>

            <div id="sources-fields" class="source-fields hidden">
                <div class="input-group">
                    <label>Путь к каталогу исходников:</label>
                    <div class="input-group">
                        <input type="text" id="sourcesPath" placeholder="C:\\path\\to\\src\\cf">
                        <button class="btn-icon" onclick="selectSourcesDir()">📁</button>
                    </div>
                </div>
            </div>

            <div id="git-fields" class="source-fields hidden">
                <div class="input-group">
                    <label>Git репозиторий:</label>
                    <input type="text" id="gitRepo" placeholder="Текущий репозиторий" readonly>
                </div>
                <div class="input-group">
                    <label>Ветка:</label>
                    <input type="text" id="gitBranch" placeholder="main">
                </div>
            </div>

            <button class="btn btn-primary" onclick="createBase()">Создать базу</button>
        </div>

        <div id="bases-list-panel" class="panel hidden">
            <h2>Существующие базы</h2>
            <button class="btn btn-back" onclick="showMainMenu()">← Назад</button>
            <button class="btn btn-secondary" onclick="refreshBases()">🔄 Обновить</button>
            
            <div id="bases-list"></div>
        </div>

        <div id="base-operations-panel" class="panel hidden">
            <h2 id="current-base-name"></h2>
            <button class="btn btn-back" onclick="showExistingBases()">← Назад к списку</button>
            
            <div class="operations-grid">
                <button class="btn btn-operation" onclick="showUpdateConfig()">
                    <span class="btn-icon">🔄</span>
                    Обновить конфигурацию
                </button>
                <button class="btn btn-operation" onclick="showAttachExtension()">
                    <span class="btn-icon">🧩</span>
                    Подключить расширение
                </button>
                <button class="btn btn-operation" onclick="showDumpOptions()">
                    <span class="btn-icon">💾</span>
                    Выгрузить в файлы
                </button>
                <button class="btn btn-operation" onclick="openInEnterprise()">
                    <span class="btn-icon">🚀</span>
                    Открыть в 1С:Предприятие
                </button>
                <button class="btn btn-operation" onclick="openInDesigner()">
                    <span class="btn-icon">⚙️</span>
                    Открыть в Конфигураторе
                </button>
                <button class="btn btn-operation" onclick="showBaseInfo()">
                    <span class="btn-icon">ℹ️</span>
                    Информация о базе
                </button>
                <button class="btn btn-operation" onclick="createBackupDialog()">
                    <span class="btn-icon">💼</span>
                    Резервная копия
                </button>
                <button class="btn btn-operation btn-danger" onclick="deleteBaseDialog()">
                    <span class="btn-icon">🗑️</span>
                    Удалить базу
                </button>
            </div>
        </div>

        <div id="progress-panel" class="panel hidden">
            <h3>Выполнение операции...</h3>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <p id="progress-message">Пожалуйста, подождите...</p>
        </div>

        <div id="logs-panel" class="panel">
            <h3>Логи</h3>
            <div id="logs-content"></div>
        </div>
    </div>

    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

