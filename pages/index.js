import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Papa from 'papaparse';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

// --- CONFIGURATION ---
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTugOQXwLIGyVofFlvFLKN7E_PNemCkIDcdwB4dGcoP16gOnTcmJ2iSM5lr_YFVPts1Fbc5g5gkvE4S/pub?output=csv";
const PROXY_API = "https://corsproxy.io/?"; 
const DEFAULT_IMG = "https://via.placeholder.com/1200x630/000000/ff9000?text=Premium+Video"; // Default Image

// --- SERVER SIDE RENDERING (This runs on Vercel Server) ---
export async function getServerSideProps({ query, res }) {
    // Cache the result for better performance
    res.setHeader(
        'Cache-Control',
        'public, s-maxage=10, stale-while-revalidate=59'
    );

    const { v, p } = query;
    
    let meta = {
        title: "NetBongo - Premium Video Hub",
        description: "Watch premium viral videos for free.",
        image: DEFAULT_IMG,
        url: "https://netbongo.vercel.app" // Your Vercel URL
    };

    try {
        // Fetch CSV faster
        const response = await fetch(CSV_URL);
        const text = await response.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const data = parsed.data;

        if (v) {
            try {
                // Decode URL safely
                const url = Buffer.from(v, 'base64').toString('ascii');
                const video = data.find(x => x.url === url);
                if (video) {
                    meta.title = video.title; // Clean title
                    meta.description = `Watch ${video.title} now on NetBongo.`;
                    meta.image = video.image || DEFAULT_IMG;
                }
            } catch (e) {}
        } else if (p) {
            try {
                const url = Buffer.from(p, 'base64').toString('ascii');
                const playlist = data.find(x => x.url === url);
                if (playlist) {
                    meta.title = `${playlist.title} (Playlist)`;
                    meta.image = playlist.image || DEFAULT_IMG;
                }
            } catch (e) {}
        }
    } catch (e) {
        console.log("SSR Error:", e);
    }

    return {
        props: { initialMeta: meta }
    };
}

