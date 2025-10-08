// Типы для VS Code API
interface VsCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// Инициализация
console.log('1C FileBase Manager: main.ts загружен!');

const vscode = acquireVsCodeApi();

interface Config {
    baseDirectory: string;
    sourceDirectory: string;
    platformVersion: string;
}

let currentConfig: Config = {
    baseDirectory: '',
    sourceDirectory: 'src/cf',
    platformVersion: '8.3.27.1688'
};

let currentBases: string[] = [];
let selectedBase: string | null = null;

// Инициализация при загрузке
window.addEventListener('load', () => {
    console.log('1C FileBase Manager: событие load сработало');
    
    setupEventListeners();
    setupSourceTypeListeners();
    
    vscode.postMessage({ type: 'getConfig' });
});

// Настройка обработчиков событий
function setupEventListeners(): void {
    console.log('1C FileBase Manager: настройка обработчиков');
    
    const btnCreateBase = document.getElementById('btn-create-base');
    const btnExistingBases = document.getElementById('btn-existing-bases');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const btnSelectBaseDir = document.getElementById('btn-select-base-dir');
    const btnBackFromCreate = document.getElementById('btn-back-from-create');
    const btnBackFromBases = document.getElementById('btn-back-from-bases');
    const btnRefreshBases = document.getElementById('btn-refresh-bases');
    const btnBackFromOperations = document.getElementById('btn-back-from-operations');
    const btnSelectCfFile = document.getElementById('btn-select-cf-file');
    const btnSelectSourcesDir = document.getElementById('btn-select-sources-dir');
    const btnSubmitCreateBase = document.getElementById('btn-submit-create-base');
    
    if (btnCreateBase) {
        btnCreateBase.addEventListener('click', () => {
            console.log('Кнопка "Создать новую базу" нажата');
            showCreateBase();
        });
        console.log('✓ Обработчик для btn-create-base добавлен');
    } else {
        console.error('✗ btn-create-base не найдена!');
    }
    
    if (btnExistingBases) {
        btnExistingBases.addEventListener('click', () => {
            console.log('Кнопка "Работать с существующими базами" нажата');
            showExistingBases();
        });
        console.log('✓ Обработчик для btn-existing-bases добавлен');
    } else {
        console.error('✗ btn-existing-bases не найдена!');
    }
    
    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => {
            console.log('Кнопка "Сохранить настройки" нажата');
            saveSettings();
        });
        console.log('✓ Обработчик для btn-save-settings добавлен');
    } else {
        console.error('✗ btn-save-settings не найдена!');
    }
    
    if (btnSelectBaseDir) {
        btnSelectBaseDir.addEventListener('click', () => selectDirectory('baseDirectory'));
        console.log('✓ Обработчик для btn-select-base-dir добавлен');
    } else {
        console.error('✗ btn-select-base-dir не найдена!');
    }
    
    if (btnBackFromCreate) {
        btnBackFromCreate.addEventListener('click', () => {
            console.log('Кнопка "Назад" нажата');
            showMainMenu();
        });
        console.log('✓ Обработчик для btn-back-from-create добавлен');
    } else {
        console.error('✗ btn-back-from-create не найдена!');
    }
    
    if (btnBackFromBases) {
        btnBackFromBases.addEventListener('click', () => {
            console.log('Кнопка "Назад" из списка баз нажата');
            showMainMenu();
        });
        console.log('✓ Обработчик для btn-back-from-bases добавлен');
    } else {
        console.error('✗ btn-back-from-bases не найдена!');
    }
    
    if (btnRefreshBases) {
        btnRefreshBases.addEventListener('click', () => {
            console.log('Кнопка "Обновить" список баз нажата');
            vscode.postMessage({ type: 'listBases' });
        });
        console.log('✓ Обработчик для btn-refresh-bases добавлен');
    } else {
        console.error('✗ btn-refresh-bases не найдена!');
    }
    
    if (btnBackFromOperations) {
        btnBackFromOperations.addEventListener('click', () => {
            console.log('Кнопка "Назад к списку" нажата');
            showExistingBases();
        });
        console.log('✓ Обработчик для btn-back-from-operations добавлен');
    } else {
        console.error('✗ btn-back-from-operations не найдена!');
    }
    
    if (btnSelectCfFile) {
        btnSelectCfFile.addEventListener('click', () => {
            console.log('Выбор .cf файла');
            vscode.postMessage({ type: 'selectFile', purpose: 'cfFile', filters: { 'Файлы конфигурации': ['cf'] } });
        });
        console.log('✓ Обработчик для btn-select-cf-file добавлен');
    }
    
    if (btnSelectSourcesDir) {
        btnSelectSourcesDir.addEventListener('click', () => {
            console.log('Выбор каталога исходников');
            vscode.postMessage({ type: 'selectDirectory', purpose: 'sourcesPath' });
        });
        console.log('✓ Обработчик для btn-select-sources-dir добавлен');
    }
    
    if (btnSubmitCreateBase) {
        btnSubmitCreateBase.addEventListener('click', () => {
            console.log('Кнопка "Создать базу" нажата!');
            createBase();
        });
        console.log('✓ Обработчик для btn-submit-create-base добавлен');
    } else {
        console.error('✗ btn-submit-create-base не найдена!');
    }
    
    // Кнопки операций с базами
    const btnUpdateConfig = document.getElementById('btn-update-config');
    const btnAttachExtension = document.getElementById('btn-attach-extension');
    const btnDumpOptions = document.getElementById('btn-dump-options');
    const btnOpenEnterprise = document.getElementById('btn-open-enterprise');
    const btnOpenDesigner = document.getElementById('btn-open-designer');
    const btnDeleteBase = document.getElementById('btn-delete-base');
    
    if (btnUpdateConfig) {
        btnUpdateConfig.addEventListener('click', () => {
            console.log('Кнопка "Обновить конфигурацию" нажата');
            showUpdateConfig();
        });
        console.log('✓ Обработчик для btn-update-config добавлен');
    }
    
    if (btnAttachExtension) {
        btnAttachExtension.addEventListener('click', () => {
            console.log('Кнопка "Подключить расширение" нажата');
            showAttachExtension();
        });
        console.log('✓ Обработчик для btn-attach-extension добавлен');
    }
    
    if (btnDumpOptions) {
        btnDumpOptions.addEventListener('click', () => {
            console.log('Кнопка "Выгрузить" нажата');
            showDumpOptions();
        });
        console.log('✓ Обработчик для btn-dump-options добавлен');
    }
    
    if (btnOpenEnterprise) {
        btnOpenEnterprise.addEventListener('click', () => {
            console.log('Кнопка "Открыть в 1С:Предприятие" нажата');
            openInEnterprise();
        });
        console.log('✓ Обработчик для btn-open-enterprise добавлен');
    }
    
    if (btnOpenDesigner) {
        btnOpenDesigner.addEventListener('click', () => {
            console.log('Кнопка "Открыть в Конфигураторе" нажата');
            openInDesigner();
        });
        console.log('✓ Обработчик для btn-open-designer добавлен');
    }
    
    if (btnDeleteBase) {
        btnDeleteBase.addEventListener('click', () => {
            console.log('Кнопка "Удалить базу" нажата');
            deleteBaseDialog();
        });
        console.log('✓ Обработчик для btn-delete-base добавлен');
    }
    
    // Обработчики для форм операций
    const btnBackFromUpdate = document.getElementById('btn-back-from-update');
    const btnBackFromAttach = document.getElementById('btn-back-from-attach');
    const btnBackFromDump = document.getElementById('btn-back-from-dump');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnSubmitUpdate = document.getElementById('btn-submit-update');
    const btnSubmitAttach = document.getElementById('btn-submit-attach');
    const btnSubmitDump = document.getElementById('btn-submit-dump');
    const btnSelectUpdateSource = document.getElementById('btn-select-update-source');
    const btnSelectExtensionSource = document.getElementById('btn-select-extension-source');
    const btnSelectDumpDestination = document.getElementById('btn-select-dump-destination');
    
    if (btnBackFromUpdate) {
        btnBackFromUpdate.addEventListener('click', () => {
            hideAllPanels();
            const operationsPanel = document.getElementById('base-operations-panel');
            if (operationsPanel) operationsPanel.classList.remove('hidden');
        });
    }
    
    if (btnBackFromAttach) {
        btnBackFromAttach.addEventListener('click', () => {
            hideAllPanels();
            const operationsPanel = document.getElementById('base-operations-panel');
            if (operationsPanel) operationsPanel.classList.remove('hidden');
        });
    }
    
    if (btnBackFromDump) {
        btnBackFromDump.addEventListener('click', () => {
            hideAllPanels();
            const operationsPanel = document.getElementById('base-operations-panel');
            if (operationsPanel) operationsPanel.classList.remove('hidden');
        });
    }
    
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            if (selectedBase) {
                vscode.postMessage({ type: 'deleteBase', baseName: selectedBase });
            }
        });
    }
    
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', () => {
            hideAllPanels();
            const operationsPanel = document.getElementById('base-operations-panel');
            if (operationsPanel) operationsPanel.classList.remove('hidden');
        });
    }
    
    if (btnSubmitUpdate) {
        btnSubmitUpdate.addEventListener('click', () => {
            console.log('=== btnSubmitUpdate НАЖАТА ===');
            console.log('selectedBase:', selectedBase);
            
            if (!selectedBase) {
                console.error('selectedBase не установлена!');
                return;
            }
            
            const sourceType = (document.getElementById('update-source-type') as HTMLSelectElement)?.value;
            const sourcePath = (document.getElementById('update-source-path') as HTMLInputElement)?.value;
            
            if (!sourcePath) {
                console.error('Путь к источнику не указан!');
                return;
            }
            
            const options = {
                baseName: selectedBase,
                sourceType: sourceType,
                sourcePath: sourcePath
            };
            
            console.log('Отправка updateBase с параметрами:', options);
            vscode.postMessage({ type: 'updateBase', options: options });
        });
    }
    
    if (btnSubmitAttach) {
        btnSubmitAttach.addEventListener('click', () => {
            console.log('=== btnSubmitAttach НАЖАТА ===');
            console.log('selectedBase:', selectedBase);
            
            if (!selectedBase) {
                console.error('selectedBase не установлена!');
                return;
            }
            
            const extensionName = (document.getElementById('extension-name') as HTMLInputElement)?.value;
            const sourceType = (document.getElementById('extension-source-type') as HTMLSelectElement)?.value;
            const sourcePath = (document.getElementById('extension-source-path') as HTMLInputElement)?.value;
            
            if (!extensionName || !sourcePath) {
                console.error('Не указаны имя расширения или путь к источнику!');
                return;
            }
            
            const options = {
                baseName: selectedBase,
                sourceType: sourceType,
                sourcePath: sourcePath,
                extensionName: extensionName
            };
            
            console.log('Отправка attachExtension с параметрами:', options);
            vscode.postMessage({ type: 'attachExtension', options: options });
        });
    }
    
    if (btnSubmitDump) {
        btnSubmitDump.addEventListener('click', () => {
            console.log('=== btnSubmitDump НАЖАТА ===');
            console.log('selectedBase:', selectedBase);
            
            if (!selectedBase) {
                console.error('selectedBase не установлена!');
                return;
            }
            
            const dumpType = (document.getElementById('dump-type') as HTMLSelectElement)?.value;
            const destinationPath = (document.getElementById('dump-destination') as HTMLInputElement)?.value;
            
            if (!destinationPath) {
                console.error('Путь для выгрузки не указан!');
                return;
            }
            
            const options = {
                baseName: selectedBase,
                dumpType: dumpType,
                destinationPath: destinationPath
            };
            
            console.log('Отправка dumpBase с параметрами:', options);
            vscode.postMessage({ type: 'dumpBase', options: options });
        });
    }
    
    if (btnSelectUpdateSource) {
        btnSelectUpdateSource.addEventListener('click', () => {
            const sourceType = (document.getElementById('update-source-type') as HTMLSelectElement)?.value;
            if (sourceType === 'cf') {
                vscode.postMessage({ type: 'selectFile', purpose: 'updateSourcePath', filters: { 'Файлы конфигурации': ['cf'] } });
            } else {
                vscode.postMessage({ type: 'selectDirectory', purpose: 'updateSourcePath' });
            }
        });
    }
    
    if (btnSelectExtensionSource) {
        btnSelectExtensionSource.addEventListener('click', () => {
            const sourceType = (document.getElementById('extension-source-type') as HTMLSelectElement)?.value;
            if (sourceType === 'cfe') {
                vscode.postMessage({ type: 'selectFile', purpose: 'extensionSourcePath', filters: { 'Файлы расширений': ['cfe'] } });
            } else {
                vscode.postMessage({ type: 'selectDirectory', purpose: 'extensionSourcePath' });
            }
        });
    }
    
    if (btnSelectDumpDestination) {
        btnSelectDumpDestination.addEventListener('click', () => {
            const dumpType = (document.getElementById('dump-type') as HTMLSelectElement)?.value;
            if (dumpType === 'cf') {
                const defaultName = selectedBase ? `${selectedBase}.cf` : 'configuration.cf';
                vscode.postMessage({ type: 'saveFile', purpose: 'dumpDestination', filters: { 'Файлы конфигурации': ['cf'] }, defaultName: defaultName });
            } else {
                vscode.postMessage({ type: 'selectDirectory', purpose: 'dumpDestination' });
            }
        });
    }
}

