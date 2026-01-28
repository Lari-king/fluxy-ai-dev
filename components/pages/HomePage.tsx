/**
 * 🏠 HOMEPAGE - Inspiré par Revolut
 * 
 * Design moderne avec :
 * - Hero immersif avec photo + overlay de données
 * - Typographie audacieuse
 * - Cards glassmorphism avec photos
 * - Palette noir/cyan/purple
 */

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Receipt,
  Target,
  Brain,
  BarChart3,
  Zap,
  Shield,
  Clock,
  DollarSign,
} from 'lucide-react';

interface Feature {
  icon: any;
  title: string;
  description: string;
  color: string;
}

interface HomePageProps {
  onGetStarted: () => void;
}

export function HomePage({ onGetStarted }: HomePageProps) {
  // ✅ Features
  const features = useMemo<Feature[]>(() => [
    {
      icon: Brain,
      title: 'Intelligence artificielle',
      description: 'Prédictions comportementales avec Maslow V3',
      color: 'cyan',
    },
    {
      icon: Receipt,
      title: 'Transactions intelligentes',
      description: 'Catégorisation automatique et insights en temps réel',
      color: 'purple',
    },
    {
      icon: Target,
      title: 'Projections précises',
      description: 'Détection d\'anomalies et fin de mois prédictive',
      color: 'blue',
    },
    {
      icon: BarChart3,
      title: 'Dashboard minimaliste',
      description: 'Design japonais avec glassmorphism',
      color: 'green',
    },
  ], []);

  const handleGetStarted = useCallback(() => {
    onGetStarted();
  }, [onGetStarted]);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Flux</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <button
              onClick={handleGetStarted}
              className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-white/90 transition-all"
            >
              Commencer
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section - Style Revolut */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-700 to-purple-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.2),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="z-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6"
            >
              <Zap className="w-4 h-4 text-cyan-300" />
              <span className="text-sm text-white/90">Cockpit financier du futur</span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.95] tracking-tight">
              Bien plus qu'une app financière
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed max-w-xl">
              Chez vous ou à l'étranger, laissez Flux dépasser toutes vos attentes en matière de gestion financière. Intelligence artificielle incluse.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
              className="group px-8 py-4 bg-black text-white rounded-full text-lg font-semibold hover:bg-black/90 transition-all flex items-center gap-2 shadow-2xl"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Right: Card with overlay */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Main card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1758599543116-4fdb887911a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25maWRlbnQlMjBwZXJzb24lMjBidXNpbmVzcyUyMG1vZGVybnxlbnwxfHx8fDE3Njg5MzMwMTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Hero"
                className="w-full h-[600px] object-cover"
              />
              
              {/* Overlay: Balance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute top-8 left-8 right-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
              >
                <div className="text-sm text-white/60 mb-2">Personnel</div>
                <div className="text-5xl font-bold text-white mb-3">6 012 €</div>
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white/90">
                  Comptes
                </div>
              </motion.div>

              {/* Overlay: Transaction */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Salaire</div>
                    <div className="text-xs text-white/60">Aujourd'hui, 11 h 28</div>
                  </div>
                </div>
                <div className="text-xl font-semibold text-green-400">+2 550 €</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Style Revolut */}
      <section className="relative bg-white text-black py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Réinventez votre gestion financière
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Dépensez intelligemment, économisez automatiquement, et regardez vos finances s'améliorer avec un système d'IA comportementale.
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
            >
              <img
                src="https://images.unsplash.com/photo-1548638529-67ae36df7aa8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBsYXB0b3AlMjBjb2ZmZWV8ZW58MXx8fHwxNzY4OTMzMDE4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Feature 1"
                className="w-full h-80 object-cover"
              />
              <div className="absolute top-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="text-4xl font-bold text-black mb-2">3 128 €</div>
                <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                  Comptes
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-black">Café à Londres</div>
                </div>
                <div className="text-sm font-semibold text-red-500">-5,20 €</div>
              </div>
            </motion.div>

            {/* Card 2 - Featured */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative rounded-3xl overflow-hidden border-2 border-cyan-500 shadow-2xl hover:shadow-3xl transition-shadow"
            >
              <img
                src="https://images.unsplash.com/photo-1758522484797-49f88e04809c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBob25lJTIwZmluYW5jZXxlbnwxfHx8fDE3Njg5MzMwMTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Feature 2"
                className="w-full h-80 object-cover"
              />
              <div className="absolute top-6 left-6 right-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl p-4 shadow-2xl">
                <div className="text-4xl font-bold mb-2">6 012 €</div>
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                  Comptes
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-black">Salaire</div>
                    <div className="text-xs text-gray-500">Aujourd'hui, 11 h 28</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-green-500">+2 550 €</div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
            >
              <img
                src="https://images.unsplash.com/photo-1758599543116-4fdb887911a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25maWRlbnQlMjBwZXJzb24lMjBidXNpbmVzcyUyMG1vZGVybnxlbnwxfHx8fDE3Njg5MzMwMTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Feature 3"
                className="w-full h-80 object-cover"
              />
              <div className="absolute top-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="text-4xl font-bold text-black mb-2">2 350 €</div>
                <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                  Comptes
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-black">Factures publiques</div>
                </div>
                <div className="text-sm font-semibold text-red-500">-225 €</div>
              </div>
            </motion.div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
              className="px-8 py-4 bg-black text-white rounded-full text-lg font-semibold hover:bg-gray-900 transition-all inline-flex items-center gap-2"
            >
              Commencer avec Flux
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="bg-black py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-br from-cyan-600 via-blue-700 to-purple-900 py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.3),transparent)]" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Clock className="w-16 h-16 mx-auto mb-6 text-cyan-300" />
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Prêt à transformer vos finances ?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers d'utilisateurs qui ont repris le contrôle de leurs finances avec Flux.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="px-10 py-5 bg-white text-black rounded-full text-lg font-semibold hover:bg-white/90 transition-all inline-flex items-center gap-2 shadow-2xl"
            >
              Commencer maintenant
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Flux</span>
            </div>
            <div className="text-sm text-white/40">
              © 2026 Flux. Cockpit financier du futur.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
