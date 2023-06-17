# === THIS SCRIPT RUNS IN YOUR COMPUTER ===
#!/bin/bash

# Path to the private ssh key (must be registered at the vps)
SSH_IDENTITY=$1
SSH_PORT=$2
SSH_USER=$3
SSH_HOST=$4
SSH_DEST=$5

cd app/

if [ ! -d node_modules/ ]; then
    echo "Installing dependencies"
    npm i
fi

if [ -f polygon-escrow.zip ]; then
    rm polygon-escrow.zip
fi

if [ -d build/ ]; then
    echo "Removing the existing build/ directoy"
    rm -rf build/
fi

echo "Building the application into build/"

npm run build

# Once the application is built, zip the file
zip -r polygon-escrow.zip build/

# Send the file to the VPS server with scp with the given identity ssh private key file
scp -4 -B -i "$SSH_IDENTITY" -P "$SSH_PORT" polygon-escrow.zip "$SSH_USER@$SSH_HOST/$SSH_DEST"
