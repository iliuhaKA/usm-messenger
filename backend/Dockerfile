# Стадия 1: сборка JAR (образ с Maven + JDK 21)
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .

# Скачиваем зависимости (этот слой закэшируется, если pom не менялся)
RUN mvn dependency:go-offline -B

COPY src ./src

# Самоподписной keystore для HTTPS/WSS. Перегенерируется при каждой сборке —
# это нормально для self-signed dev-сертификата. Файл попадает в classpath
# приложения и подхватывается Spring как classpath:keystore.p12.
# rm -f нужен на случай, если в build context попал ранее сгенерённый keystore.
RUN rm -f src/main/resources/keystore.p12 && keytool -genkeypair \
      -alias usm \
      -keyalg RSA \
      -keysize 2048 \
      -validity 365 \
      -storetype PKCS12 \
      -keystore src/main/resources/keystore.p12 \
      -storepass changeit \
      -keypass changeit \
      -dname "CN=localhost, OU=USM, O=USM, L=Chisinau, S=MD, C=MD" \
      -ext "san=dns:localhost,ip:127.0.0.1"

RUN mvn package -B -DskipTests

# Стадия 2: только JRE и JAR
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/messenger-0.0.1-SNAPSHOT.jar app.jar
# HTTPS-порт (см. application.yml)
EXPOSE 8443
ENTRYPOINT ["java", "-jar", "app.jar"]
