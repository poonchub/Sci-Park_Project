# ใช้ Node.js official image
FROM node:20-alpine

# ตั้ง working directory
WORKDIR /app

# คัดลอก package.json และ package-lock.json ก่อนเพื่อลด layer rebuild
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install --production

# คัดลอก source code ทั้งหมด
COPY . .

# expose port ที่ socket.io ใช้งาน
EXPOSE 3001

# start server
CMD ["node", "socket-server.js"]