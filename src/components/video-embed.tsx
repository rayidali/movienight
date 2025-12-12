'use client';

import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Loader2, Play } from 'lucide-react';
import Link from 'next/link';
import { parseVideoUrl, getProviderDisplayName, type ParsedVideo } from '@/lib/video-utils';
import { Button } from '@/components/ui/button';
import { TiktokIcon } from './icons';
import { Instagram, Youtube } from 'lucide-react';

const retroButtonClass =
  'border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-200';

type VideoEmbedProps = {
  url: string | undefined;
  autoLoad?: boolean;
  autoPlay?: boolean;
};

function ProviderIcon({ provider }: { provider: ParsedVideo['provider'] }) {
  switch (provider) {
    case 'tiktok':
      return <TiktokIcon className="h-5 w-5" />;
    case 'instagram':
      return <Instagram className="h-5 w-5" />;
    case 'youtube':
      return <Youtube className="h-5 w-5" />;
    default:
      return <Play className="h-5 w-5" />;
  }
}

// Load external script dynamically
function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

// TikTok Embed Component
function TikTokEmbed({ videoId, url }: { videoId: string; url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTikTok = async () => {
      try {
        await loadScript('https://www.tiktok.com/embed.js', 'tiktok-embed-script');

        // TikTok's embed.js looks for blockquotes and processes them
        // We need to trigger reprocessing after adding our blockquote
        if ((window as any).tiktokEmbed?.lib?.render) {
          (window as any).tiktokEmbed.lib.render();
        }

        // Give it time to render
        setTimeout(() => setIsLoading(false), 1000);
      } catch (error) {
        console.error('Failed to load TikTok embed:', error);
        setIsLoading(false);
      }
    };

    loadTikTok();
  }, [videoId]);

  // Extract username from URL if possible
  const usernameMatch = url.match(/@([\w.-]+)/);
  const username = usernameMatch ? usernameMatch[1] : 'user';

  return (
    <div ref={containerRef} className="relative w-full min-h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: '100%', minWidth: '300px' }}
      >
        <section>
          <a target="_blank" href={`https://www.tiktok.com/@${username}`}>@{username}</a>
        </section>
      </blockquote>
    </div>
  );
}

// Instagram Embed Component
function InstagramEmbed({ videoId, url }: { videoId: string; url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInstagram = async () => {
      try {
        await loadScript('https://www.instagram.com/embed.js', 'instagram-embed-script');

        // Instagram's embed.js provides instgrm.Embeds.process()
        if ((window as any).instgrm?.Embeds?.process) {
          (window as any).instgrm.Embeds.process();
        }

        // Give it time to render
        setTimeout(() => setIsLoading(false), 1000);
      } catch (error) {
        console.error('Failed to load Instagram embed:', error);
        setIsLoading(false);
      }
    };

    loadInstagram();
  }, [videoId]);

  const embedUrl = `https://www.instagram.com/p/${videoId}/`;

  return (
    <div ref={containerRef} className="relative w-full min-h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={embedUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '300px',
          padding: 0,
          width: '100%',
        }}
      >
        <div style={{ padding: '16px' }}>
          <a
            href={embedUrl}
            style={{
              background: '#FFFFFF',
              lineHeight: 0,
              padding: 0,
              textAlign: 'center',
              textDecoration: 'none',
              width: '100%',
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <div style={{
                backgroundColor: '#F4F4F4',
                borderRadius: '50%',
                flexGrow: 0,
                height: '40px',
                marginRight: '14px',
                width: '40px',
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
                <div style={{
                  backgroundColor: '#F4F4F4',
                  borderRadius: '4px',
                  flexGrow: 0,
                  height: '14px',
                  marginBottom: '6px',
                  width: '100px',
                }} />
                <div style={{
                  backgroundColor: '#F4F4F4',
                  borderRadius: '4px',
                  flexGrow: 0,
                  height: '14px',
                  width: '60px',
                }} />
              </div>
            </div>
            <div style={{ padding: '19% 0' }} />
            <div style={{
              color: '#3897f0',
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 550,
              lineHeight: '18px',
            }}>
              View this post on Instagram
            </div>
          </a>
        </div>
      </blockquote>
    </div>
  );
}

// YouTube Embed Component (works for Shorts too)
function YouTubeEmbed({ videoId }: { videoId: string }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full" style={{ aspectRatio: '9/16', maxWidth: '360px', margin: '0 auto' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <iframe
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}

export function VideoEmbed({ url, autoLoad = false, autoPlay = true }: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const parsedVideo = parseVideoUrl(url);

  // Auto-load the embed if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      setIsLoaded(true);
    }
  }, [autoLoad]);

  if (!parsedVideo || !parsedVideo.provider) {
    // Fallback for unsupported URLs - just show a link
    if (url) {
      return (
        <div className="flex items-center justify-center p-4 bg-secondary rounded-lg border-[3px] border-black">
          <Button asChild variant="outline" className={retroButtonClass}>
            <Link href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Video
            </Link>
          </Button>
        </div>
      );
    }
    return null;
  }

  const handleLoadEmbed = () => {
    setIsLoaded(true);
  };

  // Show "Click to load" button before loading the iframe
  if (!isLoaded) {
    return (
      <div className="relative w-full aspect-[9/16] max-h-[500px] bg-secondary rounded-lg border-[3px] border-black overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ProviderIcon provider={parsedVideo.provider} />
            <span className="font-bold">{getProviderDisplayName(parsedVideo.provider)}</span>
          </div>
          <Button onClick={handleLoadEmbed} className={retroButtonClass}>
            <Play className="h-4 w-4 mr-2" />
            Load Video
          </Button>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href={parsedVideo.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Open in {getProviderDisplayName(parsedVideo.provider)}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Render the appropriate native embed based on provider
  return (
    <div className="relative w-full bg-secondary rounded-lg border-[3px] border-black overflow-hidden p-2">
      {parsedVideo.provider === 'youtube' && parsedVideo.videoId && (
        <YouTubeEmbed videoId={parsedVideo.videoId} />
      )}

      {parsedVideo.provider === 'tiktok' && parsedVideo.videoId && (
        <TikTokEmbed videoId={parsedVideo.videoId} url={parsedVideo.url} />
      )}

      {parsedVideo.provider === 'instagram' && parsedVideo.videoId && (
        <InstagramEmbed videoId={parsedVideo.videoId} url={parsedVideo.url} />
      )}

      {/* Fallback link */}
      <div className="flex justify-center mt-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={parsedVideo.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3 mr-1" />
            Open in {getProviderDisplayName(parsedVideo.provider)}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Compact video preview for showing in lists/grids
 */
type VideoPreviewProps = {
  url: string | undefined;
  onClick?: () => void;
};

export function VideoPreview({ url, onClick }: VideoPreviewProps) {
  const parsedVideo = parseVideoUrl(url);

  if (!parsedVideo || !parsedVideo.provider) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border-[2px] border-black hover:bg-accent transition-colors"
    >
      <ProviderIcon provider={parsedVideo.provider} />
      <span className="text-sm font-bold">{getProviderDisplayName(parsedVideo.provider)}</span>
    </button>
  );
}
