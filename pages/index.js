import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Papa from 'papaparse';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

// --- CONFIGURATION ---
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTugOQXwLIGyVofFlvFLKN7E_PNemCkIDcdwB4dGcoP16gOnTcmJ2iSM5lr_YFVPts1Fbc5g5gkvE4S/pub?output=csv";
const DEFAULT_IMG = "https://i.ibb.co/vzXZd8z/play-button.png"; // একটি ডিফল্ট প্লে বাটন ইমেজ

// --- SERVER SIDE RENDERING (SSR) ---
export async function getServerSideProps({ query, res }) {
    // ১. ব্রাউজার ক্যাশিং সেট করা (দ্রুত লোড হওয়ার জন্য)
    res.setHeader(
        'Cache-Control',
        'public, s-maxage=10, stale-while-revalidate=59'
    );

    const { v, p } = query;
    
    // ডিফল্ট মেটা ডাটা
    let meta = {
        title: "NetBongo - Video Player",
        description: "Click to watch video.",
        image: DEFAULT_IMG,
        url: "https://netbongo.vercel.app"
    };

    try {
        // ২. গুগল শিট থেকে ডাটা আনা
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error("CSV Fetch Failed");
        const text = await response.text();
        
        // ৩. ডাটা পার্স করা
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const data = parsed.data;

        // ৪. ভিডিও খোঁজা
        if (v) {
            try {
                // Base64 ডিকোড করা
                const urlBuffer = Buffer.from(v, 'base64');
                const url = urlBuffer.toString('ascii');
                
                // এক্সাক্ট ম্যাচ না হলে ট্রিম করে খোঁজা
                const video = data.find(x => x.url && x.url.trim() === url.trim());
                
                if (video) {
                    meta.title = video.title || "Unknown Video";
                    meta.description = "Watch this exclusive video on NetBongo.";
                    meta.image = video.image || DEFAULT_IMG;
                    console.log("SSR Found Video:", video.title); // সার্ভার লগের জন্য
                }
            } catch (err) {
                console.log("SSR Video Error:", err.message);
            }
        } else if (p) {
            try {
                const urlBuffer = Buffer.from(p, 'base64');
                const url = urlBuffer.toString('ascii');
                const playlist = data.find(x => x.url && x.url.trim() === url.trim());
                
                if (playlist) {
                    meta.title = `Playlist: ${playlist.title}`;
                    meta.image = playlist.image || DEFAULT_IMG;
                }
            } catch (err) {}
        }
    } catch (e) {
        console.log("SSR Global Error:", e.message);
    }

    // ৫. প্রপস হিসেবে পাঠানো
    return {
        props: { initialMeta: meta }
    };
}

