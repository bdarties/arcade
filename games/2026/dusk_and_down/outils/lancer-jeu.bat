@echo off
rem Lance un petit serveur local puis ouvre le jeu dans le navigateur.
rem (les modules JavaScript ne fonctionnent pas en ouvrant index.html directement)
start "Serveur SAE 301" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0lancer-serveur.ps1" -Root "%~dp0.." -Port 8124
timeout /t 2 >nul
start "" http://localhost:8124
