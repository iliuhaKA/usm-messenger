# Стадия 1: сборка JAR (образ с Maven + JDK 21)
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .

# Скачиваем зависимости (этот слой закэшируется, если pom не менялся)
RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn package -B -DskipTests

# Стадия 2: только JRE и JAR
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Копируем JAR из стадии build
COPY --from=build /app/target/messenger-0.0.1-SNAPSHOT.jar app.jar
# Порт, на котором слушает приложение (как в application.yml: 8080)
EXPOSE 8080
# Запуск приложения
ENTRYPOINT ["java", "-jar", "app.jar"]