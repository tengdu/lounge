"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin, X, ZoomIn } from 'lucide-react';

interface TerminalMapProps {
  airportCode: string;
  location: string;
}

export default function TerminalMap({ airportCode, location }: TerminalMapProps) {
  const [isOpen, setIsOpen] = useState(false);

  // We use a high-quality abstract map/blueprint image from Unsplash as a placeholder
  const mapImageUrl = "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=1200&q=80";

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="mt-6 aspect-video bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
      >
        <Image 
          src={mapImageUrl}
          alt="Terminal Map Preview"
          fill
          className="object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-blue-900/0 transition-colors"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="bg-white p-4 rounded-full shadow-lg group-hover:scale-110 duration-300 text-blue-600 mb-3">
            <ZoomIn size={28} />
          </div>
          <span className="bg-white/90 backdrop-blur text-gray-800 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm group-hover:text-blue-600 transition-colors">
            View Terminal Map
          </span>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0 bg-white z-10">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">{airportCode} Terminal Map</h3>
                <p className="text-sm text-gray-500 font-medium">{location}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-colors"
                aria-label="Close Map"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body with Map */}
            <div className="relative flex-grow bg-gray-100 overflow-auto">
               <div className="min-w-[800px] min-h-[600px] relative w-full h-full">
                  <Image 
                    src={mapImageUrl}
                    alt={`${airportCode} Terminal Map Full`}
                    fill
                    className="object-cover md:object-contain opacity-80"
                  />
                  {/* Simulated Location Pin on Map */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="bg-blue-600 text-white p-3 rounded-full shadow-2xl animate-bounce">
                      <MapPin size={36} />
                    </div>
                    <span className="mt-2 bg-blue-900 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                      Lounge Location
                    </span>
                  </div>
               </div>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}