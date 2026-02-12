import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PlayCircle, Menu, Home, Search, Share2, ListVideo } from 'lucide-react';

// === CONFIGURATION ===
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTugOQXwLIGyVofFlvFLKN7E_PNemCkIDcdwB4dGcoP16gOnTcmJ2iSM5lr_YFVPts1Fbc5g5gkvE4S/pub?output=csv";
const PROXY_URL = "https://netbongo.aiorbd.workers.dev/?url=";
const SMARTLINK = "https://momrollback.com/jnt0mwiv7?key=c244b66638c840b3570508593d8b468e";

// --- SEO META UPDATER ---
const updateSEO = (title, image, url) => {
    document.title = title ? `${title} - Netbongo` : 'Netbongo - Stream Free';
    
    const setMeta = (property, content) => {
        let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(property.includes('og:') ? 'property' : 'name', property);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    };

    setMeta('og:title', title || 'Netbongo');
    setMeta('og:image', image || 'https://placehold.co/1200x630/1e1e1e/FFF?text=Netbongo');
    setMeta('og:url', url || window.location.href);
    setMeta('og:type', 'video.movie');
    setMeta('twitter:card', 'summary_large_image');
};

// --- ADSTERRA COMPONENTS ---
const GlobalAds = () => {
    useEffect(() => {
        if (!document.getElementById('ad-popunder')) {
            const popunder = document.createElement('script');
            popunder.id = 'ad-popunder';
            popunder.src = "https://momrollback.com/02/f8/86/02f886f4ac6dd52755b96f56e54b4d57.js";
            popunder.async = true;
            document.body.appendChild(popunder);
        }
        if (!document.getElementById('ad-socialbar')) {
            const socialbar = document.createElement('script');
            socialbar.id = 'ad-socialbar';
            socialbar.src = "https://momrollback.com/dc/95/4d/dc954dbecf4b21d37cedb37de585cf99.js";
            socialbar.async = true;
            document.body.appendChild(socialbar);
        }
    }, []);
    return null;
};

const AdBanner = ({ type }) => {
    const adCode = type === 'native' 
        ? `<script async="async" data-cfasync="false" src="https://momrollback.com/b88712e5e1e497d39ecedaffd47492bc/invoke.js"></script><div id="container-b88712e5e1e497d39ecedaffd47492bc"></div>`
        : `<script>atOptions = { 'key' : 'efc3a9ebdeba69b64a361554582f3008', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };</script><script src="https://momrollback.com/efc3a9ebdeba69b64a361554582f3008/invoke.js"></script>`;

    const htmlContent = `
        <html><head><style>body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;align-items:center;}</style></head>
        <body>${adCode}</body></html>
    `;

    return (
        <div className="relative flex justify-center w-full overflow-hidden bg-[#1e1e1e] rounded-lg border border-[#303030]">
            <span className="absolute top-0 left-0 bg-[#fbc02d] text-black text-[9px] font-bold px-1 rounded z-10">SPONSORED</span>
            <iframe 
                srcDoc={htmlContent} 
                style={{ width: type === 'native' ? '100%' : '300px', height: type === 'native' ? '100px' : '250px', border: 'none' }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                scrolling="no"
                title={`ad-${type}`}
            />
        </div>
    );
};

// --- ARTPLAYER REACT COMPONENT ---
const ArtPlayerComponent = ({ video, onBack }) => {
    const artRef = useRef(null);

    useEffect(() => {
        if (!window.Artplayer) return;

        const art = new window.Artplayer({
            container: artRef.current,
            url: video.url,
            poster: video.image,
            title: video.title,
            volume: 1.0,
            isLive: false, // Force seekbar
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
                        hls.on(window.Hls.Events.MANIFEST_PARSED, (e, d) => {
                            if(d.levels.length > 1) {
                                const levels = d.levels.map((l, i) => ({ html: l.height+'p', level: i }));
                                levels.unshift({ html: 'Auto', level: -1 });
                                artObj.controls.add({ 
                                    name: 'quality', position: 'right', html: 'Quality',
                                    selector: levels, onSelect: (i) => { hls.currentLevel = i.level; return i.html; }
                                });
                            }
                        });
                    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) { vid.src = url; }
                }
            }
        });

        art.layers.add({
            name: 'back',
            html: '<div style="background:rgba(0,0,0,0.6);padding:8px;border-radius:50%;cursor:pointer;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></div>',
            style: { position: 'absolute', top: '15px', left: '15px', zIndex: 99 },
            click: onBack,
        });

        return () => { if (art && art.destroy) art.destroy(false); };
    }, [video, onBack]);

    return <div ref={artRef} className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl z-10 relative"></div>;
};