// Настройка обработчиков для выбора источника базы
function setupSourceTypeListeners(): void {
    console.log('1C FileBase Manager: настройка обработчиков источников');
    
    const sourceCf = document.getElementById('source-cf') as HTMLInputElement;
    const sourceSources = document.getElementById('source-sources') as HTMLInputElement;
    const sourceGit = document.getElementById('source-git') as HTMLInputElement;
    
    if (sourceCf) {
        sourceCf.addEventListener('change', () => {
            console.log('Выбран источник: CF');
            updateSourceFields('cf');
        });
    }
    
    if (sourceSources) {
        sourceSources.addEventListener('change', () => {
            console.log('Выбран источник: Sources');
            updateSourceFields('sources');
        });
        // По умолчанию показываем поля для исходников
        if (sourceSources.checked) {
            updateSourceFields('sources');
        }
    }
    
    if (sourceGit) {
        sourceGit.addEventListener('change', () => {
            console.log('Выбран источник: Git');
            updateSourceFields('git');
            // Запрашиваем список проектов из workspace
            vscode.postMessage({ type: 'getWorkspaceFolders' });
        });
    }
    
    // Обработчик выбора Git проекта
    const gitProjectSelect = document.getElementById('gitProjectSelect') as HTMLSelectElement;
    if (gitProjectSelect) {
        gitProjectSelect.addEventListener('change', () => {
            const selectedPath = gitProjectSelect.value;
            if (selectedPath) {
                console.log('Выбран проект:', selectedPath);
                // Запрашиваем текущую ветку для выбранного проекта
                vscode.postMessage({ type: 'getGitBranch', projectPath: selectedPath });
            }
        });
    }
}

