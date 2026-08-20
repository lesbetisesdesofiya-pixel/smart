/**
 * Normalise un numéro de téléphone pour la comparaison
 * Supprime espaces, tirets, parenthèses, +
 * Gère les préfixes pays
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';

  // Supprimer tout sauf les chiffres
  const digits = phone.replace(/[^0-9]/g, '');

  if (!digits) return '';

  // Préfixes pays courants en Afrique de l'Ouest
  const countryPrefixes = [
    '225', // Côte d'Ivoire
    '228', // Togo
    '229', // Bénin
    '233', // Ghana
    '226', // Burkina Faso
    '227', // Niger
    '234', // Nigeria
    '221', // Sénégal
    '223', // Mali
    '241', // Gabon
    '237', // Cameroun
    '243', // RD Congo
    '242', // Congo
    '236', // Centrafrique
    '235', // Tchad
    '1',   // USA/Canada
    '33',  // France
    '44',  // UK
    '49',  // Allemagne
  ];

  // Essayer de détecter le préfixe pays
  for (const prefix of countryPrefixes) {
    if (digits.startsWith(prefix) && digits.length > prefix.length + 4) {
      return digits.slice(prefix.length);
    }
  }

  // Si le numéro commence par 0, le supprimer
  if (digits.startsWith('0')) {
    return digits.replace(/^0+/, '');
  }

  return digits;
}

/**
 * Vérifie si un numéro saisi correspond à un numéro enregistré
 */
export function phoneMatches(input: string, stored: string): boolean {
  if (!input || !stored) return false;

  // Nettoyer les deux numéros
  const cleanInput = input.replace(/[^0-9]/g, '');
  const cleanStored = stored.replace(/[^0-9]/g, '');

  // Comparaison directe après nettoyage
  if (cleanInput === cleanStored) return true;

  // Normaliser les deux
  const normInput = normalizePhone(input);
  const normStored = normalizePhone(stored);

  if (normInput === normStored) return true;

  // Si l'un commence par 0 et l'autre non
  const inputNoZero = cleanInput.replace(/^0+/, '');
  const storedNoZero = cleanStored.replace(/^0+/, '');

  if (inputNoZero === storedNoZero) return true;

  // Dernier essai : comparer les 8 derniers chiffres
  if (cleanInput.length >= 8 && cleanStored.length >= 8) {
    const inputLast8 = cleanInput.slice(-8);
    const storedLast8 = cleanStored.slice(-8);
    if (inputLast8 === storedLast8) return true;
  }

  return false;
}
