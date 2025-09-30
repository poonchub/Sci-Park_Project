FROM node:18-bullseye-slim

WORKDIR /app

# คัดลอกไฟล์ dependency ก่อน
COPY package*.json ./

# เคลียร์ lockfile และติดตั้งใหม่
RUN rm -rf node_modules package-lock.json && npm install

# คัดลอกโค้ดทั้งหมด
COPY . .

# ปิดการใช้ rollup native
ENV ROLLUP_USE_JS=true

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]