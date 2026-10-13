"use client";

import { useState } from "react";
import { CheckIcon, LinkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { InstagramIcon, LinkedInIcon } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareButtons({
  url,
  title,
  storyImagePath,
}: {
  url: string;
  title: string;
  storyImagePath: string;
}) {
  const [copied, setCopied] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  async function copyLink() {
    if (await copy(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("No pudimos copiar el enlace.");
    }
  }

  // Instagram has no web share URL for Stories. On phones the system share sheet
  // hands the image to Instagram and the link is copied for a link sticker.
  async function shareToStories() {
    setPreparing(true);
    try {
      const response = await fetch(storyImagePath);
      if (!response.ok) throw new Error("story image failed");
      const blob = await response.blob();
      const file = new File([blob], "historia.png", { type: "image/png" });
      const copiedNow = await copy(url);
      setLinkCopied(copiedNow);

      // Only phones have Instagram in the share sheet; desktops get the download dialog.
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      if (isTouch && navigator.canShare?.({ files: [file] })) {
        if (copiedNow) toast.success("Enlace copiado: pégalo en el sticker de enlace.");
        await navigator.share({ files: [file], title });
        return;
      }
      setStoryDialogOpen(true);
    } catch (error) {
      // Closing the share sheet rejects with AbortError; that is not a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStoryDialogOpen(true);
      }
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={shareToStories}
        disabled={preparing}
        className="h-10 rounded-full bg-card px-4"
      >
        {preparing ? <Loader2Icon className="animate-spin" /> : <InstagramIcon />}
        Historias
      </Button>
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "outline", className: "h-10 rounded-full bg-card px-4" })}
      >
        <LinkedInIcon />
        LinkedIn
      </a>
      <Button variant="outline" onClick={copyLink} className="h-10 rounded-full bg-card px-4">
        {copied ? <CheckIcon /> : <LinkIcon />}
        {copied ? "Copiado" : "Copiar enlace"}
      </Button>

      <Dialog open={storyDialogOpen} onOpenChange={setStoryDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Compartir en historias</DialogTitle>
            <DialogDescription>
              Descarga la imagen, súbela a tu historia de Instagram y pega el enlace del post en un
              sticker de enlace.{" "}
              {linkCopied ? "El enlace ya quedó copiado." : "Cópialo con el botón «Copiar enlace»."}
            </DialogDescription>
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated on demand, not optimizable */}
          <img
            src={storyImagePath}
            alt={`Imagen para historias: ${title}`}
            className="mx-auto aspect-[9/16] w-44 rounded-xl border object-cover"
          />
          <a
            href={storyImagePath}
            download="historia.png"
            className={buttonVariants({ className: "h-10 rounded-full" })}
          >
            Descargar imagen
          </a>
        </DialogContent>
      </Dialog>
    </div>
  );
}
