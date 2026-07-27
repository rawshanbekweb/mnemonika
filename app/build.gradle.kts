import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
}

// Backend sozlamalari local.properties'dan o'qiladi (git'ga tushmaydi — maxfiy qoladi).
// Namuna uchun local.properties.example ga qarang.
val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
val apiBaseUrl: String = localProps.getProperty("API_BASE_URL", "")
val attemptsToken: String = localProps.getProperty("ATTEMPTS_TOKEN", "")

android {
    namespace = "uz.speakingapp"
    compileSdk = 36

    defaultConfig {
        applicationId = "uz.speakingapp"
        minSdk = 24
        targetSdk = 36
        // Har tarqatishdan oldin ko'tarilishi kerak: yuklab olish fayl nomi
        // versionName'dan tuziladi, shuning uchun o'quvchi qaysi build'ni
        // olganini shundan biladi. 0.1.1 — yozuvni to'xtatishda crash tuzatildi.
        versionCode = 2
        versionName = "0.1.1"
        vectorDrawables { useSupportLibrary = true }

        // ── Backend (Vercel) sozlamalari — local.properties'dan ────────
        // local.properties (git-ignored) ga qo'ying:
        //   API_BASE_URL=https://mnemonika.vercel.app
        //   ATTEMPTS_TOKEN=<ATTEMPTS_INGEST_TOKEN bilan bir xil>
        // Bo'sh bo'lsa ilova faqat ichki (bundled) kontentdan ishlaydi — online sync o'chiq.
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
        buildConfigField("String", "ATTEMPTS_TOKEN", "\"$attemptsToken\"")

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
    // Kontentdagi rasm URL'larini ko'rsatish uchun (visuals emoji ham, URL ham bo'lishi mumkin)
    implementation(libs.coil.compose)
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
