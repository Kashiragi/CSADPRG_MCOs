plugins {
    kotlin("jvm") version "2.1.20"
    kotlin("plugin.serialization") version "1.9.22"
    application
}

application{
    mainClass.set("org.mco2.MainKt")
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    implementation("org.jetbrains.kotlinx:dataframe:1.0.0-Beta3")
}

tasks.test {
    useJUnitPlatform()
}
kotlin {
    jvmToolchain(17)
}