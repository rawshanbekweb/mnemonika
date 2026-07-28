/**
 * SpeakUp do'stlari — `app/.../ui/theme/Mascot.kt` ning web porti.
 *
 * IKKALA FAYL BIRGA O'ZGARTIRILISHI SHART. Loyihada bu qoida allaqachon bor
 * (SpeechAnalyzer.kt ↔ speech-analyzer.ts, Coach.kt ↔ coach.ts): bola ikkala
 * platformada bir xil tajribani ko'rishi kerak, aks holda "telefondagi qush
 * boshqa edi" degan savol tug'iladi.
 *
 * Koordinatalar Kotlin'dagi 0f..1f ulushlarining aynan 100 barobari
 * (viewBox="0 0 100 100"), shuning uchun ikki fayl yonma-yon solishtiriladi.
 *
 * FARQ (ataylab): web'da `level` yo'q. Web Speech API mikrofon signal
 * darajasini bermaydi, Android'dagi AudioRecord esa beradi. Shuning uchun
 * web'da "tinglash" holati faqat nafas oladi, ovozga javob bermaydi.
 */

export type MascotMood =
  | "idle"
  | "listening"
  | "speaking"
  | "thinking"
  | "happy"
  | "cheer"
  | "encourage";

export type MascotGear = "none" | "glasses" | "cap" | "brush" | "mask" | "mic";

export type MascotLook = {
  name: string;
  body: string;
  bodyDeep: string;
  gear: MascotGear;
  greeting: string;
};

// Ranglar Color.kt bilan bir xil bo'lishi shart.
const SUNNY = "#FFC53D";
const SUNNY_DEEP = "#E09B00";
const INK = "#22303F";
const CHEEK = "#FFB3C1";
const CORAL_DEEP = "#E8455C";

export const Bulbul: MascotLook = {
  name: "Bulbul",
  body: "#2BB3F3",
  bodyDeep: "#0E7FBF",
  gear: "none",
  greeting: "Bugun ham chiroyli gapiramizmi?",
};

/** Modul turiga mos do'st; noma'lum tur kelsa Bulbulning o'zi. */
export function mascotFor(type: string): MascotLook {
  switch (type) {
    case "discussion":
      return { name: "Fikr", body: "#2BB3F3", bodyDeep: "#0E7FBF", gear: "glasses", greeting: "Fikringni ayt — sababini ham tushuntir!" };
    case "storytelling":
      return { name: "Ertak", body: "#FFC53D", bodyDeep: "#E09B00", gear: "cap", greeting: "Qani, hikoyangni boshladik!" };
    case "picture_narrating":
      return { name: "Chizgi", body: "#3DD9A0", bodyDeep: "#12A97A", gear: "brush", greeting: "Rasmda nima ko'ryapsan? Hammasini ayt!" };
    case "roleplay":
      return { name: "Niqob", body: "#9B7BFF", bodyDeep: "#6B46E5", gear: "mask", greeting: "Bugun kim bo'lamiz? Rolga kirdik!" };
    case "interview":
      return { name: "Savol", body: "#FF7A8A", bodyDeep: "#E8455C", gear: "mic", greeting: "Savollarga to'liq javob ber!" };
    default:
      return Bulbul;
  }
}

/** Ballga qarab natija ekranidagi kayfiyat (Kotlin `moodForScore` bilan bir xil). */
export function moodForScore(score: number): MascotMood {
  if (score >= 80) return "cheer";
  if (score >= 50) return "happy";
  return "encourage";
}

