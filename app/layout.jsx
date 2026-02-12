import './globals.css';
import Link from 'next/link';
import { PlayCircle, Home, Search } from 'lucide-react';
import AdBanner from '@/components/AdBanner';

export const metadata = {
  title: 'Netbongo - Stream Video',
  description: 'Watch best videos on Netbongo.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f0f0f] text-white font-sans selection:bg-red-600">
        
        {/* Global Ads (Popunder & Socialbar) */}
        <script async src="[https://momrollback.com/02/f8/86/02f886f4ac6dd52755b96f56e54b4d57.js](https://momrollback.com/02/f8/86/02f886f4ac6dd52755b96f56e54b4d57.js)"></script>
        <script async src="[https://momrollback.com/dc/95/4d/dc954dbecf4b21d37cedb37de585cf99.js](https://momrollback.com/dc/95/4d/dc954dbecf4b21d37cedb37de585cf99.js)"></script>

        {/* HEADER */}
        <header className="h-14 bg-[#0f0f0f] flex items-center justify-between px-4 fixed w-full z-50 border-b border-[#272727]">
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-1 cursor-pointer">
                    <div className="bg-red-600 text-white p-1 rounded-lg"><PlayCircle size={20} /></div>
                    <span className="text-xl font-bold tracking-tighter hidden sm:block">Netbongo</span>
                </Link>
            </div>
            <div className="flex-1 max-w-xl mx-4">
                <div className="flex w-full bg-[#121212] border border-[#303030] rounded-full overflow-hidden">
                    <input type="text" placeholder="Search original videos..." className="w-full bg-transparent px-4 py-2 focus:outline-none text-white" />
                    <button className="bg-[#222] px-5 border-l border-[#303030]"><Search size={18} className="text-gray-400"/></button>
                </div>
            </div>
        </header>

        <div className="flex pt-14 h-full min-h-screen">
            {/* SIDEBAR */}
            <aside className="w-60 bg-[#0f0f0f] hidden md:flex flex-col h-[calc(100vh-56px)] fixed z-40 border-r border-[#272727]">
                <div className="p-3 space-y-1">
                    <Link href="/" className="w-full flex items-center gap-4 px-3 py-2 hover:bg-[#272727] rounded-lg transition">
                        <Home size={20} /> <span className="text-sm font-medium">Home</span>
                    </Link>
                </div>
                <div className="mt-auto p-4 flex justify-center"><AdBanner type="300x250" /></div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-60 w-full">
                {children}
            </main>
        </div>
      </body>
    </html>
  );
}