// --- CLIENT SIDE COMPONENT ---
export default function Home({ initialMeta }) {
    const router = useRouter();
    
    // State
    const [view, setView] = useState('home');
    const [data, setData] = useState([]);
    const [activeData, setActiveData] = useState([]);
    const [playlistItems, setPlaylistItems] = useState([]);
    const [currentVideo, setCurrentVideo] = useState(null);
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState('all');
    const [isAdult, setIsAdult] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Scroll Memory
    const scrollPositions = useRef({ home: 0, playlist: 0 });

    const artRef = useRef(null);
    const hlsRef = useRef(null);

    // Initial Load
    useEffect(() => {
        if (localStorage.getItem('nb_ssr_v2')) setIsAdult(true);
        fetchData();
        injectAds();

        // Handle Browser Back Button
        const handlePopState = (event) => {
            const state = event.state;
            if (state && state.view) {
                // Restore View
                setView(state.view);
                // Restore Scroll
                setTimeout(() => {
                    window.scrollTo(0, scrollPositions.current[state.view] || 0);
                }, 10);
            } else {
                setView('home');
                window.scrollTo(0, 0);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Deep Linking Handler
    useEffect(() => {
        if(data.length > 0 && router.isReady) {
            // Only run if we are NOT navigating (first load)
            if (window.history.state === null) {
                const { v, p } = router.query;
                if(v) {
                    const url = safeAtob(v);
                    const item = data.find(x => x.url === url);
                    if(item) loadPlayer(item, false);
                } else if (p) {
                    const url = safeAtob(p);
                    const item = data.find(x => x.url === url);
                    if(item) openPlaylist(item, false);
                } else {
                    // Replace state for home to enable back button logic later
                    window.history.replaceState({view: 'home'}, '', '/');
                }
            }
        }
    }, [router.isReady, data]);

    const safeAtob = (str) => {
        try { return atob(str); } catch (e) { return ""; }
    };

    const injectAds = () => {
        if(document.getElementById('ad-script')) return;
        const s1 = document.createElement('script');
        s1.id = 'ad-script';
        s1.src = "https://momrollback.com/02/f8/86/02f886f4ac6dd52755b96f56e54b4d57.js";
        document.body.appendChild(s1);
    };

    const fetchData = async () => {
        try {
            let txt = "";
            try {
                const r = await fetch(CSV_URL);
                txt = await r.text();
            } catch {
                const r = await fetch(PROXY_API + encodeURIComponent(CSV_URL));
                txt = await r.text();
            }
            const p = Papa.parse(txt, {header:true, skipEmptyLines:true});
            const all = p.data.filter(x => x.url && x.title).sort(()=>Math.random()-0.5);
            setData(all);
            setActiveData(all);
        } catch(e) {}
    };

    const enterSite = () => {
        localStorage.setItem('nb_ssr_v2', 'true');
        setIsAdult(true);
    };

    // --- NAVIGATION LOGIC ---
    const changeTab = (tab) => {
        setActiveTab(tab);
        setPage(1);
        window.scrollTo(0,0);
        
        if(tab === 'all') setActiveData(data);
        else if(tab === 'trending') setActiveData([...data].sort(()=>Math.random()-0.5));
        else if(tab === 'hd') setActiveData(data.filter(x => !isPlaylist(x)));
    };

    const switchView = (newView) => {
        // Save current scroll position before leaving
        scrollPositions.current[view] = window.scrollY;
        setView(newView);
        setTimeout(() => window.scrollTo(0, 0), 0);
    };

    const goBack = () => {
        window.history.back();
    };

    const goHome = () => {
        scrollPositions.current['playlist'] = 0; // Reset playlist scroll
        setView('home');
        window.history.pushState({view: 'home'}, '', '/');
        window.scrollTo(0, scrollPositions.current['home']);
    };

    const isPlaylist = (item) => {
        const u = item.url ? item.url.toLowerCase() : "";
        const t = item.type ? item.type.toLowerCase() : "";
        return (u.endsWith('.m3u') || (t.includes('m3u') && !t.includes('m3u8')));
    };

    // --- PLAYLIST LOGIC ---
    const openPlaylist = async (item, pushHistory=true) => {
        setLoading(true);
        setCurrentVideo(item);
        
        if(pushHistory) {
            const safe = btoa(item.url);
            window.history.pushState({view: 'playlist'}, '', `?p=${safe}`);
        }
        
        switchView('playlist');

        try {
            let txt = "";
            try {
                const r = await fetch(item.url);
                if(!r.ok) throw new Error();
                txt = await r.text();
            } catch {
                const r = await fetch(PROXY_API + encodeURIComponent(item.url));
                txt = await r.text();
            }

            const lines = txt.split('\n');
            const list = [];
            let t = "Episode";
            lines.forEach(l => {
                l = l.trim();
                if(l.startsWith('#EXTINF:')) t = l.split(',')[1] || "Episode";
                else if(l && !l.startsWith('#')) {
                    list.push({title:t, url:l, image:item.image});
                    t = "Episode";
                }
            });
            setPlaylistItems(list);
        } catch(e) {
            setPlaylistItems([]);
        }
        setLoading(false);
    };

    // --- PLAYER LOGIC ---
    const loadPlayer = (item, pushHistory=true) => {
        setCurrentVideo(item);
        
        if(pushHistory) {
            const safe = btoa(item.url);
            window.history.pushState({view: 'player'}, '', `?v=${safe}`);
        }

        switchView('player');
        setTimeout(() => initArt(item), 100);
    };

    const initArt = (item) => {
        if(artRef.current) artRef.current.destroy();

        const art = new Artplayer({
            container: '#artplayer',
            url: item.url,
            poster: item.image || '',
            autoplay: true,
            theme: '#ff9000',
            fullscreen: true,
            miniProgressBar: true,
            setting: true,
            customType: {
                m3u8: function(video, url, art) {
                    if(Hls.isSupported()) {
                        if(hlsRef.current) hlsRef.current.destroy();
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        hlsRef.current = hls;
                        hls.on(Hls.Events.MANIFEST_PARSED, (ev, d) => {
                            const lvls = d.levels.map((l,i)=>({
                                html: (l.height||'Auto')+'P', index:i
                            }));
                            if(lvls.length>1) {
                                art.controls.add({
                                    name:'quality', index:10, position:'right', html:'Auto',
                                    selector: [{html:'Auto', index:-1}, ...lvls],
                                    onSelect: (x) => { hls.currentLevel = x.index; return x.html; }
                                });
                            }
                        });
                    } else if(video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    }
                }
            }
        });
        
        art.on('error', () => {
             // Fallback proxy logic if needed
        });

        artRef.current = art;
    };

    const shareLink = () => {
        if(navigator.share) {
            navigator.share({title: currentVideo?.title, url: window.location.href});
        } else {
            const el = document.createElement('textarea');
            el.value = window.location.href;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            alert("Link Copied!");
        }
    };

    // --- UI RENDER ---
    if(!isAdult) return (
        <div className="modal">
            <div className="box">
                <h1 className="warn-title">WARNING 18+</h1>
                <p>This site contains adult material.</p>
                <div className="notice">
                    ভিডিও লোড না হলে ভিপিএন (VPN) ব্যাবহার করুন।<br/>(Use VPN if video doesn't load)
                </div>
                <button onClick={enterSite} className="btn-enter">I AM 18+ - ENTER</button>
            </div>
            <style jsx>{`
                .modal { position:fixed; top:0; left:0; width:100%; height:100%; background:black; display:flex; align-items:center; justify-content:center; text-align:center; color:white; z-index:9999; }
                .box { border: 2px solid #ff9000; padding:25px; border-radius:10px; background:#111; max-width:320px; width:90%; }
                .warn-title { color: #ff9000; margin:0 0 15px 0; }
                .btn-enter { background:#ff9000; border:none; padding:12px 30px; font-weight:bold; margin-top:20px; cursor:pointer; width:100%; border-radius:4px; }
                .notice { border:1px dashed #ff4444; color:#ff4444; margin-top:15px; padding:10px; font-size:13px; border-radius:4px; }
            `}</style>
        </div>
    );

    return (
        <div className="app">
            <Head>
                <title>{initialMeta.title}</title>
                <meta property="og:title" content={initialMeta.title} />
                <meta property="og:description" content={initialMeta.description} />
                <meta property="og:image" content={initialMeta.image} />
                <meta property="og:url" content={initialMeta.url} />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            {/* Header */}
            <header className="header">
                <div className="logo" onClick={goHome}>Net<span>Bongo</span></div>
                <div>🔍</div>
            </header>

            {/* Ads */}
            <div className="ad-box">
                <div id="container-b88712e5e1e497d39ecedaffd47492bc"></div>
            </div>

            {/* --- HOME VIEW --- */}
            <div style={{display: view === 'home' ? 'block' : 'none'}}>
                <div className="sticky-nav">
                    {['all', 'trending', 'hd'].map(t => (
                        <div key={t} className={`tab ${activeTab===t ? 'active' : ''}`} onClick={()=>changeTab(t)}>
                            {t.toUpperCase()}
                        </div>
                    ))}
                </div>

                <div className="container">
                    <div className="grid">
                        {activeData.slice(0, page * 20).map((item, idx) => {
                            const isPL = isPlaylist(item);
                            const safeUrl = typeof window !== 'undefined' ? btoa(item.url) : '';
                            const link = isPL ? `?p=${safeUrl}` : `?v=${safeUrl}`;
                            
                            return (
                                <a key={idx} href={link} className="card" onClick={(e)=>{ e.preventDefault(); isPL ? openPlaylist(item) : loadPlayer(item); }}>
                                    <div className="thumb-box">
                                        <img src={item.image || 'https://via.placeholder.com/320x180/111/444'} className="thumb" loading="lazy" />
                                        {isPL ? 
                                            <div className="badge-pl">📂 PLAYLIST</div> : 
                                            <span className="duration">HD</span>
                                        }
                                    </div>
                                    <div className="info">
                                        <h3 className="title">{item.title}</h3>
                                        <div className="meta">
                                            <span>98% Likes</span>
                                            <span>10K Views</span>
                                        </div>
                                    </div>
                                </a>
                            )
                        })}
                    </div>
                    <button className="load-more" onClick={()=>setPage(page+1)}>SHOW MORE</button>
                </div>
            </div>

            {/* --- PLAYLIST VIEW --- */}
            <div style={{display: view === 'playlist' ? 'block' : 'none'}}>
                <div className="container">
                    <div className="nav-back" onClick={goBack}>⬅ Back</div>
                    <div className="pl-header">
                        <h2 className="text-primary">{currentVideo?.title}</h2>
                        <span className="text-gray">{playlistItems.length} Videos</span>
                    </div>

                    {loading ? <div className="loader">Loading...</div> : 
                    <div className="grid">
                        {playlistItems.map((item, idx) => (
                            <a key={idx} href={`?v=${btoa(item.url)}`} className="card" onClick={(e)=>{e.preventDefault(); loadPlayer(item);}}>
                                <div className="thumb-box">
                                    <img src={item.image || currentVideo?.image || 'https://via.placeholder.com/320x180/333/orange'} className="thumb" />
                                    <span className="duration">EP {idx+1}</span>
                                </div>
                                <div className="info"><h3 className="title">{item.title}</h3></div>
                            </a>
                        ))}
                    </div>
                    }
                </div>
            </div>

            {/* --- PLAYER VIEW --- */}
            <div style={{display: view === 'player' ? 'block' : 'none'}}>
                <div className="container">
                    <div className="nav-back" onClick={goBack}>⬅ Back</div>
                    
                    <div className="player-box">
                        <div id="artplayer" className="art-container"></div>
                    </div>

                    <div className="info-box">
                        <h1 className="vid-title">{currentVideo?.title}</h1>
                        <div className="actions">
                            <button className="btn" onClick={shareLink}>🔗 Share</button>
                            <a href="https://momrollback.com/jnt0mwiv7?key=c244b66638c840b3570508593d8b468e" target="_blank" className="btn btn-dl">⬇ Download</a>
                        </div>
                    </div>

                    {/* Ad */}
                    <div className="ad-banner">
                         <script type="text/javascript" dangerouslySetInnerHTML={{__html: `atOptions = { 'key' : 'efc3a9ebdeba69b64a361554582f3008', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };`}}></script>
                         <script type="text/javascript" src="https://momrollback.com/efc3a9ebdeba69b64a361554582f3008/invoke.js"></script>
                    </div>

                    <div className="related">Recommended</div>
                    <div className="grid">
                        {data.slice(0, 8).map((item, idx) => (
                             <a key={idx} href={`?v=${btoa(item.url)}`} className="card" onClick={(e)=>{e.preventDefault(); loadPlayer(item);}}>
                                <div className="thumb-box">
                                    <img src={item.image || 'https://via.placeholder.com/320x180/111/444'} className="thumb" />
                                    <span className="duration">HD</span>
                                </div>
                                <div className="info"><h3 className="title">{item.title}</h3></div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                body { margin:0; background:black; color:white; font-family:Arial, sans-serif; padding-bottom:60px; }
                a { text-decoration:none; color:inherit; }
                
                .header { background:black; padding:12px 15px; display:flex; justify-content:space-between; border-bottom:1px solid #333; position:sticky; top:0; z-index:100; }
                .logo { font-size:24px; font-weight:900; cursor:pointer; }
                .logo span { background:#ff9000; color:black; padding:0 5px; margin-left:2px; border-radius:3px; }
                
                .sticky-nav { background:black; padding:10px 15px; position:sticky; top:52px; z-index:90; display:flex; gap:10px; overflow-x:auto; border-bottom:1px solid #333; }
                .tab { background:#222; padding:8px 16px; border-radius:20px; font-size:13px; font-weight:bold; white-space:nowrap; border:1px solid #333; cursor:pointer; }
                .tab.active { background:white; color:black; }

                .container { padding:10px; max-width:1400px; margin:0 auto; }
                .grid { display:grid; grid-template-columns:1fr; gap:20px; }
                @media(min-width:600px) { .grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); } }

                .card { background:black; border-radius:6px; overflow:hidden; display:block; cursor:pointer; }
                .thumb-box { position:relative; width:100%; padding-top:56.25%; background:#111; }
                .thumb { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; }
                
                .badge-pl { position:absolute; bottom:0; right:0; background:#ff9000; color:black; padding:4px 10px; font-size:11px; font-weight:800; display:flex; align-items:center; gap:5px; border-top-left-radius:6px; }
                .duration { position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.8); padding:2px 5px; font-size:11px; border-radius:2px; font-weight:bold; }
                
                .info { padding:12px 5px; }
                .title { font-size:15px; margin:0; line-height:1.4; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
                .meta { font-size:12px; color:#999; margin-top:5px; display:flex; justify-content:space-between; }

                .ad-box { min-height:80px; background:#111; margin:10px 0; display:flex; justify-content:center; }
                .ad-banner { margin:20px auto; text-align:center; display:flex; justify-content:center; }
                
                .load-more { width:100%; padding:15px; background:#222; color:#ff9000; border:1px solid #333; margin-top:20px; font-weight:bold; cursor:pointer; }
                
                .player-box { width:100%; aspect-ratio:16/9; background:black; position:relative; z-index:10; }
                .art-container { width:100%; height:100%; }
                
                .actions { display:flex; gap:10px; margin-top:15px; }
                .btn { flex:1; background:#333; color:white; border:none; padding:12px; border-radius:4px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; }
                .btn-dl { color:#28a745; }
                
                .nav-back { display:flex; align-items:center; gap:5px; color:#aaa; margin-bottom:10px; cursor:pointer; font-weight:bold; }
                .text-primary { color:#ff9000; margin:0; }
                .text-gray { color:#888; font-size:12px; }
                .related { margin:20px 0; border-left:4px solid #ff9000; padding-left:10px; font-size:18px; font-weight:bold; }
                .loader { text-align:center; padding:20px; color:#ff9000; }
                .vid-title { font-size:18px; margin:15px 0 5px 0; }
            `}</style>
        </div>
    );
}


