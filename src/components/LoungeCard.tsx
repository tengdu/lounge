import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, ShieldCheck, ArrowRight } from 'lucide-react';
import { Lounge } from '@/data/lounges';

interface LoungeCardProps {
  lounge: Lounge;
}

export default function LoungeCard({ lounge }: LoungeCardProps) {
  return (
    <Link href={`/lounge/${lounge.id}`} className="block h-full group">
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500 overflow-hidden relative">
        
        {/* Subtle highlight bar at the top that appears on hover */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>

        <div className="relative w-full h-56 overflow-hidden">
          <Image
            src={lounge.imageUrl}
            alt={lounge.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
            <div className="text-white z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1.5 block">
                {lounge.airportCode} • {lounge.airportCity}
              </span>
              <h5 className="text-xl md:text-2xl font-bold leading-tight drop-shadow-lg pr-4">{lounge.name}</h5>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-white border border-white/30 shadow-sm z-10 shrink-0">
              <Star size={14} className="fill-yellow-400 text-yellow-400 drop-shadow-sm" />
              <span className="text-sm font-bold">{lounge.rating}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 flex flex-col flex-grow bg-white relative z-10">
          <div className="flex items-start gap-2.5 mb-4 text-gray-600">
            <div className="bg-blue-50 p-1.5 rounded-lg mt-0.5 shrink-0 group-hover:bg-blue-100 transition-colors">
              <MapPin size={14} className="text-blue-500" />
            </div>
            <p className="text-sm font-medium leading-snug">{lounge.location}</p>
          </div>
          
          <p className="text-gray-500 mb-6 flex-grow text-sm leading-relaxed line-clamp-3 font-light">
            {lounge.description}
          </p>
          
          <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Required</h6>
              </div>
              <p className="text-xs text-gray-700 leading-snug line-clamp-1 font-medium">{lounge.accessInstructions}</p>
            </div>
            
            {/* View Details Button that slides in on hover */}
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}