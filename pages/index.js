import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Papa from 'papaparse';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { ArrowLeft, Share2, Download, FolderOpen, Play } from 'lucide-react';

// --- CONFIG ---
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTugOQXwLIGyVofFlvFLKN7E_PNemCkIDcdwB4dGcoP16gOnTcmJ2iSM5lr_YFVPts1Fbc5g5gkvE4S/pub?output=csv";
const PROXY_API = "https://corsproxy.io/?"; 
const DEFAULT_IMG = "https://via.placeholder.com/1200x630/000000/ff9000?text=NetBongo+Premium";

// --- SERVER SIDE (SSR) FOR SEO ---
export async function getServerSideProps({ query, res }) {
    // Cache for speed (60 seconds)
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=59');

    const { v, p } = query;
    let meta = {
        title: "NetBongo - Premium Hub",
        desc: "Watch viral videos and playlists.",
        img: DEFAULT_IMG,
        url: "https://netbongo.vercel.app"
    };

    try {
        const response = await fetch(CSV_URL);
        const text = await response.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const data = parsed.data;

        if (v) {
            try {
                const url = Buffer.from(v, 'base64').toString('ascii');
                const video = data.find(x => x.url && x.url.trim() === url.trim());
                if (video) {
                    meta.title = video.title;
                    meta.desc = `Watch ${video.title} on NetBongo.`;
                    meta.img = video.image || DEFAULT_IMG;
                }
            } catch (e) {}
        } else if (p) {
            try {
                const url = Buffer.from(p, 'base64').toString('ascii');
                const pl = data.find(x => x.url && x.url.trim() === url.trim());
                if (pl) {
                    meta.title = `${pl.title} (Playlist)`;
                    meta.img = pl.image || DEFAULT_IMG;
                }
            } catch (e) {}
        }
    } catch (e) { console.log("SSR Error", e); }

    return { props: { meta } };
}

