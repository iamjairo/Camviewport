# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache git make

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o camviewport ./cmd/camviewport

# Production stage
FROM alpine:latest AS production

WORKDIR /app

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1000 camview && \
    adduser -D -u 1000 -G camview camview

# Copy binary from builder
COPY --from=builder /build/camviewport /app/
COPY --from=builder /build/web /app/web

# Set ownership
RUN chown -R camview:camview /app

# Create data directory
RUN mkdir -p /app/data && chown -R camview:camview /app/data

USER camview

EXPOSE 8080

ENTRYPOINT ["/app/camviewport"]
CMD ["--config", "/app/data/config.yaml"]