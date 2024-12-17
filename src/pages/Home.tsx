import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, MapPin, Star } from 'lucide-react';

export function Home() {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Workouts</h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600">
          Encuentra y únete a entrenamientos cerca de ti con los mejores monitores deportivos
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/events"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t('events.title')}
          </Link>
          <Link
            to="/auth"
            className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            {t('common.register')}
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <Calendar className="w-12 h-12 text-indigo-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Entrenamientos</h3>
          <p className="text-gray-600">Encuentra sesiones de entrenamiento cerca de ti</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <Users className="w-12 h-12 text-indigo-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Monitores Expertos</h3>
          <p className="text-gray-600">Conecta con monitores certificados</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <MapPin className="w-12 h-12 text-indigo-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Cerca de Ti</h3>
          <p className="text-gray-600">Entrena en tu zona</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <Star className="w-12 h-12 text-indigo-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Experiencias Únicas</h3>
          <p className="text-gray-600">Eventos de calidad y asequibles</p>
        </div>
      </section>
    </div>
  );
}