// Обновление видимости полей в зависимости от источника
function updateSourceFields(sourceType: string): void {
    console.log('updateSourceFields вызван с типом:', sourceType);
    
    const cfFields = document.getElementById('cf-fields');
    const sourcesFields = document.getElementById('sources-fields');
    const gitFields = document.getElementById('git-fields');
    
    // Скрываем все поля
    if (cfFields) cfFields.classList.add('hidden');
    if (sourcesFields) sourcesFields.classList.add('hidden');
    if (gitFields) gitFields.classList.add('hidden');
    
    // Показываем нужные поля
    switch (sourceType) {
        case 'cf':
            if (cfFields) cfFields.classList.remove('hidden');
            break;
        case 'sources':
            if (sourcesFields) sourcesFields.classList.remove('hidden');
            break;
        case 'git':
            if (gitFields) gitFields.classList.remove('hidden');
            break;
    }
}

// Получение сообщений от расширения
window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data;

    switch (message.type) {
        case 'config':
            currentConfig = message.config;
            updateConfigFields();
            break;

        case 'basesList':
            currentBases = message.bases;
            renderBasesList();
            break;

        case 'operationStart':
            showProgress(true);
            break;

        case 'operationEnd':
            showProgress(false);
            if (message.success && message.operation === 'createBase') {
                showMainMenu();
            }
            break;

        case 'error':
            showProgress(false);
            break;

        case 'directorySelected':
            if (message.purpose === 'baseDirectory') {
                const dirInput = document.getElementById(message.purpose) as HTMLInputElement;
                if (dirInput) dirInput.value = message.path;
            } else if (message.purpose === 'sourcesPath') {
                const dirInput = document.getElementById(message.purpose) as HTMLInputElement;
                if (dirInput) dirInput.value = message.path;
            } else if (message.purpose === 'updateSourcePath') {
                const dirInput = document.getElementById('update-source-path') as HTMLInputElement;
                if (dirInput) dirInput.value = message.path;
            } else if (message.purpose === 'extensionSourcePath') {
                const dirInput = document.getElementById('extension-source-path') as HTMLInputElement;
                if (dirInput) dirInput.value = message.path;
            } else if (message.purpose === 'dumpDestination') {
                const dirInput = document.getElementById('dump-destination') as HTMLInputElement;
                if (dirInput) dirInput.value = message.path;
            }
            break;

        case 'fileSelected':
            if (message.purpose === 'cfFile') {
                const cfInput = document.getElementById('cfPath') as HTMLInputElement;
                if (cfInput) cfInput.value = message.path;
            } else if (message.purpose === 'cfeFile') {
                const cfeInput = document.getElementById('cfePath') as HTMLInputElement;
                if (cfeInput) cfeInput.value = message.path;
            } else if (message.purpose === 'updateSourcePath') {
                const updateInput = document.getElementById('update-source-path') as HTMLInputElement;
                if (updateInput) updateInput.value = message.path;
            } else if (message.purpose === 'extensionSourcePath') {
                const extInput = document.getElementById('extension-source-path') as HTMLInputElement;
                if (extInput) extInput.value = message.path;
            } else if (message.purpose === 'dumpDestination') {
                const dumpInput = document.getElementById('dump-destination') as HTMLInputElement;
                if (dumpInput) dumpInput.value = message.path;
            }
            break;

        case 'workspaceFolders':
            updateWorkspaceFolders(message.folders);
            break;

        case 'gitBranch':
            const gitBranchInput = document.getElementById('gitBranch') as HTMLInputElement;
            if (gitBranchInput) {
                gitBranchInput.value = message.branch || 'main';
            }
            break;

        case 'baseInfo':
            showBaseInfoDialog(message.info);
            break;

        case 'dependenciesStatus':
            showDependenciesStatus(message.onescriptInstalled, message.dependencies);
            break;
    }
});

