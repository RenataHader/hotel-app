# ---- build ----
FROM maven:3.9.9-eclipse-temurin-21 AS build
ARG MODULE
WORKDIR /workspace
COPY . .
RUN mvn -DskipTests -pl ${MODULE} -am package

# ---- run ----
FROM eclipse-temurin:21-jre
ARG MODULE
WORKDIR /app
COPY --from=build /workspace/${MODULE}/target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]
