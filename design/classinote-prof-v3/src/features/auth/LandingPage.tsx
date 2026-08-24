import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, MessageCircle } from 'lucide-react';

export const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#002366] to-[#0a1e3d] flex items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm space-y-8 text-center"
    >
      <div className="space-y-3">
        <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">ClassiNote</h1>
        <p className="text-sm text-blue-200">Espace Professeur</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
        <MessageCircle className="w-8 h-8 text-amber-300 mx-auto" />
        <div>
          <h2 className="text-sm font-bold text-white">Lien d'accès requis</h2>
          <p className="text-xs text-blue-200/80 mt-2 leading-relaxed">
            Demandez votre lien d'accès à l'administration de l'école via WhatsApp.
            <br /><br />
            Le lien sera utilisé une seule fois pour enregistrer votre appareil.
          </p>
        </div>
      </div>

      <p className="text-xs text-blue-200/40">ClassiNote {new Date().getFullYear()}</p>
    </motion.div>
  </div>
);