// Обновление полей конфигурации
function updateConfigFields(): void {
    const baseDirInput = document.getElementById('baseDirectory') as HTMLInputElement;
    const sourceDirInput = document.getElementById('sourceDirectory') as HTMLInputElement;
    const platformInput = document.getElementById('platformVersion') as HTMLInputElement;
    
    if (baseDirInput) baseDirInput.value = currentConfig.baseDirectory || '';
    if (sourceDirInput) sourceDirInput.value = currentConfig.sourceDirectory || 'src/cf';
    if (platformInput) platformInput.value = currentConfig.platformVersion || '8.3.27.1688';
}

// Сохранение настроек
function saveSettings(): void {
    const baseDirInput = document.getElementById('baseDirectory') as HTMLInputElement;
    const sourceDirInput = document.getElementById('sourceDirectory') as HTMLInputElement;
    const platformInput = document.getElementById('platformVersion') as HTMLInputElement;
    
    const newConfig: Config = {
        baseDirectory: baseDirInput?.value || '',
        sourceDirectory: sourceDirInput?.value || 'src/cf',
        platformVersion: platformInput?.value || '8.3.27.1688'
    };

    vscode.postMessage({
        type: 'updateConfig',
        config: newConfig
    });
}

// Навигация
function showMainMenu(): void {
    hideAllPanels();
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) mainMenu.classList.remove('hidden');
}