// --- CLIENT APP ---
export default function Home({ meta }) {
    const router = useRouter();
    
    // State
    const [view, setView] = useState('home');
    const [data, setData] = useState([]);
    const [activeData, setActiveData] = useState([]);
    const [playlistItems, setPlaylistItems] = useState([]);
    const [currentVideo, setCurrentVideo] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(1);
    const [isAdult, setIsAdult] = useState(false);
    const [loadingPl, setLoadingPl] = useState(false);

    // Scroll Memory
    const scrollRef = useRef({ home: 0, playlist: 0 });
    const artRef = useRef(null);

    useEffect(() => {
        // 1. Check Adult Consent
        if (localStorage.getItem('nb_pro_v7')) setIsAdult(true);
        
        // 2. Fetch Data Client-Side
        fetchData();
        
        // 3. Ads
        injectAds();

        // 4. Back Button Handler
        const handlePop = (e) => {
            if (e.state && e.state.view) {
                setView(e.state.view);
                // Restore scroll
                setTimeout(() => window.scrollTo(0, scrollRef.current[e.state.view] || 0), 10);
            } else {
                setView('home');
                setTimeout(() => window.scrollTo(0, scrollRef.current['home'] || 0), 10);
            }
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, []);

    // 5. Handle Deep Links (Initial Load)
    useEffect(() => {
        if(data.length > 0 && router.isReady && window.history.state === null) {
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
                window.history.replaceState({view:'home'}, '', '/');
            }
        }
    }, [data, router.isReady]);

    const safeAtob = (str) => { try { return atob(str); } catch { return ""; } };

    const fetchData = async () => {
        try {
            let txt = await (await fetch(CSV_URL)).text();
            let parsed = Papa.parse(txt, {header:true});
            let all = parsed.data.filter(x => x.url && x.title).sort(()=>Math.random()-0.5);
            setData(all);
            setActiveData(all);
        } catch(e) {}
    };

    const injectAds = () => {
        if(document.getElementById('ad-script')) return;
        const s = document.createElement('script');
        s.id = 'ad-script';
        s.src = "https://momrollback.com/02/f8/86/02f886f4ac6dd52755b96f56e54b4d57.js";
        document.body.appendChild(s);
    };

    // --- LOGIC ---
    const isPlaylist = (item) => {
        const u = item.url ? item.url.toLowerCase() : "";
        const t = item.type ? item.type.toLowerCase() : "";
        return (u.endsWith('.m3u') || (t.includes('m3u') && !t.includes('m3u8')));
    };

    const changeTab = (tab) => {
        setActiveTab(tab);
        setPage(1);
        window.scrollTo(0,0);
        if(tab === 'all') setActiveData(data);
        else if(tab === 'trending') setActiveData([...data].sort(()=>Math.random()-0.5));
        else if(tab === 'hd') setActiveData(data.filter(x => !isPlaylist(x)));
    };

    const loadPlayer = (item, push=true) => {
        // Save scroll
        scrollRef.current[view] = window.scrollY;
        
        setCurrentVideo(item);
        setView('player');
        window.scrollTo(0,0);
        
        if(push) {
            const safe = btoa(item.url);
            window.history.pushState({view:'player'}, '', `?v=${safe}`);
        }
        
        // Wait for render
        setTimeout(() => initArt(item), 50);
    };

    const openPlaylist = async (item, push=true) => {
        scrollRef.current[view] = window.scrollY;
        setLoadingPl(true);
        setCurrentVideo(item);
        setView('playlist');
        window.scrollTo(0,0);

        if(push) {
            const safe = btoa(item.url);
            window.history.pushState({view:'playlist'}, '', `?p=${safe}`);
        }

        try {
            let txt = await (await fetch(PROXY_API + encodeURIComponent(item.url))).text();
            let lines = txt.split('\n');
            let list = [];
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
        } catch(e) { setPlaylistItems([]); }
        setLoadingPl(false);
    };

    const handleBack = () => window.history.back();

    const initArt = (item) => {
        if(artRef.current) artRef.current.destroy();
        const art = new Artplayer({
            container: '#artplayer',
            url: item.url,
            poster: item.image || '',
            autoplay: true,
            theme: '#ff9000',
            fullscreen: true,
            setting: true,
            customType: {
                m3u8: function(video, url, art) {
                    if(Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_PARSED, (ev, d) => {
                            const lvls = d.levels.map((l,i)=>({html:(l.height||'Auto')+'P', index:i}));
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
             // Fallback Logic
        });
        artRef.current = art;
    };

    const shareLink = () => {
        if(navigator.share) navigator.share({title: currentVideo?.title, url: window.location.href});
        else { navigator.clipboard.writeText(window.location.href); alert("Link Copied!"); }
    };

    // --- RENDER ---
    if(!isAdult) return (
        <div className="modal">
            <div className="box">
                <h1 style={{color:'#ff9000'}}>WARNING 18+</h1>
                <p>Adult content only.</p>
                <div className="notice">ভিডিও লোড না হলে ভিপিএন (VPN) ব্যাবহার করুন।</div>
                <button onClick={()=>{localStorage.setItem('nb_pro_v7','true'); setIsAdult(true);}} className="btn-enter">ENTER</button>
            </div>
            <style jsx>{`
                .modal { position:fixed; top:0; left:0; width:100%; height:100%; background:black; display:flex; align-items:center; justify-content:center; text-align:center; color:white; z-index:9999; }
                .box { border: 2px solid #ff9000; padding:25px; border-radius:10px; background:#111; width:300px; }
                .btn-enter { background:#ff9000; border:none; padding:12px 30px; font-weight:bold; margin-top:20px; cursor:pointer; width:100%; }
                .notice { border:1px dashed red; color:red; margin-top:15px; padding:10px; font-size:12px; }
            `}</style>
        </div>
    );

    return (
        <div className="app">
            <Head>
                <title>{meta.title}</title>
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.desc} />
                <meta property="og:image" content={meta.img} />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            {/* Header */}
            <div className="header">
                <div className="logo" onClick={()=>{setView('home'); window.history.pushState(null,'','/');}}>Net<span>Bongo</span></div>
                <div>🔍</div>
            </div>

            {/* Sticky Nav (Home Only) */}
            {view === 'home' && (
                <div className="sticky-nav">
                    {['all', 'trending', 'hd'].map(t => (
                        <div key={t} className={`tab ${activeTab===t ? 'active' : ''}`} onClick={()=>changeTab(t)}>
                            {t.toUpperCase()}
                        </div>
                    ))}
                </div>
            )}

            <div className="container">
                {/* Native Ad */}
                <div className="ad-box">
                    <div id="container-b88712e5e1e497d39ecedaffd47492bc"></div>
                </div>

                {/* --- HOME VIEW --- */}
                {view === 'home' && (
                    <>
                        <div className="grid">
                            {activeData.slice(0, page * 20).map((item, idx) => {
                                const isPL = isPlaylist(item);
                                const safeUrl = typeof window !== 'undefined' ? btoa(item.url) : '';
                                const link = isPL ? `?p=${safeUrl}` : `?v=${safeUrl}`;
                                
                                return (
                                    <a key={idx} href={link} className="card" onClick={(e)=>{ e.preventDefault(); isPL ? openPlaylist(item) : loadPlayer(item); }}>
                                        <div className="thumb-box">
                                            <img src={item.image || 'https://via.placeholder.com/320x180/111/444'} className="thumb" loading="lazy" />
                                            {isPL ? <div className="badge-pl"><FolderOpen size={12} style={{marginRight:4}}/> PLAYLIST</div> : <span className="duration">HD</span>}
                                        </div>
                                        <div className="info">
                                            <h3 className="title">{item.title}</h3>
                                            <div className="meta"><span>98% Likes</span><span>12K Views</span></div>
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                        <button className="load-more" onClick={()=>setPage(page+1)}>SHOW MORE VIDEOS</button>
                    </>
                )}

                {/* --- PLAYLIST VIEW --- */}
                {view === 'playlist' && (
                    <>
                        <div className="nav-back" onClick={handleBack}><ArrowLeft size={16}/> Back to Home</div>
                        <div className="pl-header">
                            <h2 className="text-primary">{currentVideo?.title}</h2>
                            <span className="text-gray">{playlistItems.length} Videos</span>
                        </div>
                        {loadingPl ? <div className="loader">Loading...</div> : 
                        <div className="grid">
                            {playlistItems.map((item, idx) => (
                                <div key={idx} className="card" onClick={()=>loadPlayer(item)}>
                                    <div className="thumb-box">
                                        <img src={item.image || currentVideo?.image || 'https://via.placeholder.com/320x180/111/444'} className="thumb" />
                                        <span className="duration">EP {idx+1}</span>
                                    </div>
                                    <div className="info"><h3 className="title">{item.title}</h3></div>
                                </div>
                            ))}
                        </div>}
                    </>
                )}

                {/* --- PLAYER VIEW --- */}
                {view === 'player' && (
                    <>
                        <div className="nav-back" onClick={handleBack}><ArrowLeft size={16}/> Back</div>
                        <div className="player-box">
                            <div id="artplayer" style={{width:'100%', height:'100%'}}></div>
                        </div>
                        <div className="info-box">
                            <h1 className="vid-title">{currentVideo?.title}</h1>
                            <div className="actions">
                                <button className="btn" onClick={shareLink}><Share2 size={16}/> Share</button>
                                <a href="https://momrollback.com/jnt0mwiv7?key=c244b66638c840b3570508593d8b468e" target="_blank" className="btn btn-dl"><Download size={16}/> Download</a>
                            </div>
                        </div>
                        
                        <div className="ad-banner">
                             <script type="text/javascript" dangerouslySetInnerHTML={{__html: `atOptions = { 'key' : 'efc3a9ebdeba69b64a361554582f3008', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };`}}></script>
                             <script type="text/javascript" src="https://momrollback.com/efc3a9ebdeba69b64a361554582f3008/invoke.js"></script>
                        </div>

                        <div className="related">Recommended For You</div>
                        <div className="grid">
                            {data.slice(0, 6).map((item, idx) => (
                                <div key={idx} className="card" onClick={()=>loadPlayer(item)}>
                                    <div className="thumb-box">
                                        <img src={item.image} className="thumb" />
                                        <span className="duration">HD</span>
                                    </div>
                                    <div className="info"><h3 className="title">{item.title}</h3></div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <script async data-cfasync="false" src="https://momrollback.com/b88712e5e1e497d39ecedaffd47492bc/invoke.js"></script>

            <style jsx global>{`
                body { background:black; color:white; font-family:Arial, sans-serif; }
                .app { padding-bottom: 60px; }
                .header { background:black; padding:12px 15px; display:flex; justify-content:space-between; border-bottom:1px solid #333; position:sticky; top:0; z-index:100; }
                .logo { font-size:24px; font-weight:900; cursor:pointer; }
                .logo span { background:#ff9000; color:black; padding:0 5px; margin-left:2px; border-radius:3px; }
                
                .sticky-nav { background:black; padding:10px 15px; position:sticky; top:52px; z-index:90; display:flex; gap:10px; overflow-x:auto; border-bottom:1px solid #333; }
                .tab { background:#222; padding:8px 16px; border-radius:20px; font-size:13px; font-weight:bold; white-space:nowrap; border:1px solid #333; cursor:pointer; }
                .tab.active { background:white; color:black; }

                .container { padding:10px; max-width:1400px; margin:0 auto; }
                .grid { display:grid; grid-template-columns:1fr; gap:20px; }
                @media(min-width:600px) { .grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); } }

                .card { background:black; border-radius:6px; overflow:hidden; display:block; cursor:pointer; text-decoration:none; color:white; }
                .thumb-box { position:relative; width:100%; padding-top:56.25%; background:#111; }
                .thumb { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; }
                
                .badge-pl { position:absolute; bottom:0; right:0; background:#ff9000; color:black; padding:4px 8px; font-size:11px; font-weight:800; display:flex; align-items:center; border-top-left-radius:6px; }
                .duration { position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.8); padding:2px 5px; font-size:11px; border-radius:2px; font-weight:bold; }
                
                .info { padding:12px 5px; }
                .title { font-size:15px; margin:0; line-height:1.4; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
                .meta { font-size:12px; color:#999; margin-top:5px; display:flex; justify-content:space-between; }

                .ad-box { min-height:80px; background:#111; margin:10px 0; display:flex; justify-content:center; }
                .ad-banner { margin:20px auto; text-align:center; display:flex; justify-content:center; }
                
                .load-more { width:100%; padding:15px; background:#222; color:#ff9000; border:1px solid #333; margin-top:20px; font-weight:bold; cursor:pointer; }
                
                .player-box { width:100%; aspect-ratio:16/9; background:black; position:relative; z-index:10; }
                .actions { display:flex; gap:10px; margin-top:15px; }
                .btn { flex:1; background:#333; color:white; border:none; padding:12px; border-radius:4px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; text-decoration:none; }
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


