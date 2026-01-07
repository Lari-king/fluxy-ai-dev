/**
 * 🧠 TRANSACTION PARSER - INTELLIGENT CATEGORIZATION
 * 
 * Parse les descriptions bancaires brutes pour extraire :
 * - Nom du marchand
 * - Catégorie intelligente
 * - Icône contextuelle
 * - Couleur thématique
 */

import {
    CreditCard,
    Repeat,
    Building2,
    Briefcase,
    ShoppingBag,
    Coffee,
    Car,
    Home,
    Phone,
    Zap,
    Heart,
    Plane,
    ShoppingCart,
    Utensils,
    Gift,
    Smartphone,
    Wifi,
    Droplet,
    Film,
    Music,
    Dumbbell,
    GraduationCap,
    Stethoscope,
    type LucideIcon
  } from 'lucide-react';
  
  export interface ParsedTransaction {
    merchant: string;
    category: string;
    icon: LucideIcon;
    color: string;
  }
  
  export interface ColorScheme {
    bg: string;
    border: string;
    text: string;
  }
  
  export const colorMap: Record<string, ColorScheme> = {
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
    teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
    gray: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60' },
  };
  
  /**
   * Parse une description de transaction bancaire
   */
  export function parseTransactionDescription(description: string): ParsedTransaction {
    const desc = description.toLowerCase();
    
    let merchant = description;
    let category = 'Autre';
    let icon: LucideIcon = ShoppingBag;
    let color = 'gray';
    
    // VIREMENTS SEPA
    if (desc.includes('sepa') || desc.includes('vir')) {
      const sepaMatch = description.match(/SEPA\s+([A-Z\s]+?)(?:\s+-\s+|\s+MOTIF)/i);
      if (sepaMatch) {
        merchant = sepaMatch[1].trim();
      } else {
        const virMatch = description.match(/VIR[^\s]*\s+(.+?)(?:\s+-\s+|\s+MOTIF)/i);
        if (virMatch) {
          merchant = virMatch[1].trim();
        }
      }
      
      // Sous-catégories virements
      if (desc.includes('salaire') || desc.includes('salary') || desc.includes('paie')) {
        category = 'Salaire';
        icon = Briefcase;
        color = 'green';
      } else if (desc.includes('loyer') || desc.includes('rent')) {
        category = 'Logement';
        icon = Home;
        color = 'blue';
      } else {
        category = 'Virement';
        icon = Building2;
        color = 'purple';
      }
    }
    
    // CARTE BANCAIRE
    else if (desc.includes('carte') || desc.includes('card') || desc.includes('facture carte')) {
      const cardMatch = description.match(/(?:CARTE|CARD)(?:\s+DU)?\s+\d+\s+(.+?)(?:\s+A\s+|$)/i);
      if (cardMatch) {
        merchant = cardMatch[1].trim();
      }
      
      // Sous-catégories achats carte
      if (desc.includes('restaurant') || desc.includes('resto') || desc.includes('cafe') || desc.includes('brasserie')) {
        category = 'Restaurant';
        icon = Utensils;
        color = 'orange';
      } else if (desc.includes('carburant') || desc.includes('essence') || desc.includes('station') || desc.includes('fuel')) {
        category = 'Transport';
        icon = Car;
        color = 'cyan';
      } else if (desc.includes('supermarche') || desc.includes('market') || desc.includes('carrefour') || desc.includes('auchan') || desc.includes('leclerc')) {
        category = 'Courses';
        icon = ShoppingCart;
        color = 'pink';
      } else if (desc.includes('amazon') || desc.includes('ebay') || desc.includes('fnac')) {
        category = 'Shopping';
        icon = ShoppingBag;
        color = 'indigo';
      } else if (desc.includes('voyage') || desc.includes('hotel') || desc.includes('airbnb') || desc.includes('booking')) {
        category = 'Voyage';
        icon = Plane;
        color = 'teal';
      } else {
        category = 'Achat carte';
        icon = CreditCard;
        color = 'blue';
      }
    }
    
    // PRÉLÈVEMENTS
    else if (desc.includes('prlv') || desc.includes('prelevement')) {
      const prlvMatch = description.match(/PRLV\s+(.+?)(?:\s+REF|\s+MOTIF|$)/i);
      if (prlvMatch) {
        merchant = prlvMatch[1].trim();
      }
      
      // Sous-catégories prélèvements
      if (desc.includes('tel') || desc.includes('mobile') || desc.includes('orange') || desc.includes('sfr') || desc.includes('bouygues') || desc.includes('free')) {
        category = 'Téléphonie';
        icon = Smartphone;
        color = 'cyan';
      } else if (desc.includes('internet') || desc.includes('box') || desc.includes('fibre')) {
        category = 'Internet';
        icon = Wifi;
        color = 'cyan';
      } else if (desc.includes('edf') || desc.includes('engie') || desc.includes('energie') || desc.includes('electricite')) {
        category = 'Énergie';
        icon = Zap;
        color = 'yellow';
      } else if (desc.includes('eau') || desc.includes('veolia')) {
        category = 'Eau';
        icon = Droplet;
        color = 'blue';
      } else if (desc.includes('assurance') || desc.includes('mutuelle')) {
        category = 'Assurance';
        icon = Heart;
        color = 'red';
      } else if (desc.includes('spotify') || desc.includes('deezer') || desc.includes('apple music')) {
        category = 'Musique';
        icon = Music;
        color = 'purple';
      } else if (desc.includes('netflix') || desc.includes('prime video') || desc.includes('disney') || desc.includes('canal')) {
        category = 'Streaming';
        icon = Film;
        color = 'red';
      } else if (desc.includes('salle de sport') || desc.includes('fitness') || desc.includes('gym')) {
        category = 'Sport';
        icon = Dumbbell;
        color = 'orange';
      } else {
        category = 'Prélèvement';
        icon = Repeat;
        color = 'purple';
      }
    }
    
    // AUTRES PATTERNS SPÉCIFIQUES
    else {
      // Éducation
      if (desc.includes('ecole') || desc.includes('universite') || desc.includes('formation')) {
        category = 'Éducation';
        icon = GraduationCap;
        icon = GraduationCap;
        color = 'indigo';
      }
      // Santé
      else if (desc.includes('pharmacie') || desc.includes('medecin') || desc.includes('hopital') || desc.includes('clinique')) {
        category = 'Santé';
        icon = Stethoscope;
        color = 'red';
      }
      // Cadeaux
      else if (desc.includes('cadeau') || desc.includes('anniversaire')) {
        category = 'Cadeaux';
        icon = Gift;
        color = 'pink';
      }
      // Café/Snacks
      else if (desc.includes('starbucks') || desc.includes('mcdonald') || desc.includes('burger') || desc.includes('kfc')) {
        category = 'Fast Food';
        icon = Coffee;
        color = 'orange';
      }
      // Par défaut : extraire premiers mots
      else {
        const words = description.split(/[\s-]+/).filter(w => w.length > 2);
        if (words.length > 0) {
          merchant = words.slice(0, 3).join(' ');
        }
      }
    }
    
    // Nettoyer le nom marchand
    merchant = merchant
      .replace(/FACTURE CARTE DU \d+/gi, '')
      .replace(/VIR CPTE A CPTE EMIS/gi, '')
      .replace(/SEPA\s+/gi, '')
      .replace(/PRLV\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limiter la longueur
    if (merchant.length > 35) {
      merchant = merchant.substring(0, 32) + '...';
    }
    
    return { merchant, category, icon, color };
  }
  
  /**
   * Détecte le type de récurrence pour les patterns
   */
  export function getRecurrencePattern(description: string): ParsedTransaction {
    const desc = description.toLowerCase();
    
    if (desc.includes('salaire') || desc.includes('salary')) {
      return { merchant: 'Salaire', category: 'Salaire', icon: Briefcase, color: 'green' };
    } else if (desc.includes('loyer') || desc.includes('rent')) {
      return { merchant: 'Loyer', category: 'Logement', icon: Home, color: 'blue' };
    } else if (desc.includes('tel') || desc.includes('mobile')) {
      return { merchant: 'Téléphonie', category: 'Téléphonie', icon: Smartphone, color: 'cyan' };
    } else if (desc.includes('internet')) {
      return { merchant: 'Internet', category: 'Internet', icon: Wifi, color: 'cyan' };
    } else if (desc.includes('edf') || desc.includes('energie')) {
      return { merchant: 'Énergie', category: 'Énergie', icon: Zap, color: 'yellow' };
    } else if (desc.includes('assurance')) {
      return { merchant: 'Assurance', category: 'Assurance', icon: Heart, color: 'red' };
    } else if (desc.includes('spotify') || desc.includes('music')) {
      return { merchant: 'Musique', category: 'Musique', icon: Music, color: 'purple' };
    } else if (desc.includes('netflix') || desc.includes('streaming')) {
      return { merchant: 'Streaming', category: 'Streaming', icon: Film, color: 'red' };
    }
    
    // Par défaut : parser comme transaction normale
    const parsed = parseTransactionDescription(description);
    return { 
      merchant: parsed.merchant, 
      category: parsed.category, 
      icon: Repeat, 
      color: 'purple' 
    };
  }
  