plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
}

android {
    namespace = "uz.speakingapp"
    compileSdk = 36

    defaultConfig {
        applicationId = "uz.speakingapp"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
        vectorDrawables { useSupportLibrary = true }

        // ── Backend (Vercel) sozlamalari ──────────────────────────────
        // Deploydan keyin bu URL'ni o'zingizning Vercel manzilingizga o'zgartiring,
        // masalan: "https://speakup-web.vercel.app". Bo'sh bo'lsa ilova faqat
        // ichki (bundled) kontentdan ishlaydi — online sync o'chiriladi.
        buildConfigField("String", "API_BASE_URL", "\"\"")
        // /api/attempts uchun umumiy token (.env dagi ATTEMPTS_INGEST_TOKEN bilan bir xil).
        buildConfigField("String", "ATTEMPTS_TOKEN", "\"\"")

        // APK hajmini kamaytirish: kamdan-kam kerak x86 (32-bit) ni chiqarib tashlaymiz.
        // arm64-v8a/armeabi-v7a — telefonlar, x86_64 — emulyator.
        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
    // Offline speech recognition (Vosk)
    implementation(libs.vosk.android)
    implementation("net.java.dev.jna:jna:5.13.0@aar")
    // Room (mahalliy progress bazasi)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    debugImplementation(libs.androidx.ui.tooling)
}
