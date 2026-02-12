import { getVideos } from '../../../utils/data'; // <-- Fixed Path
import WatchClient from './WatchClient';

// === DYNAMIC SEO META TAGS FOR SOCIAL MEDIA ===
export async function generateMetadata({ params }) {
    const videos = await getVideos();
    const video = videos.find((v) => v.id === params.id);

    if (!video) {
        return { title: 'Video Not Found - Netbongo' };
    }

    return {
        title: `${video.title} - Netbongo`,
        description: `Watch ${video.title} on Netbongo streaming platform.`,
        openGraph: {
            title: video.title,
            description: `Watch ${video.title} on Netbongo`,
            images: [video.image], // এটি ফেসবুকে থাম্বনেইল হিসেবে দেখাবে
            type: 'video.movie',
        },
        twitter: {
            card: 'summary_large_image',
            title: video.title,
            images: [video.image],
        }
    };
}

export default async function WatchPage({ params }) {
    const videos = await getVideos();
    const video = videos.find((v) => v.id === params.id);

    if (!video) {
        return <div className="text-white p-10 text-center mt-20">Video not found.</div>;
    }

    return <WatchClient video={video} allVideos={videos} />;
}
