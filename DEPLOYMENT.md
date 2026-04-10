# AWS EC2 Deployment Guide

Follow these steps to deploy ExportSaathi on a fresh AWS EC2 instance.

## 1. Launch EC2 Instance
1. Go to AWS Console → **EC2** → **Launch Instances**
2. **Name**: `ExportSaathi`
3. **OS**: Ubuntu Server 24.04 LTS (Free Tier eligible)
4. **Instance Type**: `t2.micro` or `t3.micro`
5. **Key Pair**: Create a new one or use existing
6. **Network Settings**:
   - Allow SSH traffic (Port 22)
   - Allow HTTP traffic (Port 80)
   - Allow HTTPS traffic (Port 443)
7. Click **Launch**

## 2. Connect to EC2
Using SSH and your key pair, connect to your instance:
```bash
ssh -i /path/to/your/key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

## 3. Clone Repository
Inside your EC2 instance, clone your GitHub repository:
```bash
git clone https://github.com/Jayesh-Gautam/ExportSaathi-AI-for-Bharat.git
cd ExportSaathi-AI-for-Bharat
```

## 4. Add AWS Credentials
Create your `.env` file with your AWS keys so the backend can access Bedrock:
```bash
cd backend
cp .env.example .env
nano .env
```
Add your Access Key ID and Secret Access Key. Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

## 5. Install Redis Server
Since the backend uses Redis for caching and session state, you need to install it on your instance:
```bash
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## 6. Run Deployment Script
Go back to the project root and run the deployment script. This installs Node, Python, Nginx, builds the frontend, and sets up the backend as a systemd service.

```bash
cd /home/ubuntu/ExportSaathi-AI-for-Bharat
chmod +x deploy.sh
./deploy.sh
```

## 6. Access Your App!
Your app should now be live! Open your browser and go to:
`http://<YOUR_EC2_PUBLIC_IP>`

---

## Useful Commands (Maintenance)

If you make changes to the code later and pull them to EC2, here is how to restart services:

**Restart Backend:**
```bash
sudo systemctl restart exportsaathi.service
```

**Check Backend Logs:**
```bash
sudo journalctl -u exportsaathi.service -f
```

**Rebuild Frontend (if UI changed):**
```bash
cd frontend
npm run build
```

**Restart Nginx:**
```bash
sudo systemctl restart nginx
```
