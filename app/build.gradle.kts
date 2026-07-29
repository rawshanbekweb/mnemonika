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

// Release imzo kaliti ham local.properties'dan. Kalit topilmasa release build
// imzosiz chiqadi (o'rnatib bo'lmaydi), shuning uchun buni jimgina o'tkazib
// yubormay, ogohlantirish chiqaramiz — namuna local.properties.example da.
val releaseStoreFile: File? = localProps.getProperty("RELEASE_STORE_FILE")
    ?.takeIf { it.isNotBlank() }
    ?.let { rootProject.file(it) }
    ?.takeIf { it.exists() }

android {
    namespace = "uz.speakingapp"
    compileSdk = 36

    defaultConfig {
        applicationId = "uz.speakingapp"
        minSdk = 24
        targetSdk = 36
        // Har tarqatishdan oldin ko'tarilishi kerak: yuklab olish fayl nomi
        // versionName'dan tuziladi, shuning uchun o'quvchi qaysi build'ni
        // olganini shundan biladi. 0.1.1 — yozuvni to'xtatishda crash tuzatildi;
        // 0.1.2 — yaratilgan ingliz talaffuzi audiosi (VoiceCue, offline kesh);
        // 0.1.3 — mashqqa xos murabbiy maslahatlari (maslahat banki);
        // 0.1.4 — birinchi imzolangan release build (R8 + shrinkResources, 27.8MB).
        //         DIQQAT: 0.1.3 gacha tarqatilgan APK'lar debug kaliti bilan imzolangan
        //         edi, shuning uchun ular ustiga o'rnatilmaydi — avval o'chirish kerak.
        // 0.1.5 — bolalar uchun yangi dizayn: "SpeakUp do'stlari" personajlari
        //         (Canvas'da chiziladi, APK hajmi oshmaydi) va animatsiyalar.
        // 0.1.6 — kontent 3 baravar: bundled zaxirada 25 mashq + 7 dialog
        //         (avval 7 + 4). Internetsiz o'rnatgan bola ham hammasini ko'radi.
        // 0.1.7 — "Erkin suhbat" moduli: tarmoqlanuvchi suhbat daraxti bo'ylab
        //         jonli audio suhbat (offline, modelsiz) + suhbat tahlili.
        // 0.1.8 — kontent to'ldi (13 dialog, 6 erkin suhbat, 23 audio klip);
        //         zaxira o'chirildi (transkript Google Drive'ga tushmaydi) va
        //         profil ekranida maxfiylik siyosati havolasi paydo bo'ldi.
        versionCode = 9
        versionName = "0.1.8"
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

    signingConfigs {
        if (releaseStoreFile != null) {
            create("release") {
                storeFile = releaseStoreFile
                storePassword = localProps.getProperty("RELEASE_STORE_PASSWORD")
                keyAlias = localProps.getProperty("RELEASE_KEY_ALIAS")
                keyPassword = localProps.getProperty("RELEASE_KEY_PASSWORD")
                // minSdk 24 — v1 (JAR) imzosi faqat API 24 dan past qurilmalarga kerak,
                // shuning uchun o'chirilgan (o'rnatish tezroq). v3 kelajakda kalitni
                // almashtirish (key rotation) imkonini beradi.
                enableV1Signing = false
                enableV2Signing = true
                enableV3Signing = true
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            // Kod qisqargandan keyin ishlatilmagan resurslar ham olib tashlanadi.
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (releaseStoreFile != null) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                logger.warn(
                    "OGOHLANTIRISH: RELEASE_STORE_FILE topilmadi — release APK IMZOSIZ chiqadi " +
                        "va telefonga o'rnatilmaydi. local.properties.example ga qarang."
                )
            }
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
    // Sof mantiq testlari (suhbat dvigateli, tahlil) — qurilma kerak emas:
    // `.\gradlew.bat testDebugUnitTest`
    testImplementation("junit:junit:4.13.2")
}
