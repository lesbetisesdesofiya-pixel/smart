import React from 'react';

interface ChildSelectorProps {
  enfants: { id: number; nom: string; classe: string }[];
  activeId: number;
  onSelect: (id: number) => void;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({ enfants, activeId, onSelect }) => {
  if (enfants.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {enfants.map((child) => (
        <button
          key={child.id}
          onClick={() => onSelect(child.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            child.id === activeId
              ? 'bg-[#002366] text-white shadow-md'
              : 'bg-white text-navy-600 border border-navy-100 hover:border-navy-200'
          }`}
        >
          {child.nom.split(' ')[0]}
          {child.classe && <span className="opacity-70 ml-1">({child.classe})</span>}
        </button>
      ))}
    </div>
  );
};
