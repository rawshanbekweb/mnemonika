# kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keepclassmembers class uz.speakingapp.** {
    *** Companion;
}
-keepclasseswithmembers class uz.speakingapp.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# ── Vosk + JNA (offline ASR) ───────────────────────────────────────────────
# MUHIM: JNA mahalliy kutubxonaga refleksiya orqali bog'lanadi — interfeys
# metodlari NOMI bo'yicha topiladi, Structure maydonlari esa C tuzilmasi bilan
# bir xil TARTIBDA turishi shart. R8 nomni o'zgartirsa yoki maydonni olib
# tashlasa, kompilyatsiya muvaffaqiyatli o'tadi, lekin ilova ishga tushganda
# UnsatisfiedLinkError beradi yoki xotirani buzadi. Shuning uchun to'liq keep.
-keep class com.sun.jna.** { *; }
-keep class * implements com.sun.jna.** { *; }
-keepclassmembers class * extends com.sun.jna.Structure { *; }
-keep class org.vosk.** { *; }

# JNA desktop Java sinflariga havola qiladi (java.awt) — Android'da ular yo'q,
# bu ogohlantirishlar zararsiz.
-dontwarn java.awt.**
-dontwarn com.sun.jna.**
-dontwarn org.vosk.**
