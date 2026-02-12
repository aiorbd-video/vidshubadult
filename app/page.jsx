import { getVideos } from '@/utils/data';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

export default async function HomePage() {
    const videos = await getVideos();
    const SMARTLINK = "[https://momrollback.com/jnt0mwiv7?key=c244b66638c840b3570508593d8b468e](https://momrollback.com/jnt0mwiv7?key=c244b66638c840b3570508593d8b468e)";

    return (
        <div className="p-4 md:p-6 pb-24 max-w-[2000px] mx-auto animate-fade-in">
            <div className="mb-6"><AdBanner type="native" /></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-8">
                {videos.slice(0, 24).map((video, idx) => (
                    <React.Fragment key={video.id}>
                        <Link href={`/watch/${video.id}`} className="group cursor-pointer flex flex-col gap-2">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#222]">
                                <img src={video.image} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                {video.duration && (
                                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                                        {video.duration}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3 mt-1 pr-2">
                                <div className="w-9 h-9 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold text-gray-300 border border-[#444]">{video.title.substring(0,1).toUpperCase()}</div>
                                <div>
                                    <h3 className="text-white text-base font-medium line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">{video.title}</h3>
                                    <div className="text-sm text-gray-400 mt-1">{video.type} {video.uploadDate && `• ${video.uploadDate}`}</div>
                                </div>
                            </div>
                        </Link>
                        {/* Ads Every 8 videos */}
                        {(idx + 1) % 8 === 0 && (
                            <div className="col-span-full py-4 border-t border-b border-[#272727] my-4 flex justify-center"><AdBanner type="300x250" /></div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="flex justify-center mt-10">
                <a href={SMARTLINK} target="_blank" className="bg-[#272727] hover:bg-[#3f3f3f] text-white font-medium py-2 px-8 rounded-full transition border border-[#303030]">Load more</a>
            </div>
        </div>
    );
}
