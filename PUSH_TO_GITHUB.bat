@echo off
echo ===================================================
echo Pushing Updates to GitHub...
echo ===================================================
git add .
git commit -m "fix: PDF download for all features"
git push
echo ===================================================
echo Done! Vercel will automatically begin deploying.
echo ===================================================
pause
