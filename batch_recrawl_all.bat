@echo off
chcp 65001 >nul
echo ═══════════════════════════════════════════════════════
echo    🔄 批次重新爬取所有現有地區資料
echo    📊 更新為合併後的新格式
echo ═══════════════════════════════════════════════════════
echo.

set districts=土城區 樹林區 三重區 新莊區 三峽區 板橋區 鶯歌區 中和區

for %%d in (%districts%) do (
    echo.
    echo ═══════════════════════════════════════════════════════
    echo 🚀 開始爬取：新北市 %%d
    echo ═══════════════════════════════════════════════════════
    echo.
    
    node scripts/air_permit_scraper_auto.js --county "新北市" --district "%%d"
    
    if errorlevel 1 (
        echo.
        echo ❌ %%d 爬取失敗，繼續下一個...
        echo.
    ) else (
        echo.
        echo ✅ %%d 爬取完成
        echo.
    )
    
    timeout /t 5 /nobreak >nul
)

echo.
echo ═══════════════════════════════════════════════════════
echo ✅ 所有地區爬取完成！
echo ═══════════════════════════════════════════════════════
echo.
pause