function showCreateBase(): void {
    console.log('showCreateBase вызван');
    hideAllPanels();
    const createPanel = document.getElementById('create-base-panel');
    if (createPanel) createPanel.classList.remove('hidden');
}

function showExistingBases(): void {
    console.log('showExistingBases вызван');
    hideAllPanels();
    const basesPanel = document.getElementById('bases-list-panel');
    if (basesPanel) basesPanel.classList.remove('hidden');
    vscode.postMessage({ type: 'listBases' });
}

function hideAllPanels(): void {
    document.querySelectorAll('.panel').forEach(panel => {
        if (panel.id !== 'settings-panel') {
            panel.classList.add('hidden');
        }
    });
}

// Выбор директории
function selectDirectory(purpose: string): void {
    console.log('selectDirectory вызван для:', purpose);
    vscode.postMessage({ 
        type: 'selectDirectory',
        purpose: purpose
    });
}

// Отрисовка списка баз
function renderBasesList(): void {
    const listContainer = document.getElementById('bases-list');
    if (!listContainer) return;
    
    if (currentBases.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--vscode-descriptionForeground);">Базы не найдены</p>';
        return;
    }

    listContainer.innerHTML = currentBases.map(baseName => `
        <div class="base-item" data-base-name="${escapeHtml(baseName)}">
            <div class="base-item-name">${escapeHtml(baseName)}</div>
        </div>
    `).join('');
    
    // Добавляем обработчики кликов
    const baseItems = listContainer.querySelectorAll('.base-item');
    baseItems.forEach(item => {
        item.addEventListener('click', () => {
            const baseName = item.getAttribute('data-base-name');
            if (baseName) {
                console.log('База выбрана:', baseName);
                selectBase(baseName);
            }
        });
    });
}

