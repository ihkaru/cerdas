@echo off
echo Starting Queue Worker...
cd apps\backend
php artisan queue:work
cd ..\..