// --- CLIENT COMPONENT ---
export default function Home({ initialMeta }) {
    const router = useRouter();
    const [view, setView] = useState('home');
    const [data, setData] = useState([]);
    const [activeData, setActiveData] = useState([]);
    const [playlistItems, setPlaylistItems] = useState([]);
    const [currentVideo, setCurrentVideo] = useState(null);
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState('all');
    const [isAdult, setIsAdult] = useState(false);
    const artRef = useRef(null);

    // Initial Data Load
    useEffect(() => {
        if (localStorage.getItem('nb_ssr_final')) setIsAdult(true);
        fetchData();
        injectAds();
    }, []);

    // Deep Link Handler (Client Side Fallback)
    useEffect(() => {
        if(data.length > 0 && router.isReady) {
            const { v, p } = router.query;
            // সার্ভার সাইড হ্যান্ডেল করেছে, তাই এখানে শুধু ভিউ সেট করলেই হবে
            if(v && !currentVideo) {
                try {
                    const url = atob(v);
                    const item = data.find(x => x.url === url);
                    if(item) loadPlayer(item, false);
                } catch(e){}
            }
        }
    }, [router.isReady, data]);

    const fetchData = async () => {
        try {
            const r = await fetch(CSV_URL);
            const txt = await r.text();
            const p = Papa.parse(txt, {header:true, skipEmptyLines:true});
            const all = p.data.filter(x => x.url && x.title).sort(()=>Math.random()-0.5);
            setData(all);
            setActiveData(all);
        } catch(e) {}
    };

    const injectAds = () => {
        if(document.getElementById('ads-js')) return;
        const s = document.createElement('script');
        s.id = 'ads-js';
        s.src = "https://momrollback.com/02/f8/86/02f886f4ac6dd52755b96f56e54b4d57.js";
        document.body.appendChild(s);
    };

    // --- LOGIC ---
    const loadPlayer = (item, push=true) => {
        setCurrentVideo(item);
        setView('player');
        window.scrollTo(0,0);
        if(push) {
            const safe = btoa(item.url);
            window.history.pushState({view:'player'}, null, `?v=${safe}`);
        }
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
            setting: true,
            customType: {
                m3u8: function(video, url, art) {
                    if(Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(video);
                    } else if(video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    }
                }
            }
        });
        artRef.current = art;
    };

    const shareLink = () => {
        if(navigator.share) {
            navigator.share({
                title: currentVideo?.title || initialMeta.title,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
        }
    };

    const handleBack = () => {
        setView('home');
        window.history.pushState(null, null, '/');
        if(artRef.current) artRef.current.destroy();
    };

    // --- RENDER ---
    if(!isAdult) return (
        <div style={{display:'flex', height:'100vh', justifyContent:'center', alignItems:'center', background:'black', color:'white', textAlign:'center', flexDirection:'column'}}>
            <h1 style={{color:'#ff9000'}}>WARNING 18+</h1>
            <p>Adult content only.</p>
            <button onClick={()=>{setIsAdult(true); localStorage.setItem('nb_ssr_final','true')}} style={{padding:'10px 30px', background:'#ff9000', border:'none', fontWeight:'bold', marginTop:'20px'}}>ENTER</button>
        </div>
    );

    return (
        <div style={{background:'black', minHeight:'100vh', color:'white', fontFamily:'sans-serif', paddingBottom:'50px'}}>
            <Head>
                <title>{initialMeta.title}</title>
                <meta property="og:title" content={initialMeta.title} />
                <meta property="og:description" content={initialMeta.description} />
                <meta property="og:image" content={initialMeta.image} />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            {/* Header */}
            <div style={{padding:'15px', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between', position:'sticky', top:0, background:'black', zIndex:100}}>
                <div style={{fontWeight:'bold', fontSize:'20px'}} onClick={handleBack}>Net<span style={{color:'#ff9000'}}>Bongo</span></div>
                <div>🔍</div>
            </div>

            {/* VIEW: HOME */}
            {view === 'home' && (
                <div style={{padding:'10px'}}>
                    <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'15px'}}>
                        {activeData.slice(0, page*20).map((item, i) => (
                            <div key={i} onClick={()=>loadPlayer(item)} style={{background:'#111', borderRadius:'8px', overflow:'hidden', cursor:'pointer'}}>
                                <div style={{position:'relative', paddingTop:'56.25%'}}>
                                    <img src={item.image || DEFAULT_IMG} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover'}} />
                                    <div style={{position:'absolute', bottom:0, right:0, background:'rgba(0,0,0,0.8)', padding:'2px 5px', fontSize:'11px'}}>HD</div>
                                </div>
                                <div style={{padding:'10px'}}>
                                    <div style={{fontWeight:'bold', fontSize:'14px'}}>{item.title}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={()=>setPage(page+1)} style={{width:'100%', padding:'15px', background:'#222', color:'#ff9000', border:'none', marginTop:'20px'}}>LOAD MORE</button>
                </div>
            )}

            {/* VIEW: PLAYER */}
            {view === 'player' && (
                <div>
                    <div style={{padding:'10px', color:'#aaa'}} onClick={handleBack}>⬅ Back to Home</div>
                    <div id="artplayer" style={{width:'100%', aspectRatio:'16/9', background:'black'}}></div>
                    <div style={{padding:'15px'}}>
                        <h1 style={{fontSize:'18px', margin:'0 0 10px 0'}}>{currentVideo?.title}</h1>
                        <div style={{display:'flex', gap:'10px'}}>
                            <button onClick={shareLink} style={{flex:1, padding:'10px', background:'#333', color:'white', border:'none', borderRadius:'5px'}}>Share</button>
                            <a href="https://momrollback.com/jnt0mwiv7?key=c244b66638c840b3570508593d8b468e" target="_blank" style={{flex:1, padding:'10px', background:'#28a745', color:'white', textAlign:'center', borderRadius:'5px', textDecoration:'none'}}>Download</a>
                        </div>
                    </div>
                    
                    {/* Related */}
                    <div style={{padding:'10px', borderLeft:'4px solid #ff9000', margin:'10px', fontWeight:'bold'}}>Related Videos</div>
                    <div style={{padding:'10px', display:'grid', gridTemplateColumns:'1fr', gap:'15px'}}>
                        {data.slice(0, 5).map((item, i) => (
                            <div key={i} onClick={()=>loadPlayer(item)} style={{display:'flex', gap:'10px', background:'#111', padding:'5px', borderRadius:'5px'}}>
                                <img src={item.image} style={{width:'120px', height:'68px', objectFit:'cover'}} />
                                <div style={{fontSize:'13px'}}>{item.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


