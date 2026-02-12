"use client";
import React from 'react';

export default function AdBanner({ type }) {
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
}
