@echo off
REM 空污許可證定時爬蟲 - Windows 工作排程器呼叫用
REM 每個工作日 10:00 AM 執行，腳本內部自動判斷今天跑哪些區域

cd /d "C:\Users\jeten\.gemini\antigravity\scratch\jetenv-sales-system"

REM 確保 logs 目錄存在
if not exist "logs" mkdir "logs"

REM 產生日期格式的 log 檔名
set LOGFILE=logs\scraper_%date:~0,4%%date:~5,2%%date:~8,2%.log

echo ========================================>> "%LOGFILE%"
echo 執行時間: %date% %time%>> "%LOGFILE%"
echo ========================================>> "%LOGFILE%"

node scripts/scheduled_air_scraper.js >> "%LOGFILE%" 2>&1

echo 完成時間: %date% %time%>> "%LOGFILE%"
echo.>> "%LOGFILE%"
