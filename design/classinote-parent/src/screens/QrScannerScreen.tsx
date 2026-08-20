import React, { useState } from 'react';

interface QrScannerScreenProps {
  onChildAdded: (childName: string, className: string) => void;
  onNavigateToSupport: () => void;
}

export const QrScannerScreen: React.FC<QrScannerScreenProps> = ({
  onChildAdded,
  onNavigateToSupport
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanSuccess(null);

    setTimeout(() => {
      setIsScanning(false);
      const newName = `Samba Mensah`;
      const newClass = `3ème C`;
      setScanSuccess(`${newName} (${newClass})`);
      onChildAdded(newName, newClass);
    }, 2200);
  };

  return (
    <div className="space-y-6 pb-28 px-4 sm:px-5 max-w-lg mx-auto animate-fadeIn flex flex-col items-center justify-between min-h-[80vh] bg-pattern py-4">
      {/* Top Branding Section */}
      <header className="w-full flex flex-col items-center text-center space-y-3 pt-2">
        <div className="w-20 h-20 mb-2 bg-[#002366] text-white rounded-2xl shadow-md border border-white/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">school</span>
        </div>

        <h1 className="text-2xl font-extrabold text-[#00113a] tracking-tight">
          Bienvenue dans ClassiNote
        </h1>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Scannez le QR code fourni par votre établissement pour accéder au suivi scolaire de votre enfant.
        </p>
      </header>

      {/* QR Scanner Frame Zone */}
      <main className="w-full flex flex-col items-center justify-center space-y-6 my-auto">
        <div className="relative w-60 h-60 bg-white rounded-2xl shadow-xl border-4 border-[#e5eeff] flex items-center justify-center p-4 overflow-hidden group transition-all">
          {/* Corner Brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#002366] rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-[#002366] rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-[#002366] rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#002366] rounded-br-lg" />

          {/* Animated Scan Line when scanning */}
          {isScanning && (
            <div className="w-full h-0.5 bg-[#002366] absolute top-0 left-0 shadow-[0_0_10px_#435b9f] animate-qr-scan z-20" />
          )}

          {/* Illustrative QR Graphic */}
          <div className="opacity-20 flex flex-col items-center justify-center text-slate-600">
            <span className="material-symbols-outlined text-9xl">qr_code_2</span>
          </div>

          {/* Overlay Status */}
          {isScanning && (
            <div className="absolute inset-0 bg-[#002366]/10 flex items-center justify-center backdrop-blur-xs">
              <span className="bg-white px-3 py-1.5 rounded-full text-xs font-bold text-[#002366] shadow-md animate-pulse">
                Analyse du QR code...
              </span>
            </div>
          )}

          {scanSuccess && (
            <div className="absolute inset-0 bg-emerald-600/90 text-white flex flex-col items-center justify-center p-4 text-center z-30 animate-fadeIn">
              <span className="material-symbols-outlined text-5xl mb-1">check_circle</span>
              <p className="text-sm font-bold">Compte associé !</p>
              <p className="text-xs opacity-90 mt-1">{scanSuccess}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleStartScan}
          disabled={isScanning}
          className="w-full max-w-sm h-14 bg-[#002366] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform hover:bg-[#00113a]"
        >
          <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
          <span>{isScanning ? 'Numérisation...' : 'Scanner le QR code'}</span>
        </button>
      </main>

      {/* Footer Help Section */}
      <footer className="w-full max-w-sm text-center space-y-4">
        <div className="p-4 bg-[#eff4ff] rounded-2xl border border-slate-200 flex items-start gap-3 text-left">
          <span className="material-symbols-outlined text-[#375ca6] mt-0.5 shrink-0">info</span>
          <p className="text-xs text-slate-600 leading-relaxed">
            Votre QR code vous est fourni par l'établissement scolaire. En cas de perte, veuillez contacter le secrétariat.
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 text-xs font-semibold text-slate-500">
          <button
            onClick={onNavigateToSupport}
            className="hover:text-[#002366] transition-colors hover:underline"
          >
            Besoin d'aide ?
          </button>
          <span>•</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("ClassiNote protège rigoureusement les données de scolarité conformément à la réglementation.");
            }}
            className="hover:text-[#002366] transition-colors hover:underline"
          >
            Confidentialité
          </a>
        </div>
      </footer>
    </div>
  );
};