// Экранирование HTML
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Progress bar
function showProgress(show: boolean): void {
    const progressPanel = document.getElementById('progress-panel');
    if (!progressPanel) return;
    
    if (show) {
        progressPanel.classList.remove('hidden');
    } else {
        progressPanel.classList.add('hidden');
    }
}

// Форматирование
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

function showBaseInfoDialog(info: any): void {
    // Информация выводится в логи
    console.log('База данных:', info);
}

function showDependenciesStatus(onescriptInstalled: boolean, dependencies: Record<string, boolean>): void {
    // Статус выводится в логи
    console.log('OneScript установлен:', onescriptInstalled);
    console.log('Зависимости:', dependencies);
}

// Функция выбора базы
function selectBase(baseName: string): void {
    selectedBase = baseName;
    hideAllPanels();
    const operationsPanel = document.getElementById('base-operations-panel');
    const baseNameElem = document.getElementById('current-base-name');
    
    if (operationsPanel) operationsPanel.classList.remove('hidden');
    if (baseNameElem) baseNameElem.textContent = baseName;
}

// Обновление списка проектов из workspace
function updateWorkspaceFolders(folders: Array<{name: string, path: string}>): void {
    const gitProjectSelect = document.getElementById('gitProjectSelect') as HTMLSelectElement;
    if (!gitProjectSelect) return;
    
    gitProjectSelect.innerHTML = '';
    
    if (folders.length === 0) {
        gitProjectSelect.innerHTML = '<option value="">Нет открытых проектов</option>';
        return;
    }
    
    // Добавляем опции для каждого проекта
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.path;
        option.textContent = folder.name;
        gitProjectSelect.appendChild(option);
    });
    
    // Автоматически выбираем первый проект и получаем его ветку
    if (folders.length > 0) {
        gitProjectSelect.selectedIndex = 0;
        vscode.postMessage({ type: 'getGitBranch', projectPath: folders[0].path });
    }
}

