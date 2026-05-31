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

  const { image, ingredientsText, texture, porosity } = req.body;

  if (!image && !ingredientsText) {
    return res.status(400).json({ error: 'Aucune image ni liste d\'ingrédients fournie.' });
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

    if (image) {
      // Option 1 : Image-based scan
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      let mimeType = 'image/jpeg';
      const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }

      promptText = `Tu es un expert en cosmétologie capillaire et ingrédients INCI, spécialisé dans les cheveux afro et texturés (crépus, frisés, bouclés, ondulés, locksés). Analyse cette photo qui montre la liste des ingrédients d'un produit capillaire.

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
    } else {
      // Option 2 : Text-based scan (from barcode lookup)
      promptText = `Tu es un expert en cosmétologie capillaire et ingrédients INCI, spécialisé dans les cheveux afro et texturés (crépus, frisés, bouclés, ondulés, locksés). Analyse cette liste d'ingrédients d'un produit capillaire.

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
