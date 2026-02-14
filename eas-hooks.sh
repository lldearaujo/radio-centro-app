#!/bin/bash
# EAS Build Hook - Pre-install
# Este script garante que npm install seja usado em vez de npm ci

# Remover package-lock.json se existir para forçar npm install
if [ -f "package-lock.json" ]; then
    rm package-lock.json
fi

# Usar npm install com legacy-peer-deps
npm install --legacy-peer-deps
