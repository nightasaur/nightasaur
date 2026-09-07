@echo off
echo ========================================
echo Nightasaur Repository Update Script
echo ========================================
echo.

echo [1/3] Checking current Git configuration...
git remote -v
echo.

echo [2/3] Testing connection to new repository...
git fetch origin
if %errorlevel% equ 0 (
    echo SUCCESS: Connection to https://github.com/nightasaur/nightasaur.git is working!
    echo.
) else (
    echo ERROR: Connection failed. Please check:
    echo 1. Repository exists at https://github.com/nightasaur/nightasaur
    echo 2. You have proper permissions
    echo.
)

echo [3/3] Pushing test commit (optional)...
echo Do you want to push a test commit? (y/n)
set /p PUSH_TEST=
if /i "%PUSH_TEST%"=="y" (
    echo Creating test commit...
    echo "Test commit at %date% %time%" > test-commit.txt
    git add test-commit.txt
    git commit -m "Test: Verify repository connection"
    git push origin main
    if %errorlevel% equ 0 (
        echo SUCCESS: Test commit pushed successfully!
        del test-commit.txt
    ) else (
        echo ERROR: Push failed
    )
)

echo.
echo ========================================
echo Repository Status Summary
echo ========================================
echo.
echo Current remote URL: https://github.com/nightasaur/nightasaur.git
echo Repository URL: https://github.com/nightasaur/nightasaur
echo.
echo IMPORTANT: The repository is currently PRIVATE
echo To make it PUBLIC, visit: https://github.com/nightasaur/nightasaur/settings
echo.
echo Press any key to continue...
pause >nul