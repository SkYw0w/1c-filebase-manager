# Скрипт установки зависимостей OneScript
# Запускать от имени администратора!

Write-Host "Установка зависимостей OneScript для 1C FileBase Manager..." -ForegroundColor Cyan
Write-Host ""

$dependencies = @(
    "vanessa-runner",
    "cpdb",
    "fs",
    "ParserFileV8i",
    "gitsync"
)

foreach ($dep in $dependencies) {
    Write-Host "Установка $dep..." -ForegroundColor Yellow
    
    opm install $dep
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] $dep успешно установлен" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Ошибка при установке $dep" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Установка завершена!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

