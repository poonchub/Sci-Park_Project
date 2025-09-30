# Use a multi-stage build to reduce the final image size
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY backend .
RUN apk add --no-cache build-base
RUN go mod tidy
RUN go build -o main .
# Use a minimal base image for the final stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]