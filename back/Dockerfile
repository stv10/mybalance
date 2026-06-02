# Stage 1: Build the application using Maven and Java 25
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src
# Build the application, skipping tests for faster deployment
RUN mvn clean package -DskipTests

# Stage 2: Create the lightweight production image
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
# Copy only the compiled JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose the default Spring Boot port
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]