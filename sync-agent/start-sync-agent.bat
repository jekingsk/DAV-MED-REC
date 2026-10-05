@echo off
title DAV University - Faculty PC Sync Agent
color 0A
cls
echo =====================================================================
echo           DAV UNIVERSITY MEDICAL LEAVE PORTAL - SYNC AGENT
echo =====================================================================
echo Starting background synchronization service...
echo Backup folder: %%USERPROFILE%%\Documents\DAV Medical Leave
echo.
node "%~dp0faculty-sync-agent.js"
if %%ERRORLEVEL%% NEQ 0 (
    echo.
    echo [ERROR] Could not start Node.js. Please ensure Node.js is installed.
    pause
)
