#!/bin/bash
cd /home/ubuntu/therapy-assist-niti-ai
git pull origin main
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up
