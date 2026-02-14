@echo off
echo Starting Qodana Scan (Local)...
echo.
echo NOTE: This requires Docker Desktop to be running.
echo.

:: Run Qodana using the Docker image directly
:: -v "%cd%":/data/project/   -> Mount current directory as project root
:: -v qodana-cache:/data/cache -> Mount a volume for cache (speeds up future runs)
:: -p 8080:8080               -> Expose the report server
:: --show-report              -> Serve the HTML report after scanning

docker run --rm ^
  -v "%cd%":/data/project/ ^
  -v qodana-cache:/data/cache ^
  -p 8085:8080 ^
  jetbrains/qodana-php:latest ^
  --show-report

echo.
echo Scan Complete. If the report didn't open, visit http://localhost:8085
pause
