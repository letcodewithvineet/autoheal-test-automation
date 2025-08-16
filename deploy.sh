#!/bin/bash

# Production deployment script for Autoheal Test Automation System
echo "Starting production deployment..."

# Install dependencies
echo "Installing production dependencies..."
npm ci --only=production

# Build the application
echo "Building application for production..."
npm run build

# Start the production server
echo "Starting production server..."
npm run start