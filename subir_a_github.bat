@echo off
set GIT_EXE="C:\Program Files\Git\cmd\git.exe"

echo.
echo === CONFIGURANDO GIT (IDENTIDAD) ===
%GIT_EXE% config user.email "alexa@constructprice.local"
%GIT_EXE% config user.name "Alexa ConstructPrice"

echo.
echo === INICIANDO SUBIDA A GITHUB ===
%GIT_EXE% init
%GIT_EXE% add .
%GIT_EXE% commit -m "Version 1.0 Subida Automatica"
%GIT_EXE% branch -M main

echo.
echo === CONECTANDO CON EL REPOSITORIO REMOTE ===
%GIT_EXE% remote remove origin
%GIT_EXE% remote add origin https://github.com/Alexandrade-s-o/constructprice.git

echo.
echo === SUBIENDO ARCHIVOS... ===
echo (Si se abre una ventana pidiendo usuario/contraseña, ingresalos por favor)
%GIT_EXE% push -u origin main

echo.
echo === PROCESO FINALIZADO ===
pause
