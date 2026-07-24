# kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keepclassmembers class uz.speakingapp.** {
    *** Companion;
}
-keepclasseswithmembers class uz.speakingapp.** {
    kotlinx.serialization.KSerializer serializer(...);
}
