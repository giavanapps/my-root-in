import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const { frontImage, backImage, image, ingredientsText, manualBrand, manualName, manualType, texture, porosity, barcodeImage, barcode } = req.body;

  if (!frontImage && !backImage && !image && !ingredientsText && (!manualBrand || !manualName) && !barcodeImage && !barcode) {
    return res.status(400).json({ error: 'Aucune image, liste d\'ingrédients, ni informations de saisie manuelle fournies.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Clé API manquante.',
      details: 'La variable d\'environnement GEMINI_API_KEY n\'est pas configurée sur Vercel. Veuillez l\'ajouter dans Settings > Environment Variables.'
    });
  }

  try {
    let promptText = '';
    const parts: any[] = [];

    if (barcode) {
      // Option -1 : Barcode text lookup using Gemini knowledge base
      promptText = `Tu es un expert en cosmétologie capillaire et ingrédients INCI, spécialisé dans les cheveux afro et texturés (crépus, frisés, bouclés, ondulés, locksés).
On te fournit un code-barres EAN-13 : ${barcode}.
Si tu connais le produit capillaire exact correspondant à ce code-barres, reconstitue sa marque, son nom et sa liste d'ingrédients INCI officielle pour faire son analyse.

RÈGLES STRICTES DE CATÉGORISATION ET D'INTERDICTION CAPILLAIRE :
- Interdiction totale de conseiller d'utiliser un produit de type 'Gel', 'Gelée' ou 'Cire' pour un 'Bain d'huile' ou pour un 'Masque / Soin Profond', même si le produit contient des huiles dans ses ingrédients. Les gels sont formulés avec des agents fixants et gélifiants et ne sont techniquement pas adaptés aux soins profonds ou bains d'huiles.
- Pour un soin 'Bain d'huile', conseille exclusivement des huiles végétales pures, des beurres ou des sérums huileux.
- Pour un soin 'Masque / Soin Profond', conseille uniquement des masques capillaires spécifiques.
- Pour un soin 'Shampoing / Clarification', conseille uniquement des shampoings (avec ou sans sulfates) ou des argiles détox.
- Pour un soin 'Hydratation / Coiffage', conseille uniquement des leave-in, laits, crèmes, gels ou gelées.

Prends en compte le profil capillaire de l'utilisateur :
- Texture : ${texture || 'Crépus'}
- Porosité : ${porosity || 'Moyenne'}

Fournis ton analyse en français au format JSON STRICT avec cette structure exacte :
{
  "brand": "Marque détectée (ex: Cantu)",
  "name": "Nom du produit détecté (ex: Shea Butter Leave-in)",
  "score": 85, // Score de 0 à 100 indiquant la compatibilité exacte avec son profil (sois honnête et sévère s'il y a des ingrédients toxiques ou occlusifs inadaptés)
  "title": "Titre court de compatibilité (ex: Excellent pour ton profil ! 🌿)",
  "description": "Explication détaillée et personnalisée de ton avis en tant que coach capillaire IA, en expliquant spécifiquement pourquoi les ingrédients de ce produit conviennent ou non à sa porosité et sa texture. Adresse-toi directement à l'utilisateur de manière bienveillante. Mentionne au début que tu analyses ce produit via ta base de connaissances à partir de son code-barres.",
  "inciReport": {
    "good": ["Ingrédient 1 (Explication rapide de son effet bénéfique)", "Ingrédient 2 (Explication)"],
    "neutral": ["Ingrédient 1 (Explication)", "Ingrédient 2 (Explication)"],
    "avoid": ["Ingrédient 1 (Pourquoi l'éviter : ex: occlusif, cire minérale, sulfate décapant, alcool desséchant)", "Ingrédient 2 (Pourquoi l'éviter)"]
  }
}
Si tu ne connais pas du tout ce code-barres ou que ce n'est pas un produit capillaire, renvoie exactement cet objet JSON d'erreur :
{
  "error": "Produit inconnu dans notre base de connaissances."
}`;

      parts.push({ text: promptText });
    } else if (barcodeImage) {
      // Option 0 : Barcode image extraction (OCR)
      const base64Data = barcodeImage.replace(/^data:image\/\w+;base64,/, '');
      let mimeType = 'image/jpeg';
      const mimeMatch = barcodeImage.match(/^data:(image\/\w+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }

      promptText = `Tu es un assistant IA spécialisé dans la lecture optique et le décodage de codes-barres (OCR).
Analyse l'image fournie pour identifier le code-barres (généralement EAN-13, 13 chiffres imprimés sous les barres verticales) du produit capillaire.
Extrais les 13 chiffres du code-barres.
Fournis ta réponse en français au format JSON STRICT avec cette structure exacte :
{
  "barcode": "les 13 chiffres extraits sans aucun espace (ex: 3596710406087)"
}
Si aucun code-barres ou numéro de code-barres valide n'est visible sur la photo, renvoie une explication d'erreur sous ce format :
{
  "error": "Aucun code-barres lisible trouvé sur cette photo. Essaie de bien centrer le code-barres et d'éviter les reflets."
}`;

      parts.push({ text: promptText });
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    } else if (frontImage && backImage) {
      // Option 1 : Double-image scan (front + back)
      const base64Front = frontImage.replace(/^data:image\/\w+;base64,/, '');
      const base64Back = backImage.replace(/^data:image\/\w+;base64,/, '');

      let mimeTypeFront = 'image/jpeg';
      const mimeMatchFront = frontImage.match(/^data:(image\/\w+);base64,/);
      if (mimeMatchFront) {
        mimeTypeFront = mimeMatchFront[1];
      }

      let mimeTypeBack = 'image/jpeg';
      const mimeMatchBack = backImage.match(/^data:(image\/\w+);base64,/);
      if (mimeMatchBack) {
        mimeTypeBack = mimeMatchBack[1];
      }

      promptText = `Tu es un expert en cosmétologie capillaire et ingrédients INCI, spécialisé dans les cheveux afro et texturés (crépus, frisés, bouclés, ondulés, locksés). 
On te fournit deux images d'un produit capillaire :
- L'Image 1 montre le DEVANT (le recto) du produit.
- L'Image 2 montre le DOS (le verso) avec la liste des ingrédients INCI.

RÈGLES STRICTES DE CATÉGORISATION ET D'INTERDICTION CAPILLAIRE :
- Interdiction totale de conseiller d'utiliser un produit de type 'Gel', 'Gelée' ou 'Cire' pour un 'Bain d'huile' ou pour un 'Masque / Soin Profond', même si le produit contient des huiles dans ses ingrédients. Les gels sont formulés avec des agents fixants et gélifiants et ne sont techniquement pas adaptés aux soins profonds ou bains d'huiles.
- Pour un soin 'Bain d'huile', conseille exclusivement des huiles végétales pures, des beurres ou des sérums huileux.
- Pour un soin 'Masque / Soin Profond', conseille uniquement des masques capillaires spécifiques.
- Pour un soin 'Shampoing / Clarification', conseille uniquement des shampoings (avec ou sans sulfates) ou des argiles détox.
- Pour un soin 'Hydratation / Coiffage', conseille uniquement des leave-in, laits, crèmes, gels ou gelées.

Analyse l'Image 1 pour extraire la Marque et le Nom exact du produit, puis analyse l'Image 2 (la liste INCI) pour exécuter les 4 fonctions Premium (Analyse, Ajout Salle de Bain, Comparateur, Dupe DIY).

Prends en compte le profil capillaire de l'utilisateur :
- Texture : ${texture || 'Crépus'}
- Porosité : ${porosity || 'Moyenne'}

Fournis ton analyse en français au format JSON STRICT avec cette structure exacte :
{
  "brand": "Marque exacte extraite de l'Image 1 (ex: Cantu)",
  "name": "Nom exact du produit extrait de l'Image 1 (ex: Shea Butter Hydrating Conditioner)",
  "score": 85, // Score de 0 à 100 indiquant la compatibilité exacte avec son profil (sois honnête et sévère s'il y a des ingrédients toxiques ou occlusifs inadaptés)
  "title": "Titre court de compatibilité (ex: Excellent pour ton profil ! 🌿)",
  "description": "Explication détaillée et personnalisée de ton avis en tant que coach capillaire IA, en expliquant spécifiquement pourquoi les ingrédients conviennent ou non à sa porosité et sa texture. Adresse-toi directement à l'utilisateur de manière bienveillante.",
  "inciReport": {
    "good": ["Ingrédient 1 (Explication rapide de son effet bénéfique)", "Ingrédient 2 (Explication)"],
    "neutral": ["Ingrédient 1 (Explication)", "Ingrédient 2 (Explication)"],
    "avoid": ["Ingrédient 1 (Pourquoi l'éviter : ex: occlusif, cire minérale, sulfate décapant, alcool desséchant)", "Ingrédient 2 (Pourquoi l'éviter)"]
  }
}`;

      parts.push({ text: promptText });
      parts.push({
        inlineData: {
          mimeType: mimeTypeFront,
          data: base64Front
        }
      });
      parts.push({
        inlineData: {
          mimeType: mimeTypeBack,
          data: base64Back
        }
      });
    } else if (image) {
      // Option 2 : Single Image-based scan
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      let mimeType = 'image/jpeg';
      const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }

      promptText = `Tu es un expert en cosmétologie capillaire et ingrédients INCI, spécialisé dans les cheveux afro et texturés (crépus, frisés, bouclés, ondulés, locksés). Analyse cette photo qui montre la liste des ingrédients d'un produit capillaire.

RÈGLES STRICTES DE CATÉGORISATION ET D'INTERDICTION CAPILLAIRE :
- Interdiction totale de conseiller d'utiliser un produit de type 'Gel', 'Gelée' ou 'Cire' pour un 'Bain d'huile' ou pour un 'Masque / Soin Profond', même si le produit contient des huiles dans ses ingrédients. Les gels sont formulés avec des agents fixants et gélifiants et ne sont techniquement pas adaptés aux soins profonds ou bains d'huiles.
- Pour un soin 'Bain d'huile', conseille exclusivement des huiles végétales pures, des beurres ou des sérums huileux.
- Pour un soin 'Masque / Soin Profond', conseille uniquement des masques capillaires spécifiques.
- Pour un soin 'Shampoing / Clarification', conseille uniquement des shampoings (avec ou sans sulfates) ou des argiles détox.
- Pour un soin 'Hydratation / Coiffage', conseille uniquement des leave-in, laits, crèmes, gels ou gelées.

Prends en compte le profil capillaire de l'utilisateur :
- Texture : ${texture || 'Crépus'}
- Porosité : ${porosity || 'Moyenne'}

Fournis ton analyse en français au format JSON STRICT avec cette structure exacte :
{
  "brand": "Marque détectée (ex: Shea Moisture)",
  "name": "Nom du produit détecté",
  "score": 85, // Score de 0 à 100 indiquant la compatibilité exacte avec son profil (sois honnête et sévère s'il y a des ingrédients toxiques ou occlusifs inadaptés)
  "title": "Titre court de compatibilité (ex: Excellent pour ton profil ! 🌿)",
  "description": "Explication détaillée et personnalisée de ton avis en tant que coach capillaire IA, en expliquant spécifiquement pourquoi les ingrédients conviennent ou non à sa porosité et sa texture. Adresse-toi directement à l'utilisateur de manière bienveillante.",
  "inciReport": {
    "good": ["Ingrédient 1 (Explication rapide de son effet bénéfique)", "Ingrédient 2 (Explication)"],
    "neutral": ["Ingrédient 1 (Explication)", "Ingrédient 2 (Explication)"],
    "avoid": ["Ingrédient 1 (Pourquoi l'éviter : ex: occlusif, cire minérale, sulfate décapant, alcool desséchant)", "Ingrédient 2 (Pourquoi l'éviter)"]
  }
}`;

      parts.push({ text: promptText });
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    } else if (ingredientsText) {
      // Option 2 : Text-based scan (from barcode lookup)
      promptText = `Tu es un expert en cosmétologie capillaire et ingrédients INCI, spécialisé dans les cheveux afro et texturés (crépus, frisés, bouclés, ondulés, locksés). Analyse cette liste d'ingrédients d'un produit capillaire.

RÈGLES STRICTES DE CATÉGORISATION ET D'INTERDICTION CAPILLAIRE :
- Interdiction totale de conseiller d'utiliser un produit de type 'Gel', 'Gelée' ou 'Cire' pour un 'Bain d'huile' ou pour un 'Masque / Soin Profond', même si le produit contient des huiles dans ses ingrédients. Les gels sont formulés avec des agents fixants et gélifiants et ne sont techniquement pas adaptés aux soins profonds ou bains d'huiles.
- Pour un soin 'Bain d'huile', conseille exclusivement des huiles végétales pures, des beurres ou des sérums huileux.
- Pour un soin 'Masque / Soin Profond', conseille uniquement des masques capillaires spécifiques.
- Pour un soin 'Shampoing / Clarification', conseille uniquement des shampoings (avec ou sans sulfates) ou des argiles détox.
- Pour un soin 'Hydratation / Coiffage', conseille uniquement des leave-in, laits, crèmes, gels ou gelées.

Liste des ingrédients :
${ingredientsText}

Prends en compte le profil capillaire de l'utilisateur :
- Texture : ${texture || 'Crépus'}
- Porosité : ${porosity || 'Moyenne'}

Fournis ton analyse en français au format JSON STRICT avec cette structure exacte :
{
  "brand": "Marque détectée (ex: Shea Moisture)",
  "name": "Nom du produit détecté",
  "score": 85, // Score de 0 à 100 indiquant la compatibilité exacte avec son profil (sois honnête et sévère s'il y a des ingrédients toxiques ou occlusifs inadaptés)
  "title": "Titre court de compatibilité (ex: Excellent pour ton profil ! 🌿)",
  "description": "Explication détaillée et personnalisée de ton avis en tant que coach capillaire IA, en expliquant spécifiquement pourquoi les ingrédients conviennent ou non à sa porosité et sa texture. Adresse-toi directement à l'utilisateur de manière bienveillante.",
  "inciReport": {
    "good": ["Ingrédient 1 (Explication rapide de son effet bénéfique)", "Ingrédient 2 (Explication)"],
    "neutral": ["Ingrédient 1 (Explication)", "Ingrédient 2 (Explication)"],
    "avoid": ["Ingrédient 1 (Pourquoi l'éviter : ex: occlusif, cire minérale, sulfate décapant, alcool desséchant)", "Ingrédient 2 (Pourquoi l'éviter)"]
  }
}`;

      parts.push({ text: promptText });
    } else {
      // Option 3 : Manual Express Entry Search
      promptText = `Tu es un expert en cosmétologie capillaire et ingrédients INCI, spécialisé dans les cheveux afro et texturés (crépus, frisés, bouclés, ondulés, locksés). L'utilisateur a fait une saisie manuelle car le scan de son produit a échoué.

RÈGLES STRICTES DE CATÉGORISATION ET D'INTERDICTION CAPILLAIRE :
- Interdiction totale de conseiller d'utiliser un produit de type 'Gel', 'Gelée' ou 'Cire' pour un 'Bain d'huile' ou pour un 'Masque / Soin Profond', même si le produit contient des huiles dans ses ingrédients. Les gels sont formulés avec des agents fixants et gélifiants et ne sont techniquement pas adaptés aux soins profonds ou bains d'huiles.
- Pour un soin 'Bain d'huile', conseille exclusivement des huiles végétales pures, des beurres ou des sérums huileux.
- Pour un soin 'Masque / Soin Profond', conseille uniquement des masques capillaires spécifiques.
- Pour un soin 'Shampoing / Clarification', conseille uniquement des shampoings (avec ou sans sulfates) ou des argiles détox.
- Pour un soin 'Hydratation / Coiffage', conseille uniquement des leave-in, laits, crèmes, gels ou gelées.
      
Produit saisi à la main :
- Marque : ${manualBrand}
- Nom du produit : ${manualName}
- Type de produit : ${manualType || 'Non spécifié'}

Utilise ta propre base de connaissances sur ce produit exact. Si tu connais ce produit, reconstitue mentalement sa liste d'ingrédients INCI officielle. Si c'est un produit générique ou peu connu, imagine la liste d'ingrédients la plus probable pour ce type de produit de cette marque.

Prends en compte le profil capillaire de l'utilisateur :
- Texture : ${texture || 'Crépus'}
- Porosité : ${porosity || 'Moyenne'}

Fournis ton analyse en français au format JSON STRICT avec cette structure exacte :
{
  "brand": "${manualBrand}",
  "name": "${manualName}",
  "score": 85, // Score de 0 à 100 indiquant la compatibilité exacte avec son profil (sois honnête et sévère s'il y a des ingrédients toxiques ou occlusifs inadaptés)
  "title": "Titre court de compatibilité (ex: Excellent pour ton profil ! 🌿)",
  "description": "Explication détaillée et personnalisée de ton avis en tant que coach capillaire IA, en expliquant spécifiquement pourquoi les ingrédients de ce produit conviennent ou non à sa porosité et sa texture. Adresse-toi directement à l'utilisateur de manière bienveillante. Mentionne au début que tu analyses ce produit via ta base de connaissances.",
  "inciReport": {
    "good": ["Ingrédient 1 (Explication rapide de son effet bénéfique)", "Ingrédient 2 (Explication)"],
    "neutral": ["Ingrédient 1 (Explication)", "Ingrédient 2 (Explication)"],
    "avoid": ["Ingrédient 1 (Pourquoi l'éviter : ex: occlusif, cire minérale, sulfate décapant, alcool desséchant)", "Ingrédient 2 (Pourquoi l'éviter)"]
  }
}`;

      parts.push({ text: promptText });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract JSON response text from Gemini
    const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!geminiText) {
      throw new Error("L'IA n'a pas renvoyé de texte d'analyse.");
    }

    // Parse the JSON returned by Gemini
    const parsedAnalysis = JSON.parse(geminiText.trim());

    return res.status(200).json(parsedAnalysis);

  } catch (error: any) {
    console.error('Scanner Error:', error);
    return res.status(500).json({
      error: 'Erreur lors de l\'analyse du produit.',
      details: error.message || error
    });
  }
}
