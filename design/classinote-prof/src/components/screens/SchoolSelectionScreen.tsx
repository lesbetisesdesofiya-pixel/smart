import React, { useState } from 'react';
import { School, ScreenType } from '../../types';

interface SchoolSelectionScreenProps {
  schools: School[];
  onSelectSchool: (school: School) => void;
  onNavigate: (screen: ScreenType) => void;
}

export const SchoolSelectionScreen: React.FC<SchoolSelectionScreenProps> = ({
  schools,
  onSelectSchool,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolLoc, setNewSchoolLoc] = useState('');
  const [newSchoolRole, setNewSchoolRole] = useState('');

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName) return;
    const newSchoolObj: School = {
      id: `s_${Date.now()}`,
      name: newSchoolName,
      location: newSchoolLoc || 'France',
      role: newSchoolRole || 'Enseignant',
      iconName: 'school',
      bgColor: 'bg-primary-fixed',
    };
    onSelectSchool(newSchoolObj);
    setShowAddModal(false);
    onNavigate('dashboard');
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 pb-28">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-2xl md:text-3xl font-bold text-primary mb-1">
          Sélectionnez votre établissement
        </h1>
        <p className="text-on-surface-variant font-body-md text-sm">
          Choisissez l'école dans laquelle vous souhaitez travailler aujourd'hui.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 sticky top-16 z-20 bg-background/95 backdrop-blur-xs py-2">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher une école..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all shadow-xs text-sm"
          />
        </div>
      </div>

      {/* School List Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school) => (
          <button
            key={school.id}
            onClick={() => {
              onSelectSchool(school);
              onNavigate('dashboard');
            }}
            className="text-left flex flex-col bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-outline-variant hover:border-primary-container hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4">
              <div
                className={`w-12 h-12 rounded-xl ${school.bgColor} flex items-center justify-center text-primary`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {school.iconName}
                </span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200">
                chevron_right
              </span>
            </div>

            <h3 className="font-headline-sm text-lg font-bold text-primary mb-1">
              {school.name}
            </h3>
            <div className="flex items-center gap-1 text-on-surface-variant mb-4 text-xs font-medium">
              <span className="material-symbols-outlined text-sm">
                location_on
              </span>
              <span>{school.location}</span>
            </div>

            <div className="mt-auto pt-4 border-t border-outline-variant flex items-center justify-between">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                {school.role}
              </span>
            </div>
          </button>
        ))}

        {/* Add New School Card */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center justify-center bg-surface-container-low border-2 border-dashed border-outline-variant p-6 rounded-2xl hover:bg-surface-container-high hover:border-primary transition-all group min-h-[200px] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition-transform text-primary">
            <span className="material-symbols-outlined text-2xl">add</span>
          </div>
          <span className="font-headline-sm text-base font-bold text-primary mb-1">
            Ajouter un établissement
          </span>
          <p className="text-on-surface-variant text-center font-body-sm text-xs px-2">
            Liez votre compte à une nouvelle école ou un nouveau centre de formation.
          </p>
        </button>
      </div>

      {/* Informational Banner */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-primary-container rounded-3xl overflow-hidden shadow-xl p-0">
        <div className="md:col-span-7 p-6 md:p-10 text-white">
          <h2 className="font-headline-md text-2xl font-bold mb-3">
            Besoin d'aide pour configurer votre espace ?
          </h2>
          <p className="font-body-lg text-sm mb-6 opacity-90 leading-relaxed">
            Consultez notre guide de démarrage rapide ou contactez l'administration de votre établissement pour obtenir vos codes d'accès.
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => alert("Le guide de démarrage rapide est disponible dans la rubrique Aide.")}
              className="px-5 py-2.5 bg-white text-primary font-label-md text-xs font-bold rounded-xl hover:bg-secondary-fixed transition-colors cursor-pointer"
            >
              Voir le guide
            </button>
            <button 
              onClick={() => onNavigate('messaging')}
              className="px-5 py-2.5 border border-white/30 text-white font-label-md text-xs font-semibold rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              Support technique
            </button>
          </div>
        </div>

        <div className="md:col-span-5 h-64 md:h-full min-h-[250px] relative overflow-hidden bg-primary-container/40">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqza16JHXTtYy-cxntivGLDDUo9fDgfVRQ-kZPJoVaF3iWU0hW9dYNw7M326lRED8WtTvfqS1-Hj5RmWQZPkDsLWVp8W5TDHE88BqU8swB4BA8Hr34h2s2G15ft2d165PXnKwgtmi2MPWLepRP7rlcN-GUB6YYv6IzIeyqVslrHWlckpYMGrZi6s5LzUhVc7N6cQU697Kef0ui5TIfwhzU9pleGVQJgT2X7po6l4KAVX67c3gJU63eoE7kvQqeOMBW-GjYK17Shg"
            alt="Dashboard 3D Representation"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Add School Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-primary">Ajouter un établissement</h3>
            <form onSubmit={handleAddSchool} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface">Nom de l'établissement</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lycée Saint-Exupéry"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg text-sm mt-1 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface">Ville / Region</label>
                <input
                  type="text"
                  placeholder="Ex: Paris 15e"
                  value={newSchoolLoc}
                  onChange={(e) => setNewSchoolLoc(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg text-sm mt-1 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface">Rôle ou Discipline</label>
                <input
                  type="text"
                  placeholder="Ex: Professeur de Mathématiques"
                  value={newSchoolRole}
                  onChange={(e) => setNewSchoolRole(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg text-sm mt-1 outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-on-surface-variant"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-bold"
                >
                  Lier l'établissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
