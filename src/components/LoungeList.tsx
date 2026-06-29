import React from 'react';
import LoungeCard from './LoungeCard';
import { Plane } from 'lucide-react';
import { Lounge } from '@/data/lounges';

interface LoungeListProps {
  lounges: Lounge[];
}

export default function LoungeList({ lounges }: LoungeListProps) {
  if (lounges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-500">
        <div className="bg-blue-50 text-blue-500 p-5 rounded-full mb-5">
          <Plane size={36} className="rotate-45" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No lounges found</h3>
        <p className="text-gray-500 max-w-md text-lg">
          We couldn't find any lounges matching your search. Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {lounges.map((lounge) => (
        <LoungeCard key={lounge.id} lounge={lounge} />
      ))}
    </div>
  );
}