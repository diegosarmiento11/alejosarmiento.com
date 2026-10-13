// Embeds an Instagram reel, TikTok or YouTube video from its public URL.

type Embed = { src: string; vertical: boolean };

export function toEmbed(url: string): Embed | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "instagram.com") {
    const match = parsed.pathname.match(/^\/(reel|reels|p|tv)\/([\w-]+)/);
    return match
      ? { src: `https://www.instagram.com/${match[1] === "reels" ? "reel" : match[1]}/${match[2]}/embed`, vertical: true }
      : null;
  }
  if (host === "tiktok.com") {
    const match = parsed.pathname.match(/\/video\/(\d+)/);
    return match ? { src: `https://www.tiktok.com/embed/v2/${match[1]}`, vertical: true } : null;
  }
  if (host === "youtu.be" || host === "youtube.com") {
    const id =
      host === "youtu.be"
        ? parsed.pathname.slice(1)
        : (parsed.searchParams.get("v") ?? parsed.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1]);
    return id
      ? {
          src: `https://www.youtube-nocookie.com/embed/${id}`,
          vertical: parsed.pathname.startsWith("/shorts/"),
        }
      : null;
  }
  return null;
}

export function Video({ url, title = "Video" }: { url: string; title?: string }) {
  const embed = toEmbed(url);
  if (!embed) {
    return (
      <p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Ver el video
        </a>
      </p>
    );
  }
  return (
    <div
      className={
        embed.vertical
          ? "mx-auto aspect-[9/16] w-full max-w-[22rem] overflow-hidden rounded-2xl border bg-card"
          : "aspect-video w-full overflow-hidden rounded-2xl border bg-card"
      }
    >
      <iframe
        src={embed.src}
        title={title}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="size-full"
      />
    </div>
  );
}