// Создание базы
function createBase(): void {
    console.log('=== createBase ВЫЗВАН ===');
    console.log('currentConfig:', currentConfig);
    
    // Проверяем настройки
    if (!currentConfig.baseDirectory) {
        console.error('baseDirectory не задан!');
        alert('Укажите каталог для создания баз в настройках');
        return;
    }
    
    const sourceType = (document.querySelector('input[name="sourceType"]:checked') as HTMLInputElement)?.value;
    console.log('Выбранный sourceType:', sourceType);
    
    if (!sourceType) {
        alert('Выберите источник для создания базы');
        return;
    }
    
    let sourcePath = '';
    let baseName = '';
    
    // Определяем sourcePath и генерируем название в зависимости от типа источника
    switch (sourceType) {
        case 'cf':
            const cfPath = (document.getElementById('cfPath') as HTMLInputElement)?.value?.trim();
            if (!cfPath) {
                alert('Укажите путь к файлу .cf');
                return;
            }
            sourcePath = cfPath;
            // Название из имени файла без расширения
            baseName = cfPath.split(/[\\\/]/).pop()?.replace(/\.cf$/i, '') || 'NewBase';
            break;
            
        case 'sources':
            const sourcesPath = (document.getElementById('sourcesPath') as HTMLInputElement)?.value?.trim();
            if (!sourcesPath) {
                alert('Укажите путь к каталогу исходников');
                return;
            }
            sourcePath = sourcesPath;
            // Название из имени папки
            baseName = sourcesPath.split(/[\\\/]/).filter(x => x).pop() || 'NewBase';
            break;
            
        case 'git':
            const gitProjectSelect = document.getElementById('gitProjectSelect') as HTMLSelectElement;
            const gitBranch = (document.getElementById('gitBranch') as HTMLInputElement)?.value?.trim();
            
            if (!gitProjectSelect.value) {
                alert('Выберите проект из workspace');
                return;
            }
            
            const gitRepoPath = gitProjectSelect.value;
            const projectName = gitProjectSelect.options[gitProjectSelect.selectedIndex]?.text || 'NewBase';
            const branchName = gitBranch || 'main';
            
            // Название из имени проекта + ветка
            baseName = `${projectName}_${branchName}`;
            
            // Для git:
            // sourcePath = путь к исходникам относительно репозитория (из настроек)
            // gitRepo = абсолютный путь к репозиторию
            const options: any = {
                name: baseName,
                basePath: `${currentConfig.baseDirectory}\\${baseName}`,
                sourceType: sourceType,
                sourcePath: currentConfig.sourceDirectory, // "src/cf" из настроек
                gitBranch: branchName,
                gitRepo: gitRepoPath // путь к репозиторию
            };
            
            console.log('Отправка команды создания базы с параметрами:', options);
            vscode.postMessage({ type: 'createBase', options: options });
            return;
    }
    
    // Для cf и sources
    const options: any = {
        name: baseName,
        basePath: `${currentConfig.baseDirectory}\\${baseName}`,
        sourceType: sourceType,
        sourcePath: sourcePath
    };
    
    console.log('Отправка команды создания базы с параметрами:', options);
    vscode.postMessage({ type: 'createBase', options: options });
}

// Функции операций с базами
function showUpdateConfig(): void {
    if (!selectedBase) {
        return;
    }
    
    hideAllPanels();
    const panel = document.getElementById('update-config-panel');
    const title = document.getElementById('update-config-title');
    if (title) title.textContent = `Обновить конфигурацию: ${selectedBase}`;
    if (panel) panel.classList.remove('hidden');
}

function showAttachExtension(): void {
    if (!selectedBase) {
        return;
    }
    
    hideAllPanels();
    const panel = document.getElementById('attach-extension-panel');
    const title = document.getElementById('attach-extension-title');
    if (title) title.textContent = `Подключить расширение: ${selectedBase}`;
    if (panel) panel.classList.remove('hidden');
}

function showDumpOptions(): void {
    if (!selectedBase) {
        return;
    }
    
    hideAllPanels();
    const panel = document.getElementById('dump-panel');
    const title = document.getElementById('dump-title');
    if (title) title.textContent = `Выгрузить конфигурацию: ${selectedBase}`;
    if (panel) panel.classList.remove('hidden');
}

function openInEnterprise(): void {
    if (!selectedBase) {
        return;
    }
    
    vscode.postMessage({ type: 'openEnterprise', baseName: selectedBase });
}

function openInDesigner(): void {
    if (!selectedBase) {
        return;
    }
    
    vscode.postMessage({ type: 'openDesigner', baseName: selectedBase });
}

function deleteBaseDialog(): void {
    if (!selectedBase) {
        return;
    }
    
    hideAllPanels();
    const panel = document.getElementById('delete-confirm-panel');
    const message = document.getElementById('delete-confirm-message');
    if (message) {
        message.textContent = `Вы уверены, что хотите удалить базу "${selectedBase}"?`;
    }
    if (panel) panel.classList.remove('hidden');
}

