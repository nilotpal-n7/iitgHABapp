plugins {
    id("com.android.application") apply false
    id("org.jetbrains.kotlin.android") apply false
    id("com.google.gms.google-services") version "4.4.2" apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir = rootProject.layout.buildDirectory.dir("../build")
rootProject.layout.buildDirectory.set(newBuildDir)

subprojects {
    val subBuildDir = newBuildDir.map { it.dir(project.name) }
    layout.buildDirectory.set(subBuildDir)
}

subprojects {
    afterEvaluate {
        if (plugins.hasPlugin("com.android.application") ||
            plugins.hasPlugin("com.android.library")) {
            extensions.configure<com.android.build.gradle.BaseExtension> {
                compileSdkVersion(35)
            }
        }
    }
}

subprojects {
    evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
