/**
 * Mashqning vizual ishorasi — Android'dagi VisualTile bilan bir xil mantiq.
 *
 * Kontentdagi `visuals` maydoni rasm URL'i (`https://…`, media kutubxonasidan)
 * yoki emoji tokeni bo'lishi mumkin. Emoji BEZAK emas, mashqning mazmuni:
 * bola aynan shu tasvir haqida gapiradi. Shuning uchun u olib tashlanmadi,
 * balki bosiq ramkaga solindi. Rasm URL'i qo'yilsa o'sha joyda rasm chiqadi.
 */
export function Visual({ token, size = 88 }: { token: string; size?: number }) {
  const isUrl = token.startsWith("http://") || token.startsWith("https://");

  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-surface-muted"
      style={{ width: size, height: size }}
    >
      {isUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={token}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span style={{ fontSize: size * 0.42, lineHeight: 1 }}>{token}</span>
      )}
    </span>
  );
}
