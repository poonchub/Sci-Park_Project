# Use a multi-stage build to reduce the final image size
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY . .
RUN apk add --no-cache build-base tzdata
RUN go mod tidy
RUN go build -o main .

# Use a minimal base image for the final stage
FROM alpine:latest
WORKDIR /app
# ติดตั้ง tzdata เพื่อให้ timezone ใช้งานได้
RUN apk add --no-cache tzdata
# ตั้งค่า timezone ของ container
ENV TZ=Asia/Bangkok
COPY --from=builder /app/main .
COPY --from=builder /app/images ./images
EXPOSE 8000
CMD ["./main"]
