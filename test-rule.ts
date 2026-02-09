/**
 * 🕵️ SCRIPT DE DIAGNOSTIC - RULE ENGINE
 * À exécuter pour comprendre pourquoi une sous-catégorie ne matche pas.
 */

export function diagnosticRuleMatch(rule: any, transactions: any[]) {
    console.group("🔍 DIAGNOSTIC DE RÈGLE");
    console.log("Règle analysée :", rule.name);
    console.log("Cible de la règle (Catégorie) :", rule.conditions?.category);
  
    // 1. Vérifier si la règle est bien configurée
    if (!rule.conditions?.category) {
      console.error("❌ ERREUR : La règle n'a aucune catégorie définie dans ses conditions.");
      console.groupEnd();
      return;
    }
  
    // 2. Analyser les transactions
    const sampleTransactions = transactions.slice(0, 100); // On regarde les 100 premières
    let analyzedCount = 0;
    let partialMatches = [];
  
    console.log(`Analyse de ${sampleTransactions.length} transactions...`);
  
    sampleTransactions.forEach((t) => {
      const tCat = t.category || "AUCUNE";
      
      // Test d'égalité exacte
      const exactMatch = String(tCat).toLowerCase() === String(rule.conditions.category).toLowerCase();
      
      // Test d'inclusion (ce que fait ton ruleEngine)
      const inclusionMatch = String(tCat).toLowerCase().includes(String(rule.conditions.category).toLowerCase());
  
      if (exactMatch || inclusionMatch) {
        analyzedCount++;
        partialMatches.push({
          description: t.description,
          transactionCategory: tCat,
          ruleCategory: rule.conditions.category,
          matchType: exactMatch ? "EXACT ✅" : "INCLUSION ⚠️"
        });
      }
    });
  
    if (analyzedCount > 0) {
      console.table(partialMatches);
      console.log(`✅ Succès : ${analyzedCount} transactions auraient dû matcher.`);
    } else {
      console.warn("❌ ÉCHEC : Aucune transaction ne correspond au texte de la règle.");
      
      // 3. Analyse de structure (le coupable probable)
      console.group("Analyse de structure des données");
      const firstTx = transactions[0];
      console.log("Structure d'une transaction type :", {
        id: typeof firstTx?.id,
        category: typeof firstTx?.category, // Est-ce un string ou un objet ?
        subCategory: typeof firstTx?.subCategory,
        valeur_exemple: firstTx?.category
      });
      console.log("Structure de la condition de règle :", {
        category: typeof rule.conditions.category,
        valeur: rule.conditions.category
      });
      console.groupEnd();
    }
  
    console.groupEnd();
  }