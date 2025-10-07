# Руководство по разработке

Спасибо за интерес к разработке 1C FileBase Manager! Этот документ поможет вам начать работу с проектом.

## 🚀 Начало работы

### Требования для разработки

1. **Node.js** (v18 или выше)
2. **Visual Studio Code** (последняя версия)
3. **Git**
4. **OneScript** (для тестирования)
5. **Платформа 1С** (для тестирования)

### Установка зависимостей

```bash
# Клонирование репозитория
git clone https://github.com/yourusername/1c-filebase-manager.git
cd 1c-filebase-manager

# Установка npm зависимостей
npm install

# Компиляция TypeScript
npm run compile
```

## 📁 Структура проекта

```
1c-filebase-manager/
├── src/                      # Исходный код TypeScript
│   ├── extension.ts         # Точка входа расширения
│   ├── logger.ts           # Система логирования
│   ├── models.ts           # Модели данных
│   ├── onescriptManager.ts # Менеджер OneScript
│   ├── infobaseManager.ts  # Менеджер информационных баз
│   └── webviewProvider.ts  # Провайдер WebView
├── scripts/                # OneScript скрипты
│   ├── listBases.os
│   ├── createBase.os
│   ├── updateBase.os
│   └── ...
├── media/                  # Ресурсы для WebView
│   ├── styles.css
│   └── main.js
├── resources/             # Ресурсы расширения
│   └── icon.svg
└── out/                   # Скомпилированный код (генерируется)
```

## 🛠️ Разработка

### Запуск в режиме разработки

1. Откройте проект в VS Code
2. Нажмите `F5` для запуска Extension Development Host
3. В новом окне VS Code откройте боковую панель расширения

### Режим наблюдения за изменениями

```bash
npm run watch
```

Это автоматически перекомпилирует TypeScript при изменении файлов.

### Запуск линтера

```bash
npm run lint
```

### Отладка

1. Установите точки останова в коде TypeScript
2. Нажмите `F5` для запуска отладки
3. В Extension Development Host выполните действия, которые вызывают ваш код
4. VS Code остановится на точках останова

Для отладки WebView:
1. В Extension Development Host нажмите `Ctrl+Shift+P`
2. Выполните команду "Developer: Open Webview Developer Tools"

## 📝 Соглашения о коде

### TypeScript

- Используйте строгую типизацию
- Следуйте правилам ESLint
- Используйте async/await вместо промисов где возможно
- Документируйте публичные методы JSDoc комментариями

### OneScript

- Используйте понятные имена переменных и функций
- Добавляйте обработку ошибок
- Логируйте важные операции
- Следуйте стандартам форматирования OneScript

### Стиль кода

```typescript
// ✅ Хорошо
export class MyManager {
    private logger: Logger;

    constructor(context: vscode.ExtensionContext) {
        this.logger = Logger.getInstance(context);
    }

    public async doSomething(): Promise<void> {
        try {
            this.logger.info('Начало операции');
            // код операции
        } catch (error) {
            this.logger.error('Ошибка', error as Error);
            throw error;
        }
    }
}

// ❌ Плохо
export class mymanager {
    doSomething() {
        console.log('doing something');
    }
}
```

## 🧪 Тестирование

### Запуск тестов

```bash
npm test
```

### Написание тестов

Тесты находятся в `src/test/`. Используйте Mocha framework:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });
});
```

## 📦 Упаковка и публикация

### Создание VSIX пакета

```bash
# Установите vsce если еще не установлено
npm install -g @vscode/vsce

# Создайте пакет
vsce package
```

### Публикация

```bash
# Войдите в учетную запись
vsce login yourusername

# Опубликуйте расширение
vsce publish
```

## 🔄 Рабочий процесс Git

### Ветки

- `main` - стабильная версия
- `develop` - разработка
- `feature/название` - новые функции
- `bugfix/название` - исправления ошибок

### Коммиты

Используйте осмысленные сообщения коммитов:

```
feat: добавлена поддержка расширений .cfe
fix: исправлена ошибка валидации путей
docs: обновлена документация по установке
refactor: оптимизирован менеджер OneScript
```

### Pull Request

1. Создайте ветку от `develop`
2. Внесите изменения
3. Убедитесь, что тесты проходят
4. Создайте Pull Request в `develop`
5. Дождитесь ревью

## 📋 Checklist для Pull Request

- [ ] Код следует стилю проекта
- [ ] Добавлены/обновлены тесты
- [ ] Тесты проходят успешно
- [ ] Линтер не выдает ошибок
- [ ] Документация обновлена
- [ ] CHANGELOG.md обновлен
- [ ] Коммиты имеют понятные сообщения

## 🐛 Отчеты об ошибках

При создании Issue включите:

1. **Версию расширения**: `0.1.0`
2. **Версию VS Code**: `1.104.0`
3. **ОС**: Windows/Linux/macOS
4. **Шаги воспроизведения**
5. **Ожидаемое поведение**
6. **Фактическое поведение**
7. **Логи**: из Output панели "1C FileBase Manager"
8. **Скриншоты** (если применимо)

## 💡 Предложение функций

При предложении новых функций опишите:

1. **Проблему**: какую проблему решает функция
2. **Решение**: как функция должна работать
3. **Альтернативы**: рассмотренные варианты
4. **Примеры использования**

## 📚 Полезные ресурсы

- [VS Code Extension API](https://code.visualstudio.com/api)
- [OneScript документация](https://oscript.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Платформа 1С документация](https://its.1c.ru/)

## 📞 Связь

- GitHub Issues - для багов и предложений
- GitHub Discussions - для вопросов и обсуждений

---

Спасибо за вклад в проект! 🎉

