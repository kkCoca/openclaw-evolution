@echo off
REM OpenClaw Research Workflow Skill 安装脚本 (Windows)
REM 版本：1.0.0
REM 支持：Windows

setlocal enabledelayedexpansion

echo.
echo ℹ️  开始安装 OpenClaw Research Workflow Skill...
echo.

REM 1. 检查环境
echo 📋 检查环境...

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌  Node.js 未安装，请先安装 Node.js
    echo ℹ️  安装方法：
    echo    下载 https://nodejs.org/
    goto :error
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅  Node.js 已安装 (%NODE_VERSION%)

REM 检查 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌  npm 未安装，请先安装 npm
    goto :error
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅  npm 已安装 (%NPM_VERSION%)

REM 2. 确定 OpenClaw skills 目录
set "SKILLS_DIR=%USERPROFILE%\.openclaw\skills"
if not exist "%SKILLS_DIR%" (
    echo ❌  OpenClaw skills 目录不存在：%SKILLS_DIR%
    echo ℹ️  请先安装 OpenClaw: npm install -g openclaw
    goto :error
)
echo ✅  OpenClaw skills 目录：%SKILLS_DIR%

REM 3. 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "SKILL_NAME=clawdevflow"
set "TARGET_DIR=%SKILLS_DIR%\%SKILL_NAME%"

REM 4. 检查是否已安装
if exist "%TARGET_DIR%" (
    echo ⚠️  已检测到现有安装：%TARGET_DIR%
    set /p OVERWRITE="是否覆盖安装？(y/N): "
    if /i not "!OVERWRITE!"=="y" (
        echo ℹ️  取消安装
        goto :eof
    )
    echo ℹ️  删除现有安装...
    rmdir /s /q "%TARGET_DIR%"
)

REM 5. 复制主 skill
echo 📦 复制主 skill...
xcopy /E /I /Y /Q "%SCRIPT_DIR%" "%TARGET_DIR%" >nul
if %errorlevel% neq 0 (
    echo ❌  复制失败
    goto :error
)
echo ✅  复制完成

REM 6. 验证安装
echo ✅  验证安装...

set "REQUIRED_FILES=SKILL.md workflow-executor.js README.md install.sh install.bat install.js"
set "MISSING_FILES="

for %%f in (%REQUIRED_FILES%) do (
    if not exist "%TARGET_DIR%\%%f" (
        set "MISSING_FILES=!MISSING_FILES! %%f"
    )
)

if not "%MISSING_FILES%"=="" (
    echo ❌  缺少必要文件:%MISSING_FILES%
    goto :error
)

REM 检查 bundled-skills 目录
if not exist "%TARGET_DIR%\bundled-skills" (
    echo ❌  bundled-skills 目录不存在
    goto :error
)

REM 检查 bundled skills
set "BUNDLED_SKILLS=designing roadmapping detailing coding testing reviewing precommit releasing"
set "MISSING_SKILLS="

for %%s in (%BUNDLED_SKILLS%) do (
    if not exist "%TARGET_DIR%\bundled-skills\%%s" (
        set "MISSING_SKILLS=!MISSING_SKILLS! %%s"
    )
)

if not "%MISSING_SKILLS%"=="" (
    echo ❌  缺少 bundled skills:%MISSING_SKILLS%
    goto :error
)

echo ✅  所有文件验证通过

REM 7. 完成
echo.
echo ✅  安装成功！
echo.
echo ℹ️  安装位置：%TARGET_DIR%
echo.
echo 使用方法:
echo   /sessions_spawn clawdevflow
echo.
echo 查看文档:
echo   type %TARGET_DIR%\README.md
echo.
echo 示例:
echo   type %TARGET_DIR%\examples\example-1-new-feature.md
echo.

goto :eof

:error
echo.
echo ❌  安装失败
exit /b 1
