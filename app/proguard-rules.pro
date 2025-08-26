-dontwarn kotlinx.coroutines.**
-keep class kotlinx.coroutines.** { *; }
-keepclassmembers class ** {
    @android.webkit.JavascriptInterface <methods>;
}