// ============================================================================
// MAIN APPLICATION
// ============================================================================

export default function App() {
    const [videos, setVideos] = useState([]);
    const [playlists, setPlaylists] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [currentView, setCurrentView] = useState('home'); 
    const [activeVideo, setActiveVideo] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [displayCount, setDisplayCount] = useState(12);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- AUTO TAILWIND INJECTOR & SCRIPTS ---
    useEffect(() => {
        // Fix for Next.js missing Tailwind setup
        if (!document.getElementById('tailwind-cdn')) {
            const script = document.createElement('script');
            script.id = 'tailwind-cdn';
            script.src = 'https://cdn.tailwindcss.com';
            document.head.appendChild(script);
        }

        const loadScriptsAndData = async () => {
            if (!window.Artplayer) {
                await Promise.all([
                    new Promise(res => { const s = document.createElement('script'); s.src = "https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js"; s.onload = res; document.head.appendChild(s); }),
                    new Promise(res => { const s = document.createElement('script'); s.src = "https://cdn.jsdelivr.net/npm/hls.js@latest"; s.onload = res; document.head.appendChild(s); })
                ]);
            }

            try {
                const finalUrl = PROXY_URL + encodeURIComponent(SHEET_URL);
                const res = await fetch(finalUrl);
                if (!res.ok) throw new Error("Fetch failed");
                const csvText = await res.text();
                parseCSV(csvText);
            } catch (err) {
                console.error("Data load error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        loadScriptsAndData();
        updateSEO(); 
    }, []);

    // --- RELIABLE CSV PARSER FOR ORIGINAL TITLE ---
    const parseCSV = async (text) => {
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        let allVids = [];
        let pLists = {};

        for (let i = 1; i < lines.length; i++) {
            // Regex handles commas inside quotes safely
            const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (row && row.length >= 2) {
                const clean = str => str ? str.replace(/^"|"$/g, '').trim() : '';
                
                // ORIGINAL TITLE FROM SHEET
                const title = clean(row[0]) || 'Untitled Video'; 
                const url = clean(row[1]);
                
                if (url) {
                    const type = clean(row[2]) || 'Video';
                    const image = clean(row[3]) || `https://placehold.co/600x400/1e1e1e/FFF?text=${encodeURIComponent(title.substring(0, 2))}`;
                    const duration = clean(row[4]) || null; // LIVE removed completely
                    const uploadDate = clean(row[5]) || null;

                    const isM3U = url.endsWith('.m3u') || url.endsWith('.m3u_plus') || type.toLowerCase().includes('m3u');
                    const isM3U8 = url.includes('.m3u8') || type.toLowerCase().includes('m3u8');
                    
                    const item = { 
                        id: Math.random().toString(36).substr(2, 9),
                        title: title, 
                        url: url, 
                        type: type, 
                        image: image,
                        duration: duration, 
                        uploadDate: uploadDate
                    };
                    
                    if (isM3U && !isM3U8) {
                        try {
                            const res = await fetch(url);
                            const content = await res.text();
                            pLists[title] = parseM3UContent(content, title);
                        } catch (e) {
                            console.warn("M3U fetch failed for", title);
                        }
                    } else {
                        allVids.push(item);
                    }
                }
            }
        }
        allVids.sort(() => 0.5 - Math.random());
        setVideos(allVids);
        setPlaylists(pLists);
    };

    const parseM3UContent = (content, category) => {
        const lines = content.split('\n');
        const items = [];
        let current = { type: category, image: '', duration: null };
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('#EXTINF:')) {
                const logo = line.match(/tvg-logo="([^"]*)"/);
                if (logo) current.image = logo[1];
                const parts = line.split(',');
                // Robust title extraction
                current.title = parts.slice(1).join(',').trim() || 'Untitled Channel';
            } else if (line && !line.startsWith('#')) {
                current.url = line;
                if (!current.image) current.image = `https://placehold.co/600x400/1e1e1e/FFF?text=${encodeURIComponent(current.title?.substring(0, 2) || 'TV')}`;
                current.id = Math.random().toString(36).substr(2, 9);
                if (current.title && current.url) items.push({ ...current });
                current = { type: category, image: '', duration: null };
            }
        });
        return items;
    };

    // --- RENDER LOGIC ---
    const displayedData = useMemo(() => {
        let source = activeCategory === 'All' ? videos : (playlists[activeCategory] || []);
        if (searchQuery) {
            source = source.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return source;
    }, [videos, playlists, activeCategory, searchQuery]);

    const handleNavigate = (view, video = null) => {
        if (video) {
            setActiveVideo(video);
            updateSEO(video.title, video.image, video.url);
        } else {
            updateSEO();
        }
        setCurrentView(view);
        window.scrollTo(0, 0);
    };

    const handleLoadMore = () => {
        window.open(SMARTLINK, '_blank'); 
        setDisplayCount(prev => prev + 12);
    };

    return (
        <div className="bg-[#0f0f0f] text-white min-h-screen font-sans selection:bg-red-600 selection:text-white">
            <GlobalAds />

            {/* HEADER */}
            <header className="h-14 bg-[#0f0f0f] flex items-center justify-between px-4 fixed w-full z-50 border-b border-[#272727]">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[#272727] rounded-full transition md:hidden"><Menu size={24}/></button>
                    <div onClick={() => handleNavigate('home')} className="flex items-center gap-1 cursor-pointer">
                        <div className="bg-red-600 text-white p-1 rounded-lg"><PlayCircle size={20} /></div>
                        <span className="text-xl font-bold tracking-tighter hidden sm:block">Netbongo</span>
                    </div>
                </div>
                <div className="flex-1 max-w-xl mx-4">
                    <div className="flex w-full bg-[#121212] border border-[#303030] rounded-full overflow-hidden focus-within:border-gray-500 transition-colors">
                        <input 
                            type="text" 
                            placeholder="Search original videos..." 
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); handleNavigate('home'); }}
                            className="w-full bg-transparent px-4 py-2 focus:outline-none text-white"
                        />
                        <button className="bg-[#222] px-5 border-l border-[#303030] hover:bg-[#303030]"><Search size={18} className="text-gray-400"/></button>
                    </div>
                </div>
            </header>

            <div className="flex pt-14 h-full">
                {/* SIDEBAR */}
                <aside className={`w-60 bg-[#0f0f0f] flex-col h-[calc(100vh-56px)] overflow-y-auto fixed z-40 border-r border-[#272727] transform transition-transform duration-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex`}>
                    <div className="p-3 space-y-1">
                        <button onClick={() => { handleNavigate('home'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-4 px-3 py-2 hover:bg-[#272727] rounded-lg transition text-left">
                            <Home size={20} /> <span className="text-sm font-medium">Home</span>
                        </button>
                        <div className="h-[1px] bg-[#272727] my-2"></div>
                        <h3 className="px-3 text-sm font-bold text-gray-400 mb-2 uppercase">Playlists</h3>
                        {Object.keys(playlists).map(name => (
                            <button key={name} onClick={() => { setActiveCategory(name); handleNavigate('home'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-[#272727] hover:text-white rounded-lg truncate text-left transition">
                                <ListVideo size={18} /> <span className="truncate">{name}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-auto p-4 flex justify-center"><AdBanner type="300x250" /></div>
                </aside>
                
                {/* Mobile Overlay */}
                {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 md:ml-60 w-full min-h-screen">
                    
                    {/* HOME PAGE */}
                    {currentView === 'home' && (
                        <div className="animate-fade-in">
                            <div className="sticky top-14 bg-[#0f0f0f]/95 backdrop-blur-md z-30 px-4 py-3 flex gap-3 overflow-x-auto border-b border-[#272727]">
                                <button onClick={() => setActiveCategory('All')} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeCategory === 'All' ? 'bg-[#f1f1f1] text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>All</button>
                                {Object.keys(playlists).map(name => (
                                    <button key={name} onClick={() => setActiveCategory(name)} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeCategory === name ? 'bg-[#f1f1f1] text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>{name}</button>
                                ))}
                            </div>

                            <div className="p-4 md:p-6 pb-24 max-w-[2000px] mx-auto">
                                <div className="mb-6"><AdBanner type="native" /></div>

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20"><div className="w-10 h-10 border-4 border-t-red-600 border-gray-700 rounded-full animate-spin"></div><p className="mt-4 text-gray-400">Loading original data...</p></div>
                                ) : error ? (
                                    <div className="text-center text-red-500 py-20">Failed to load content.</div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-8">
                                            {displayedData.slice(0, displayCount).map((video, idx) => (
                                                <React.Fragment key={video.id}>
                                                    <div onClick={() => handleNavigate('watch', video)} className="group cursor-pointer flex flex-col gap-2">
                                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#222]">
                                                            <img src={video.image} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                            {/* Original Duration (LIVE removed) */}
                                                            {video.duration && (
                                                                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                                                                    {video.duration}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-3 mt-1 pr-2">
                                                            <div className="w-9 h-9 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold shrink-0 text-gray-300 border border-[#444]">{video.title.substring(0,1).toUpperCase()}</div>
                                                            <div>
                                                                {/* ORIGINAL TITLE */}
                                                                <h3 className="text-white text-base font-medium line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">{video.title}</h3>
                                                                {/* Original Meta */}
                                                                <div className="text-sm text-gray-400 mt-1">{video.type} {video.uploadDate && `• ${video.uploadDate}`}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* In-Grid Ad every 8 videos */}
                                                    {(idx + 1) % 8 === 0 && (
                                                        <div className="col-span-full py-4 border-t border-b border-[#272727] my-4 flex justify-center"><AdBanner type="300x250" /></div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        {displayCount < displayedData.length && (
                                            <div className="flex justify-center mt-10">
                                                <button onClick={handleLoadMore} className="bg-[#272727] hover:bg-[#3f3f3f] text-white font-medium py-2 px-8 rounded-full transition shadow-lg border border-[#303030]">Load more</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* WATCH PAGE */}
                    {currentView === 'watch' && activeVideo && (
                        <div className="p-4 md:p-6 max-w-[1800px] mx-auto animate-fade-in">
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Player Area */}
                                <div className="lg:w-[70%] xl:w-[73%]">
                                    <ArtPlayerComponent video={activeVideo} onBack={() => handleNavigate('home')} />
                                    
                                    <div className="mt-4 px-1">
                                        <h1 className="text-lg md:text-xl font-bold mb-2">{activeVideo.title}</h1>
                                        <div className="flex items-center justify-between border-b border-[#272727] pb-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold">N</div>
                                                <div><h3 className="font-bold text-sm">Netbongo</h3></div>
                                            </div>
                                            <button className="bg-[#272727] hover:bg-[#3f3f3f] px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"><Share2 size={16} /> Share</button>
                                        </div>
                                        
                                        <div className="w-full mt-6 flex justify-center"><AdBanner type="300x250" /></div>
                                    </div>
                                </div>
                                
                                {/* Up Next */}
                                <div className="lg:w-[30%] xl:w-[27%]">
                                    <h3 className="text-lg font-bold mb-4">Up Next</h3>
                                    <div className="flex flex-col gap-3">
                                        {videos.filter(v => v.id !== activeVideo.id).slice(0, 10).map(v => (
                                            <div key={v.id} onClick={() => handleNavigate('watch', v)} className="cursor-pointer group flex flex-col gap-2 mb-2">
                                                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#222]">
                                                    <img src={v.image} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                    {v.duration && (
                                                        <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white font-medium px-1.5 py-0.5 rounded">{v.duration}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">{v.title}</h4>
                                                    <div className="text-xs text-gray-400 mt-1">{v.type}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}


