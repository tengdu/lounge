import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { lounges } from "@/data/lounges";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Wifi, 
  Coffee, 
  Wine, 
  Bath 
} from "lucide-react";

export async function generateStaticParams() {
  return lounges.map((lounge) => ({
    id: lounge.id,
  }));
}

export default async function LoungeDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const lounge = lounges.find((l) => l.id === id);

  if (!lounge) {
    notFound();
  }

  // Infer amenities based on description text to create a richer UI
  const descLower = lounge.description.toLowerCase();
  const hasWifi = descLower.includes("wi-fi") || descLower.includes("wifi");
  const hasFood = descLower.includes("food") || descLower.includes("dining") || descLower.includes("cuisine") || descLower.includes("snack") || descLower.includes("buffet") || descLower.includes("pancake");
  const hasBar = descLower.includes("bar") || descLower.includes("cocktail") || descLower.includes("spirit") || descLower.includes("wine") || descLower.includes("beer");
  const hasShower = descLower.includes("shower") || descLower.includes("bath");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-[family-name:var(--font-geist-sans)] selection:bg-blue-200 pb-20">
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] md:h-[65vh]">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/20 to-[#f8fafc]"></div>
        <Image
          src={lounge.imageUrl}
          alt={lounge.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        
        {/* Top Navigation */}
        <div className="absolute top-0 left-0 w-full z-20 p-6 md:p-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full hover:bg-white/20 transition-all font-semibold text-sm group shadow-lg"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Search
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30 -mt-32 md:-mt-48">
        
        {/* Glassmorphism Header Card */}
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white mb-8 flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-1.5 bg-blue-100 text-blue-700 font-black tracking-widest uppercase text-xs rounded-full shadow-inner">
                {lounge.airportCode}
              </span>
              <span className="text-gray-500 font-bold uppercase tracking-wide text-sm">{lounge.airportCity}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
              {lounge.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 font-medium bg-gray-100/50 inline-flex px-4 py-2 rounded-xl">
              <MapPin size={20} className="text-blue-500 shrink-0" />
              <span className="text-base">{lounge.location}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-2 bg-yellow-50 px-5 py-3 rounded-2xl border border-yellow-200 shadow-sm">
              <Star size={28} className="fill-yellow-400 text-yellow-400" />
              <span className="text-3xl font-black text-yellow-700">{lounge.rating}</span>
            </div>
            <span className="text-xs text-gray-400 mt-3 font-bold uppercase tracking-widest">Traveler Rating</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Description & Amenities */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">The Experience</h2>
              <p className="text-lg text-gray-600 leading-relaxed font-light">
                {lounge.description}
              </p>
            </div>

            {/* Inferred Amenities */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Amenities included</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-colors ${hasWifi ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-50'}`}>
                  <Wifi size={32} className="mb-4" />
                  <span className="font-bold text-sm tracking-wide">High-Speed Wi-Fi</span>
                </div>
                <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-colors ${hasFood ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-50'}`}>
                  <Coffee size={32} className="mb-4" />
                  <span className="font-bold text-sm tracking-wide">Premium Dining</span>
                </div>
                <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-colors ${hasBar ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-50'}`}>
                  <Wine size={32} className="mb-4" />
                  <span className="font-bold text-sm tracking-wide">Full Bar</span>
                </div>
                <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-colors ${hasShower ? 'bg-cyan-50 border-cyan-100 text-cyan-600' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-50'}`}>
                  <Bath size={32} className="mb-4" />
                  <span className="font-bold text-sm tracking-wide">Shower Suites</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Access Rules */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
              {/* Decorative background shape */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <ShieldCheck size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-wider text-emerald-50">Access Rules</h2>
              </div>
              <p className="text-white font-medium leading-relaxed text-lg">
                {lounge.accessInstructions}
              </p>
              <div className="mt-8 pt-6 border-t border-emerald-400/40">
                <p className="text-sm text-emerald-100 font-medium opacity-90 leading-snug">
                  Please have your boarding pass, ID, and applicable membership credentials ready upon arrival.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-4">Location & Wayfinding</h3>
               <p className="text-gray-600 font-medium leading-snug">{lounge.location}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}