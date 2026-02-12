export const revalidate = 3600; // Cache data for 1 hour

export async function getVideos() {
    const B64_URL = "aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvZS8yUEFDWC0xdlR1Z09RWHdMSUd5Vm9mRmx2RmxLTjdFX1BOZW1Da0lEY2R3QjRkR2NvUDE2Z09uVGNtSjJpU001bHJfWUZWUHRzMUZiYzVnNWdrdkU0Uy9wdWI/b3V0cHV0PWNzdg==";
    // Node.js এ base64 ডিকোড করা
    const sheetUrl = Buffer.from(B64_URL, 'base64').toString('ascii');
    const proxyUrl = "[https://netbongo.aiorbd.workers.dev/?url=](https://netbongo.aiorbd.workers.dev/?url=)" + encodeURIComponent(sheetUrl);

    try {
        const res = await fetch(proxyUrl, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error("Fetch failed");
        const text = await res.text();
        
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        let allVids = [];

        // Unique ID Generator
        const generateId = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = (hash << 5) - hash + str.charCodeAt(i);
                hash &= hash;
            }
            return Math.abs(hash).toString(36);
        };

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (row && row.length >= 2) {
                const clean = str => str ? str.replace(/^"|"$/g, '').trim() : '';
                const title = clean(row[0]) || 'Untitled';
                const url = clean(row[1]);
                
                if (url) {
                    const type = clean(row[2]) || 'Video';
                    const image = clean(row[3]) || `https://placehold.co/600x400/1e1e1e/FFF?text=${encodeURIComponent(title.substring(0, 2))}`;
                    const duration = clean(row[4]) || null; // Original time from sheet
                    const uploadDate = clean(row[5]) || null;

                    allVids.push({
                        id: generateId(url),
                        title, url, type, image, duration, uploadDate,
                        views: Math.floor(Math.random() * 900 + 10) + 'K views'
                    });
                }
            }
        }
        return allVids;
    } catch (e) {
        console.error("Data Fetch Error:", e);
        return [];
    }
}
