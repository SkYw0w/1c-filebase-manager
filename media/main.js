// @ts-nocheck
(function() {
    const vscode = acquireVsCodeApi();

    let currentConfig = {};
    let currentBases = [];
    let selectedBase = null;

    // Инициализация
    window.addEventListener('load', () => {
        vscode.postMessage({ type: 'getConfig' });
        vscode.postMessage({ type: 'getCurrentGitInfo' });
    });

    // Получение сообщений от расширения
    window.addEventListener('message', event => {
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
                if (message.success) {
                    if (message.operation === 'createBase') {
                        showMainMenu();
                    }
                }
                break;

            case 'error':
                alert('Ошибка: ' + message.message);
                showProgress(false);
                break;

            case 'directorySelected':
                document.getElementById(message.purpose).value = message.path;
                break;

            case 'fileSelected':
                if (message.purpose === 'cfFile') {
                    document.getElementById('cfPath').value = message.path;
                } else if (message.purpose === 'cfeFile') {
                    document.getElementById('cfePath').value = message.path;
                }
                break;

            case 'gitInfo':
                if (message.hasGit) {
                    document.getElementById('gitRepo').value = message.repoPath || 'Текущий репозиторий';
                    document.getElementById('gitBranch').value = message.branch || 'main';
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
    function updateConfigFields() {
        document.getElementById('baseDirectory').value = currentConfig.baseDirectory || '';
        document.getElementById('sourceDirectory').value = currentConfig.sourceDirectory || 'src/cf';
        document.getElementById('platformVersion').value = currentConfig.platformVersion || '8.3.27.1688';
    }

    // Сохранение настроек
    window.saveSettings = function() {
        const newConfig = {
            baseDirectory: document.getElementById('baseDirectory').value,
            sourceDirectory: document.getElementById('sourceDirectory').value,
            platformVersion: document.getElementById('platformVersion').value
        };

        vscode.postMessage({
            type: 'updateConfig',
            config: newConfig
        });
    };

    // Навигация
    window.showMainMenu = function() {
        hideAllPanels();
        document.getElementById('main-menu').classList.remove('hidden');
    };

    window.showCreateBase = function() {
        hideAllPanels();
        document.getElementById('create-base-panel').classList.remove('hidden');
    };

    window.showExistingBases = function() {
        hideAllPanels();
        document.getElementById('bases-list-panel').classList.remove('hidden');
        vscode.postMessage({ type: 'listBases' });
    };

    window.refreshBases = function() {
        vscode.postMessage({ type: 'listBases' });
    };

    function hideAllPanels() {
        document.querySelectorAll('.panel').forEach(panel => {
            if (panel.id !== 'settings-panel' && panel.id !== 'logs-panel') {
                panel.classList.add('hidden');
            }
        });
    }

    // Обновление полей источника
    window.updateSourceFields = function() {
        const sourceType = document.querySelector('input[name="sourceType"]:checked')?.value;
        
        document.getElementById('cf-fields').classList.add('hidden');
        document.getElementById('sources-fields').classList.add('hidden');
        document.getElementById('git-fields').classList.add('hidden');

        if (sourceType === 'cf') {
            document.getElementById('cf-fields').classList.remove('hidden');
        } else if (sourceType === 'sources') {
            document.getElementById('sources-fields').classList.remove('hidden');
        } else if (sourceType === 'git') {
            document.getElementById('git-fields').classList.remove('hidden');
            vscode.postMessage({ type: 'getCurrentGitInfo' });
        }
    };

    // Выбор директории
    window.selectDirectory = function(purpose) {
        vscode.postMessage({ 
            type: 'selectDirectory',
            purpose: purpose
        });
    };

    // Выбор файлов
    window.selectCfFile = function() {
        vscode.postMessage({
            type: 'selectFile',
            purpose: 'cfFile',
            filters: {
                'Конфигурация 1С': ['cf'],
                'Все файлы': ['*']
            }
        });
    };

    window.selectCfeFile = function() {
        vscode.postMessage({
            type: 'selectFile',
            purpose: 'cfeFile',
            filters: {
                'Расширение 1С': ['cfe'],
                'Все файлы': ['*']
            }
        });
    };

    window.selectSourcesDir = function() {
        vscode.postMessage({
            type: 'selectDirectory',
            purpose: 'sourcesPath'
        });
    };

    // Создание базы
    window.createBase = function() {
        const sourceType = document.querySelector('input[name="sourceType"]:checked')?.value;
        
        if (!sourceType) {
            alert('Выберите источник создания базы');
            return;
        }

        if (!currentConfig.baseDirectory) {
            alert('Укажите каталог для создания баз в настройках');
            return;
        }

        let options = {
            basePath: currentConfig.baseDirectory,
            sourceType: sourceType
        };

        if (sourceType === 'cf') {
            const cfPath = document.getElementById('cfPath').value;
            if (!cfPath) {
                alert('Укажите путь к файлу .cf');
                return;
            }
            const fileName = cfPath.split('\\').pop().split('/').pop().replace('.cf', '');
            options.name = fileName;
            options.sourcePath = cfPath;
        } else if (sourceType === 'sources') {
            const sourcesPath = document.getElementById('sourcesPath').value;
            if (!sourcesPath) {
                alert('Укажите путь к каталогу исходников');
                return;
            }
            const folderName = sourcesPath.split('\\').pop().split('/').pop();
            options.name = folderName;
            options.sourcePath = sourcesPath;
        } else if (sourceType === 'git') {
            const gitRepo = document.getElementById('gitRepo').value;
            const gitBranch = document.getElementById('gitBranch').value;
            if (!gitBranch) {
                alert('Укажите ветку Git');
                return;
            }
            const repoName = gitRepo.split('\\').pop().split('/').pop();
            options.name = `${repoName}_${gitBranch}`;
            options.sourcePath = gitRepo;
            options.gitBranch = gitBranch;
            options.gitRepo = gitRepo;
        }

        vscode.postMessage({
            type: 'createBase',
            options: options
        });
    };

    // Отрисовка списка баз
    function renderBasesList() {
        const listContainer = document.getElementById('bases-list');
        
        if (currentBases.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--vscode-descriptionForeground);">Базы не найдены</p>';
            return;
        }

        listContainer.innerHTML = currentBases.map(base => `
            <div class="base-item" onclick="selectBase('${base.name}')">
                <div class="base-item-name">${base.name}</div>
                <div class="base-item-path">${base.path}</div>
                <div class="base-item-meta">
                    <span>Размер: ${formatFileSize(base.size)}</span>
                    <span>Изменено: ${formatDate(base.lastModified)}</span>
                </div>
            </div>
        `).join('');
    }

    // Выбор базы
    window.selectBase = function(baseName) {
        selectedBase = baseName;
        hideAllPanels();
        document.getElementById('base-operations-panel').classList.remove('hidden');
        document.getElementById('current-base-name').textContent = baseName;
    };

    // Операции с базой
    window.openInEnterprise = function() {
        if (!selectedBase) return;
        vscode.postMessage({
            type: 'openEnterprise',
            baseName: selectedBase
        });
    };

    window.openInDesigner = function() {
        if (!selectedBase) return;
        vscode.postMessage({
            type: 'openDesigner',
            baseName: selectedBase
        });
    };

    window.showBaseInfo = function() {
        if (!selectedBase) return;
        vscode.postMessage({
            type: 'getBaseInfo',
            baseName: selectedBase
        });
    };

    window.createBackupDialog = function() {
        if (!selectedBase) return;
        
        const backupPath = prompt('Укажите путь для резервной копии:');
        if (backupPath) {
            vscode.postMessage({
                type: 'createBackup',
                baseName: selectedBase,
                backupPath: backupPath
            });
        }
    };

    window.deleteBaseDialog = function() {
        if (!selectedBase) return;
        
        if (confirm(`Вы уверены, что хотите удалить базу "${selectedBase}"? Это действие необратимо!`)) {
            vscode.postMessage({
                type: 'deleteBase',
                baseName: selectedBase
            });
        }
    };

    window.showUpdateConfig = function() {
        // TODO: Реализовать обновление конфигурации
        alert('Функция обновления конфигурации будет реализована');
    };

    window.showAttachExtension = function() {
        // TODO: Реализовать подключение расширения
        alert('Функция подключения расширения будет реализована');
    };

    window.showDumpOptions = function() {
        // TODO: Реализовать выгрузку
        alert('Функция выгрузки будет реализована');
    };

    // Progress bar
    function showProgress(show) {
        const progressPanel = document.getElementById('progress-panel');
        if (show) {
            progressPanel.classList.remove('hidden');
        } else {
            progressPanel.classList.add('hidden');
        }
    }

    // Форматирование
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    }

    function showBaseInfoDialog(info) {
        if (!info) {
            alert('Не удалось получить информацию о базе');
            return;
        }
        
        alert(`Информация о базе:\n${JSON.stringify(info, null, 2)}`);
    }

    function showDependenciesStatus(onescriptInstalled, dependencies) {
        let message = 'Статус зависимостей:\n\n';
        
        if (!onescriptInstalled) {
            message += 'OneScript: НЕ УСТАНОВЛЕН\n';
        } else {
            message += 'OneScript: Установлен\n\n';
            for (const [name, installed] of Object.entries(dependencies)) {
                message += `${name}: ${installed ? '✓' : '✗'}\n`;
            }
        }
        
        alert(message);
    }
})();

