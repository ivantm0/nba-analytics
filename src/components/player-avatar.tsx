/* eslint-disable @next/next/no-img-element -- imágenes externas de ESPN, sin optimizar */

export function PlayerAvatar({ src, name, size = 56 }: { src: string | null; name: string; size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover object-top"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span aria-hidden className="flex h-full w-full items-center justify-center text-sm font-medium text-zinc-400">
          {name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
        </span>
      )}
    </div>
  );
}
