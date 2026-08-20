import React from 'react';
import { Child } from '../types';
import { Avatar } from './Avatar';

interface ChildSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  childrenList: Child[];
  activeChildId: string;
  onSelectChild: (id: string) => void;
  onOpenQrScanner: () => void;
}

export const ChildSelectorModal: React.FC<ChildSelectorModalProps> = ({
  isOpen,
  onClose,
  childrenList,
  activeChildId,
  onSelectChild,
  onOpenQrScanner
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-slideUp">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-[#00113a]">Changer d'enfant</h3>
            <p className="text-xs text-[#757682]">Sélectionnez l'enfant à suivre</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="space-y-3">
          {childrenList.map((child) => {
            const isSelected = child.id === activeChildId;
            return (
              <div
                key={child.id}
                onClick={() => {
                  onSelectChild(child.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#375ca6] bg-[#e5eeff]/60 shadow-sm'
                    : 'border-slate-100 bg-[#f8f9ff] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={child.name} size="lg" />
                  <div>
                    <p className="font-bold text-[#00113a] text-sm">{child.name}</p>
                    <p className="text-xs text-[#757682]">{child.class} • {child.school}</p>
                  </div>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-[#375ca6] font-bold text-2xl">
                    check_circle
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            onClose();
            onOpenQrScanner();
          }}
          className="w-full py-3 px-4 bg-[#f8f9ff] hover:bg-[#e5eeff] text-[#00113a] font-semibold text-sm rounded-2xl border border-dashed border-[#8dafff] flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-xl text-[#375ca6]">qr_code_scanner</span>
          <span>Ajouter un enfant via QR Code</span>
        </button>
      </div>
    </div>
  );
};

