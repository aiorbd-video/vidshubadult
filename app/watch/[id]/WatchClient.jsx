"use client";
import React, { useEffect, useRef } from 'react';
import { Share2 } from 'lucide-react';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

export default function WatchClient({ video, allVideos }) {
    const artRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Load Artplayer scripts dynamically if not loaded
        const initPlayer = async () => {
            if (!window.Artplayer) {
                await new Promise(res => { const s = document.createElement('script'); s.src = "[https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js](https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js)"; s.onload = res; document.head.appendChild(s); });
                await new Promise(res => { const s = document.createElement('script'); s.src = "[https://cdn.jsdelivr.net/npm/hls.js@latest](https://cdn.jsdelivr.net/npm/hls.js@latest)"; s.onload = res; document.head.appendChild(s); });
            }

            const art = new window.Artplayer({
                container: artRef.current,
                url: video.url,
                poster: video.image,
                title: video.title,
                volume: 1.0,
                isLive: false,
                autoplay: true,
                pip: true,
                fullscreen: true,
                fullscreenWeb: true,
                setting: true,
                rotate: true,
                flip: true,
                playbackRate: true,
                aspectRatio: true,
                theme: '#ff0000',
                autoOrientation: true,
                moreVideoAttr: { crossOrigin: 'anonymous', playsinline: 'true' },
                controls: [
                    {
                        name: 'aspect', position: 'right',
                        html: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
                        tooltip: 'Aspect Ratio',
                        selector: [
                            { html: 'Default', url: 'default' }, { html: 'Crop', url: 'cover' },
                            { html: 'Fill', url: 'fill' }, { html: '16:9', url: '16:9' }
                        ],
                        onSelect: function (item) {
                            art.video.style.objectFit = item.url === 'default' ? 'contain' : item.url;
                            art.aspectRatio = item.url === 'default' ? 'default' : 'default';
                            return item.html;
                        }
                    }
                ],
                customType: {
                    m3u8: function (vid, url, artObj) {
                        if (window.Hls && window.Hls.isSupported()) {
                            const hls = new window.Hls();
                            hls.loadSource(url);
                            hls.attachMedia(vid);
                        } else if (vid.canPlayType('application/vnd.apple.mpegurl')) { vid.src = url; }
                    }
                }
            });

            return () => { if (art && art.destroy) art.destroy(false); };
        };
        
        initPlayer();
    }, [video]);

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Link copied! You can share it on Facebook or Telegram.');
    };

    return (
        <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Player Column */}
                <div className="lg:w-[70%] xl:w-[73%]">
                    <div ref={artRef} className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative z-10"></div>
                    
                    <div className="mt-4 px-1">
                        <h1 className="text-lg md:text-xl font-bold mb-2">{video.title}</h1>
                        <div className="flex items-center justify-between border-b border-[#272727] pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold">N</div>
                                <div><h3 className="font-bold text-sm">Netbongo</h3></div>
                            </div>
                            <button onClick={handleShare} className="bg-[#272727] hover:bg-[#3f3f3f] px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors">
                                <Share2 size={16} /> Share
                            </button>
                        </div>
                        <div className="w-full mt-6 flex justify-center"><AdBanner type="300x250" /></div>
                    </div>
                </div>
                
                {/* Up Next Column */}
                <div className="lg:w-[30%] xl:w-[27%]">
                    <h3 className="text-lg font-bold mb-4">Up Next</h3>
                    <div className="flex flex-col gap-3">
                        {allVideos.filter(v => v.id !== video.id).slice(0, 10).map(v => (
                            <Link key={v.id} href={`/watch/${v.id}`} className="group flex flex-col gap-2 mb-2">
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#222]">
                                    <img src={v.image} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    {v.duration && <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white font-medium px-1.5 py-0.5 rounded">{v.duration}</span>}
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium line-clamp-2 group-hover:text-red-500">{v.title}</h4>
                                    <div className="text-xs text-gray-400 mt-1">{v.type}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
              }
