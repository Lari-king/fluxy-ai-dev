import Dexie, { Table } from 'dexie';

// ⚠️ Définitions Minimales d'Interfaces (À COMPLÉTER)
// Pour l'exemple, nous utilisons 'any', mais utilisez les interfaces réelles de votre projet
// si vous les avez dans des fichiers dédiés.

interface Transaction { id: string; amount: number; date: Date; personId: string; }
interface Budget { id: string; name: string; amount: number; }
interface Goal { id: string; name: string; target: number; }
interface Person { id: string; name: string; circle: string; } 
interface Account { id: string; name: string; balance: number; }
interface Category { id: string; name: string; }
interface Rule { id: string; name: string; match: string; }
interface UserAuth { email: string; password: string; name: string; id: string; } 
// Cette interface est pour le stockage des utilisateurs enregistrés, 
// non pas pour l'utilisateur actuellement connecté.

// Définition de la Base de Données
export class AppDB extends Dexie {
  // Les tables de données lourdes (à migrer vers IndexedDB)
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  goals!: Table<Goal, string>;
  people!: Table<Person, string>;
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  rules!: Table<Rule, string>;

  // Table pour stocker les enregistrements des utilisateurs (Migration potentielle)
  userAccounts!: Table<UserAuth, string>; 

  constructor() {
    super('FluxFinanceDB'); 
    
    // Définition des schémas de table.
    // Clé primaire (PK) : 'id' (indexé)
    // Index secondaires : '&email' (unique), 'personId' (pour les transactions)
    this.version(1).stores({
      userAccounts: '&email, id', // Indexation des comptes utilisateur (si on migre AuthContext)
      transactions: 'id, personId, date', // Index pour les recherches courantes
      budgets: 'id',
      goals: 'id',
      people: 'id, circle',
      accounts: 'id',
      categories: 'id',
      rules: 'id',
    });
  }
}

export const db = new AppDB();

// Le Helper pour récupérer la DB par utilisateur devient une fonction utilitaire Dexie.
export function getDbTable(userId: string, table: keyof AppDB) {
  // IndexedDB est séparé par utilisateur au niveau du code de l'application (via des filtres)
  // Pour l'instant, nous utilisons une seule DB partagée.
  return db[table];
}