<?php

namespace App\Services;

class PhoneNormalizer
{
    /**
     * Normalise un numéro de téléphone pour la comparaison
     * Supprime espaces, tirets, parenthèses, +
     * Gère les préfixes pays
     */
    public static function normalize(?string $phone): string
    {
        if (empty($phone)) {
            return '';
        }

        // Supprimer tout sauf les chiffres
        $digits = preg_replace('/[^0-9]/', '', $phone);

        // Si vide après nettoyage
        if (empty($digits)) {
            return '';
        }

        // Préfixes pays courants en Afrique de l'Ouest
        $countryPrefixes = [
            '225' => 'CI', // Côte d'Ivoire
            '228' => 'TG', // Togo
            '229' => 'BJ', // Bénin
            '233' => 'GH', // Ghana
            '226' => 'BF', // Burkina Faso
            '227' => 'NE', // Niger
            '234' => 'NG', // Nigeria
            '221' => 'SN', // Sénégal
            '223' => 'ML', // Mali
            '241' => 'GA', // Gabon
            '237' => 'CM', // Cameroun
            '243' => 'CD', // RD Congo
            '242' => 'CG', // Congo
            '236' => 'CF', // Centrafrique
            '235' => 'TD', // Tchad
            '240' => 'GQ', // Guinée Équatoriale
            '245' => 'GW', // Guinée-Bissau
            '238' => 'CV', // Cap-Vert
            '239' => 'ST', // São Tomé
            '244' => 'AO', // Angola
            '258' => 'MZ', // Mozambique
            '255' => 'TZ', // Tanzanie
            '254' => 'KE', // Kenya
            '256' => 'UG', // Ouganda
            '250' => 'RW', // Rwanda
            '257' => 'BI', // Burundi
            '246' => 'IO', // Diego Garcia
            '1' => 'US',   // USA/Canada
            '33' => 'FR',  // France
            '44' => 'GB',  // UK
            '49' => 'DE',  // Allemagne
            '34' => 'ES',  // Espagne
            '39' => 'IT',  // Italie
            '31' => 'NL',  // Pays-Bas
            '32' => 'BE',  // Belgique
            '41' => 'CH',  // Suisse
        ];

        // Essayer de détecter le préfixe pays
        foreach ($countryPrefixes as $prefix => $country) {
            if (str_starts_with($digits, $prefix) && strlen($digits) > strlen($prefix) + 4) {
                // Retourner le numéro sans le préfixe pays
                return substr($digits, strlen($prefix));
            }
        }

        // Si le numéro commence par 0, le supprimer
        if (str_starts_with($digits, '0')) {
            $digits = ltrim($digits, '0');
        }

        return $digits;
    }

    /**
     * Compare deux numéros de téléphone normalisés
     */
    public static function matches(?string $phone1, ?string $phone2): bool
    {
        $norm1 = self::normalize($phone1);
        $norm2 = self::normalize($phone2);

        if (empty($norm1) || empty($norm2)) {
            return false;
        }

        return $norm1 === $norm2;
    }

    /**
     * Vérifie si un numéro saisi correspond à un numéro enregistré
     * Gère les cas où l'un a le préfixe pays et l'autre non
     */
    public static function userInputMatches(?string $input, ?string $stored): bool
    {
        if (empty($input) || empty($stored)) {
            return false;
        }

        // Nettoyer les deux numéros
        $cleanInput = preg_replace('/[^0-9]/', '', $input);
        $cleanStored = preg_replace('/[^0-9]/', '', $stored);

        // Comparaison directe après nettoyage
        if ($cleanInput === $cleanStored) {
            return true;
        }

        // Normaliser les deux
        $normInput = self::normalize($input);
        $normStored = self::normalize($stored);

        if ($normInput === $normStored) {
            return true;
        }

        // Si l'un commence par 0 et l'autre non
        $inputNoZero = ltrim($cleanInput, '0');
        $storedNoZero = ltrim($cleanStored, '0');

        if ($inputNoZero === $storedNoZero) {
            return true;
        }

        // Dernier essai : comparer les 8 derniers chiffres
        if (strlen($cleanInput) >= 8 && strlen($cleanStored) >= 8) {
            $inputLast8 = substr($cleanInput, -8);
            $storedLast8 = substr($cleanStored, -8);
            if ($inputLast8 === $storedLast8) {
                return true;
            }
        }

        return false;
    }
}
