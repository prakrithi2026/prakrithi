/**
 * Utility to parse, compare, and sort weight and quantity strings.
 * Supports:
 * - Grams: '50g', '50gm', '200g', '300gm', '500gm'
 * - Kilograms: '1kg', '2kg', '2.5kg'
 * - Milliliters: '50ml', '100ml', '500ml'
 * - Liters: '1L', '2L', '5L'
 * - Packs: 'Pack of 1', 'Pack of 2', 'Pack of 4'
 * - Numbers: '50', '100', '200'
 */

export function parseWeightValue(raw) {
  if (!raw) return { value: Infinity, unit: '', raw: '' };
  const str = String(raw).trim().toLowerCase();

  // 1. Pack of X
  const packMatch = str.match(/pack\s*(?:of)?\s*(\d+(?:\.\d+)?)/i);
  if (packMatch) {
    return { value: parseFloat(packMatch[1]) * 100000, unit: 'pack', raw };
  }

  // 2. Kilograms (kg, kgs, kilo, kilogram, kilograms)
  const kgMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|kilogram|kilograms)\b/i);
  if (kgMatch) {
    return { value: parseFloat(kgMatch[1]) * 1000, unit: 'g', raw };
  }

  // 3. Grams (gm, gms, gram, grams, or standalone g)
  const gMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:gm|gms|gram|grams)\b/i) || str.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  if (gMatch) {
    return { value: parseFloat(gMatch[1]), unit: 'g', raw };
  }

  // 4. Liters (l, ltr, litre, litres, liter, liters)
  const lMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:ltr|litre|litres|liter|liters)\b/i) || str.match(/(\d+(?:\.\d+)?)\s*l\b/i);
  if (lMatch) {
    return { value: parseFloat(lMatch[1]) * 1000, unit: 'ml', raw };
  }

  // 5. Milliliters (ml, mls, millilitre, milliliters)
  const mlMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:ml|mls|millilitre|milliliters)\b/i);
  if (mlMatch) {
    return { value: parseFloat(mlMatch[1]), unit: 'ml', raw };
  }

  // 6. Milligrams (mg, mgs)
  const mgMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:mg|mgs)\b/i);
  if (mgMatch) {
    return { value: parseFloat(mgMatch[1]) * 0.001, unit: 'g', raw };
  }

  // 7. General number (e.g. '50', '200')
  const numMatch = str.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return { value: parseFloat(numMatch[1]), unit: 'num', raw };
  }

  return { value: Infinity, unit: 'other', raw };
}

export function compareWeightVariants(a, b) {
  const labelA = (typeof a === 'string' ? a : (a?.label || a?.weight || a?.name || '')).trim();
  const labelB = (typeof b === 'string' ? b : (b?.label || b?.weight || b?.name || '')).trim();

  const parsedA = parseWeightValue(labelA);
  const parsedB = parseWeightValue(labelB);

  if (parsedA.value !== parsedB.value) {
    return parsedA.value - parsedB.value;
  }

  return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortVariantsByWeight(variants) {
  if (!Array.isArray(variants)) return [];
  const sorted = [...variants].sort(compareWeightVariants);
  const hasDefault = sorted.some(v => v.isDefault);
  if (!hasDefault && sorted.length > 0) {
    sorted[0].isDefault = true;
  }
  return sorted;
}