export function Mascot({
  look,
  mood = "idle",
  size = 96,
  className = "",
}: {
  look: MascotLook;
  mood?: MascotMood;
  size?: number;
  className?: string;
}) {
  const smiling = mood === "happy" || mood === "cheer";
  const beakOpen = mood === "speaking" || mood === "cheer" || mood === "listening";
  // Kokil pastroq tushadi — dalda holatida personaj biroz "so'ligan" ko'rinadi.
  const crestDy = mood === "encourage" ? 1.2 : 0;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`mascot mascot--${mood} ${className}`}
      role="img"
      aria-label={look.name}
    >
      <g className="mascot__all">
        {/* Oyoqlar — tana ostidan chiqib turadi, shuning uchun avval */}
        {[40, 60].map((x) => (
          <line key={x} x1={x} y1={86} x2={x} y2={98.5} stroke={SUNNY} strokeWidth={5} strokeLinecap="round" />
        ))}

        {/* Kokil */}
        <g transform={`translate(0 ${crestDy})`}>
          {[
            [42, 0.85],
            [50, 1],
            [58, 0.85],
          ].map(([cx, sc]) => (
            <ellipse key={cx} cx={cx} cy={14 - 3.5 * sc} rx={3.5} ry={6.5 * sc} fill={look.bodyDeep} />
          ))}
        </g>

        {/* Qanotlar — bayramda ko'tariladi */}
        <ellipse className="mascot__wing mascot__wing--l" cx={22} cy={73} rx={7.5} ry={13} fill={look.bodyDeep} />
        <ellipse className="mascot__wing mascot__wing--r" cx={78} cy={73} rx={7.5} ry={13} fill={look.bodyDeep} />

        {/* Tana va bosh — bir xil rang, chegara ko'rinmaydi */}
        <ellipse cx={50} cy={72} rx={26} ry={21} fill={look.body} />
        <circle cx={50} cy={40} r={27} fill={look.body} />
        <ellipse cx={50} cy={74} rx={15} ry={14} fill="#FFFFFF" opacity={0.55} />

        {/* Yonoqlar — qattiq pushti: shaffof marjon ko'k tanada kulrang berardi */}
        <circle cx={28} cy={47} r={5.5} fill={CHEEK} />
        <circle cx={72} cy={47} r={5.5} fill={CHEEK} />

        {/* Ko'zlar */}
        {[38.5, 61.5].map((cx, i) => {
          const squint = mood === "thinking" && i === 0;
          if (smiling) {
            return (
              <path
                key={cx}
                d={`M ${cx - 6} 37.5 Q ${cx} 30.5 ${cx + 6} 37.5`}
                fill="none"
                stroke={INK}
                strokeWidth={2.8}
                strokeLinecap="round"
              />
            );
          }
          return (
            <g key={cx} className="mascot__eye">
              <ellipse cx={cx} cy={36} rx={squint ? 6.75 : 7.5} ry={squint ? 3.4 : 7.5} fill="#FFFFFF" />
              <circle cx={cx} cy={36} r={squint ? 2.5 : 4.1} fill={INK} />
              <circle cx={cx + 1.65} cy={33.9} r={1.5} fill="#FFFFFF" />
            </g>
          );
        })}

        {/* Tumshuq */}
        <polygon points="44.5,45 55.5,45 50,50.5" fill={SUNNY} />
        {beakOpen && (
          <polygon className="mascot__jaw" points="45.6,51.7 54.4,51.7 50,55.3" fill={SUNNY_DEEP} />
        )}

        {/* O'ylayotganda bosh tepasida nuqtalar */}
        {mood === "thinking" &&
          [72, 81, 90].map((cx, i) => (
            <circle
              key={cx}
              className="mascot__dot"
              style={{ animationDelay: `${i * 0.25}s` }}
              cx={cx}
              cy={16}
              r={2.6}
              fill={look.bodyDeep}
            />
          ))}

        <Gear gear={look.gear} />
      </g>
    </svg>
  );
}

/** Modulni ajratib turadigan yagona belgi. */
function Gear({ gear }: { gear: MascotGear }) {
  switch (gear) {
    case "glasses":
      return (
        <g stroke={INK} strokeWidth={2.4} fill="none">
          <circle cx={38.5} cy={36} r={9.8} />
          <circle cx={61.5} cy={36} r={9.8} />
          <line x1={48.3} y1={36} x2={51.7} y2={36} />
        </g>
      );
    case "cap":
      // Uchi va popugi tuvalga to'liq sig'ishi kerak — chetdan chiqqani kesiladi.
      return (
        <g>
          <polygon points="30,22 66,22 40,6" fill={CORAL_DEEP} />
          <circle cx={40} cy={5} r={4.5} fill={SUNNY} />
        </g>
      );
    case "brush":
      return (
        <g>
          <line x1={78} y1={86} x2={90} y2={56} stroke={INK} strokeOpacity={0.75} strokeWidth={3.8} strokeLinecap="round" />
          <circle cx={91.5} cy={51} r={5.5} fill={CORAL_DEEP} />
        </g>
      );
    case "mask":
      // Rang tana rangidan olinmaydi: binafsha niqob binafsha tanada yo'qolardi.
      return (
        <g>
          <line x1={30} y1={34} x2={70} y2={34} stroke={INK} strokeWidth={10.5} strokeLinecap="round" />
          {[38.5, 61.5].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy={34} rx={6.2} ry={4.5} fill="#FFFFFF" />
              <circle cx={cx} cy={34} r={3.5} fill={INK} />
            </g>
          ))}
        </g>
      );
    case "mic":
      return (
        <g>
          <line x1={87} y1={82} x2={87} y2={62} stroke={INK} strokeOpacity={0.7} strokeWidth={3.2} strokeLinecap="round" />
          <ellipse cx={87} cy={55.5} rx={7} ry={9.5} fill={INK} />
          <circle cx={85.5} cy={53} r={2.8} fill="#FFFFFF" fillOpacity={0.35} />
        </g>
      );
    default:
      return null;
  }
}

/** Personaj + gap pufagi (Kotlin'dagi `MascotSays`). */
export function MascotSays({
  look,
  text,
  mood = "idle",
  size = 72,
  className = "",
  bubbleClassName = "bg-white",
}: {
  look: MascotLook;
  text: string;
  mood?: MascotMood;
  size?: number;
  className?: string;
  bubbleClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Mascot look={look} mood={mood} size={size} className="shrink-0" />
      <div className={`rounded-2xl px-4 py-3 text-sm ${bubbleClassName}`}>{text}</div>
    </div>
  );
}
