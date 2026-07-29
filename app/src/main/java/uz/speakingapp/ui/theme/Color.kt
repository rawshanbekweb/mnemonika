package uz.speakingapp.ui.theme

import androidx.compose.ui.graphics.Color

// ════════════════════════════════════════════════════════════════════
//  SpeakUp — bolalar palitrasi
//
//  Android ilovasi 5–6 sinf o'quvchisi uchun, shuning uchun bu yerda
//  akademik ko'k/oltin emas, yorqin va issiq ranglar ishlatiladi.
//  Web'dagi admin/o'qituvchi paneli ataylab akademik bo'lib qoladi —
//  u kattalar uchun va bu ikki yuzaning maqsadi boshqa.
//
//  MUHIM: eski nom (Navy, Gold, Violet…) larning hammasi fayl oxirida
//  yangi ranglarga yo'naltirilgan. Ekranlar o'sha nomlarni ishlatadi,
//  shuning uchun palitra almashsa ham hech narsa buzilmaydi — 2026-07-25
//  dagi binafsha→ko'k o'tishida ham aynan shu usul ishlatilgan edi.
// ════════════════════════════════════════════════════════════════════

// ── Asosiy: musaffo osmon ko'ki ─────────────────────────────────
val Sky = Color(0xFF2BB3F3)
val SkyDeep = Color(0xFF0E7FBF)
val SkyDark = Color(0xFF085C8C)
val SkyContainer = Color(0xFFDFF3FE)
val OnSkyContainer = Color(0xFF0A4B72)

// ── Quyoshli sariq: urg'u, XP, nishonlar ────────────────────────
val Sunny = Color(0xFFFFC53D)
val SunnyDeep = Color(0xFFE09B00)
val SunnyContainer = Color(0xFFFFF3D6)
val OnSunnyContainer = Color(0xFF7A5200)

// ── Marjon: iliqlik, seriya olovi ───────────────────────────────
val Coral = Color(0xFFFF7A8A)
val CoralDeep = Color(0xFFE8455C)
val CoralContainer = Color(0xFFFFE4E8)
val OnCoralContainer = Color(0xFF8E1F31)

// ── Yalpiz: muvaffaqiyat ────────────────────────────────────────
val Mint = Color(0xFF3DD9A0)
val MintDeep = Color(0xFF12A97A)
val MintContainer = Color(0xFFDDF7EE)
val OnMintContainer = Color(0xFF0A6B4D)

// ── Uzum: o'yin, xayol ──────────────────────────────────────────
val Grape = Color(0xFF9B7BFF)
val GrapeDeep = Color(0xFF6B46E5)
val GrapeContainer = Color(0xFFECE6FF)
val OnGrapeContainer = Color(0xFF432A9E)

// ── Holat ranglari ──────────────────────────────────────────────
val Success = MintDeep
val SuccessContainer = MintContainer
val Danger = Color(0xFFE8455C)
val Warning = SunnyDeep

/**
 * Personaj yonog'i. Qattiq (shaffof emas) rang — shaffof marjon ko'k yoki
 * binafsha tana ustida loyqa kulrangga aylanadi. Qarang: Mascot.kt.
 */
val CheekPink = Color(0xFFFFB3C1)

// ── Neytral / yuzalar ───────────────────────────────────────────
// Fon sovuq kulrang emas, iliq krem — bolalar ilovasida do'stona ko'rinadi.
val AppBackground = Color(0xFFFFFBF4)
val SurfaceWhite = Color(0xFFFFFFFF)
val SurfaceMuted = Color(0xFFF3F6FA)
val InkStrong = Color(0xFF22303F)
val InkMuted = Color(0xFF6B7C8F)
val OutlineSoft = Color(0xFFE6EDF3)

// ── Modul urg'u ranglari ────────────────────────────────────────
// Har modulning o'z rangi bor va u modul do'sti (mascot) rangi bilan
// bir xil — bola rangdan modulni tanib oladi. Qarang: Mascot.kt.
val ModuleDiscussion = Sky
val ModuleStorytelling = SunnyDeep
val ModulePicture = MintDeep
val ModuleRoleplay = GrapeDeep
val ModuleInterview = CoralDeep
/** Erkin suhbat — beshta modul rangi band, shuning uchun asosiy ko'kning to'qrog'i. */
val ModuleFreeTalk = SkyDark

// ════════════════════════════════════════════════════════════════
//  Eski nomlar bilan moslik — ekranlar hali shularni ishlatadi.
//  Yangi kod yozganda yuqoridagi asl nomlarni ishlating.
// ════════════════════════════════════════════════════════════════
val Navy = Sky
val NavyDeep = SkyDeep
val NavyLight = Sky
val NavyContainer = SkyContainer
val OnNavyContainer = OnSkyContainer

val Gold = Sunny
val GoldDeep = SunnyDeep
val GoldContainer = SunnyContainer
val OnGoldContainer = OnSunnyContainer

val Violet = Grape
val VioletDeep = GrapeDeep
val VioletBright = Grape
val VioletContainer = GrapeContainer
val OnVioletContainer = OnGrapeContainer

val Amber = Sunny
