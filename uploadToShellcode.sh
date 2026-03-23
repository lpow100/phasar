#!/bin/bash

# 1. Create a temporary staging folder in your HOME directory on the VPS
ssh logan@147.182.244.57 "mkdir -p ~/deploy_staging/frontend ~/deploy_staging/backend"

# 2. Upload Frontend files to the staging folder
scp -r frontend/dist/* logan@147.182.244.57:~/deploy_staging/frontend/

# 3. Upload Backend files to the staging folder
scp backend/src/*.js logan@147.182.244.57:~/deploy_staging/backend/
scp backend/package.json backend/package-lock.json backend/.env logan@147.182.244.57:~/deploy_staging/backend/

# 4. Use SSH + SUDO to move them to /var/www/
ssh -t logan@147.182.244.57 "
    sudo mkdir -p /var/www/clusterchat/frontend /var/www/clusterchat/backend &&
    sudo cp -r ~/deploy_staging/frontend/* /var/www/clusterchat/frontend/ &&
    sudo cp -r ~/deploy_staging/backend/* /var/www/clusterchat/backend/ &&
    sudo chown -R www-data:www-data /var/www/clusterchat &&
    rm -rf ~/deploy_staging
"