# ==========================================
# STAGE 1: Build the Spring Boot application
# ==========================================
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /workspace

# Install bash and dos2unix for gradle wrapper
RUN apk add --no-cache bash dos2unix

# Copy gradle wrapper and config
COPY bodygym-backend/gradlew /workspace/bodygym-backend/
COPY bodygym-backend/gradle /workspace/bodygym-backend/gradle
COPY bodygym-backend/build.gradle /workspace/bodygym-backend/
COPY bodygym-backend/settings.gradle /workspace/bodygym-backend/

# Fix line endings and permissions
RUN dos2unix /workspace/bodygym-backend/gradlew && chmod +x /workspace/bodygym-backend/gradlew

# Copy source code
COPY bodygym-backend/src /workspace/bodygym-backend/src

# Build JAR
WORKDIR /workspace/bodygym-backend
RUN ./gradlew bootJar --no-daemon -x test

# ==========================================
# STAGE 2: Lightweight Production Runtime
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Server Port
EXPOSE 8080

# Copy executable jar from builder stage
COPY --from=builder /workspace/bodygym-backend/build/libs/*.jar app.jar

# Copy dataset media files (images, GIFs & json)
COPY exercises-dataset /app/exercises-dataset

# Environment variables
ENV SERVER_PORT=8080
ENV JAVA_OPTS="-Xms256m -Xmx512m -Djava.security.egd=file:/dev/./urandom"

# Launch Spring Boot
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
