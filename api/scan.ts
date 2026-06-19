// ─── Vercel Edge Runtime ─────────────────────────────────────────────────────
// Edge Runtime has NO 10s timeout (unlike Serverless on Hobby plan).
// It uses Web APIs only (fetch, Request, Response) — no Node.js imports.
// ─────────────────────────────────────────────────────────────────────────────
export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,PATCH,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Requested-With',
  'Content-Type': 'application/json',
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Méthode non autorisée. Utilisez POST.' }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête JSON invalide.' }, 400);
  }

  const {
    frontImage, backImage, image, ingredientsText,
    manualBrand, manualName, manualType,
    texture, porosity, thickness, barcodeImage, barcode,
    checkCompatibilityOnly
  } = body;

  if (!frontImage && !backImage && !image && !ingredientsText &&
      (!manualBrand || !manualName) && !barcodeImage && !barcode) {
    return json({ error: 'Aucune donnée fournie.' }, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({
      error: 'Clé API manquante.',
      details: 'GEMINI_API_KEY non configurée dans Vercel Settings > Environment Variables.'
    }, 500);
  }

  try {
    const parts: any[] = [];
    let promptText = '';

    // ── Option 1 : Barcode text lookup ───────────────────────────────────────
    if (barcode) {
      promptText = `Tu es un expert INCI capillaire (cheveux afro/texturés). Code-barres EAN-13 reçu : ${barcode}
Profil utilisateur : Texture ${texture || 'Crépus'}, Porosité ${porosity || 'Moyenne'}

Si ce code-barres correspond à un produit capillaire que tu connais ou peux identifier (même avec une confiance moyenne ≥50%), retourne :
{"recognized":true,"brand":"Marque exacte ou estimée","name":"Nom exact ou estimé","score":75,"title":"Titre court 🌿","description":"Analyse personnalisée détaillée (au moins 4 à 8 lignes) expliquant pourquoi le produit convient ou pas et décrivant ses effets.","estimatedPrice":12.99,"inciReport":{"good":["Ingrédient (bénéfice)"],"neutral":["Ingrédient"],"avoid":["Ingrédient (risque)"]}}
Dans tous les autres cas (produit clairement non capillaire ou code-barres totalement non identifiable après recherche) retourne UNIQUEMENT :
{"recognized":false,"reason":"unknown_barcode"}`;
      parts.push({ text: promptText });

    // ── Option 2 : Barcode image (OCR) ───────────────────────────────────────
    } else if (barcodeImage) {
      const base64Data = barcodeImage.replace(/^data:image\/\w+;base64,/, '');
      const mimeMatch = barcodeImage.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      promptText = `Extrais le code-barres EAN-13 (13 chiffres) de cette image.
Réponds UNIQUEMENT en JSON : {"barcode":"les13chiffres"}
Si illisible : {"error":"Aucun code-barres lisible."}`;
      parts.push({ text: promptText });
      parts.push({ inlineData: { mimeType, data: base64Data } });

    // ── Option 3 : Double photo (front + back) ───────────────────────────────
    } else if (frontImage && backImage) {
      const base64Front = frontImage.replace(/^data:image\/\w+;base64,/, '');
      const base64Back  = backImage.replace(/^data:image\/\w+;base64,/, '');
      const mimeFront = (frontImage.match(/^data:(image\/\w+);base64,/) || [])[1] || 'image/jpeg';
      const mimeBack  = (backImage.match(/^data:(image\/\w+);base64,/)  || [])[1] || 'image/jpeg';

      promptText = `Tu es un expert INCI capillaire (cheveux afro/texturés).
Image 1 = recto du produit. Image 2 = verso avec la liste INCI.
Profil utilisateur : Texture ${texture || 'Crépus'}, Porosité ${porosity || 'Moyenne'}

- Si la liste INCI au dos est complètement floue et totalement illisible (impossible de lire les ingrédients) → retourne UNIQUEMENT : {"recognized":false,"reason":"blurry"}
- Si le produit n'est clairement PAS un produit capillaire → retourne UNIQUEMENT : {"recognized":false,"reason":"not_hair"}
- Si la liste INCI est déchiffrable (même partiellement), effectue l'analyse. Si la marque ou le nom exact n'est pas clairement visible, essaie de le déduire ou utilise "Marque Inconnue" et "Produit Capillaire" au lieu de rejeter le produit. Retourne :
{"recognized":true,"brand":"Marque lue ou déduite","name":"Nom lu ou déduit","score":75,"title":"Titre court 🌿","description":"Analyse personnalisée détaillée (au moins 4 à 8 lignes) expliquant pourquoi le produit convient ou pas et décrivant ses effets.","estimatedPrice":12.99,"inciReport":{"good":["Ingrédient (bénéfice)"],"neutral":["Ingrédient"],"avoid":["Ingrédient (risque)"]}}
Réponds UNIQUEMENT en JSON valide (sans markdown).`;
      parts.push({ text: promptText });
      parts.push({ inlineData: { mimeType: mimeFront, data: base64Front } });
      parts.push({ inlineData: { mimeType: mimeBack,  data: base64Back  } });

    // ── Option 4 : Single image ───────────────────────────────────────────────
    } else if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      promptText = `Tu es un expert INCI capillaire (cheveux afro/texturés). Photo de la liste INCI d'un produit.
Profil utilisateur : Texture ${texture || 'Crépus'}, Porosité ${porosity || 'Moyenne'}

- Si l'image de la liste INCI est complètement floue et totalement illisible → retourne UNIQUEMENT : {"recognized":false,"reason":"blurry"}
- S'il ne s'agit pas du tout d'ingrédients cosmétiques ou si le produit n'est clairement pas capillaire → retourne UNIQUEMENT : {"recognized":false,"reason":"not_hair"}
- Si la liste INCI est déchiffrable, effectue l'analyse de compatibilité avec les ingrédients identifiables. Si la marque ou le nom du produit ne figurent pas sur l'image, utilise "Marque non identifiée" et "Produit scanné" au lieu de rejeter le produit. Retourne :
{"recognized":true,"brand":"Marque lue ou \"Marque non identifiée\"","name":"Nom lu ou \"Produit scanné\"","score":75,"title":"Titre court 🌿","description":"Analyse personnalisée détaillée (au moins 4 à 8 lignes) expliquant la compatibilité avec le profil et décrivant ses effets.","estimatedPrice":12.99,"inciReport":{"good":["Ingrédient (bénéfice)"],"neutral":["Ingrédient"],"avoid":["Ingrédient (risque)"]}}
Réponds UNIQUEMENT en JSON valide (sans markdown).`;
      parts.push({ text: promptText });
      parts.push({ inlineData: { mimeType, data: base64Data } });

    // ── Option 5 : Ingredients text (from barcode lookup) ────────────────────
    } else if (ingredientsText) {
      promptText = `Expert INCI capillaire (cheveux afro/texturés).
Liste INCI : ${ingredientsText}
Profil : Texture ${texture || 'Crépus'}, Porosité ${porosity || 'Moyenne'}

Réponds UNIQUEMENT en JSON valide (sans markdown) :
{"brand":"Marque","name":"Nom","score":75,"title":"Titre court 🌿","description":"Analyse personnalisée détaillée (au moins 4 à 8 lignes) expliquant la compatibilité avec le profil et l'intérêt ou le risque des ingrédients.","estimatedPrice":12.99,"inciReport":{"good":["Ingrédient (bénéfice)"],"neutral":["Ingrédient"],"avoid":["Ingrédient (risque)"]}}`;
      parts.push({ text: promptText });

    // ── Option 6 : Compatibility Check Only ───────────────────────────────────
    } else if (checkCompatibilityOnly) {
      promptText = `Tu es un expert capillaire spécialisé dans les cheveux afro/texturés.
Analyse la compatibilité du produit suivant avec le profil de l'utilisateur.

Produit :
- Marque : ${manualBrand}
- Nom : ${manualName}
- Type de produit : ${manualType || 'Non spécifié'}

Profil de l'utilisateur :
- Texture : ${texture || 'Crépus'}
- Épaisseur : ${thickness || 'Moyens'}
- Porosité : ${porosity || 'Moyenne'}

Analyse ce produit en te basant sur tes connaissances générales des ingrédients et formulations de ce type de produit.
Règles importantes d'ingrédients à respecter pour l'analyse :
- Si la porosité est 'faible' : les huiles lourdes comme le Karité brut ou le Coco, et les protéines lourdes peuvent saturer sans pénétrer.
- Si l'épaisseur est 'fins' : les beurres lourds (Karité, Avocat) et l'huile de Ricin en sans rinçage alourdissent le cheveu.
- Si la texture est 'Locksés' : pas de corps gras solides, de beurres (Karité, Coco, etc.) ni de cire d'abeille (risque de résidus incrustés). Préférer les sprays légers et huiles très fluides.

Règles de réponse :
Tu dois obligatoirement renvoyer un objet JSON valide contenant EXACTEMENT ces trois clés :
1. "isCompatible" : un booléen (true ou false) indiquant si le produit convient à ce profil.
2. "status" : une chaîne de caractères valant soit "Compatible", soit "Attention".
3. "explanation" : une seule phrase courte et ultra-personnalisée expliquant pourquoi (par exemple : "Ce shampoing Cantu est idéal pour tes cheveux crépus car il est sans sulfates, mais attention sa texture crème peut être un peu lourde si tes cheveux sont très fins.").

Réponds UNIQUEMENT avec l'objet JSON (sans markdown, sans enrobage, juste le JSON).`;
      parts.push({ text: promptText });

    // ── Option 7 : Saisie Express — Détection Ingrédients (score calculé côté serveur) ──
    } else {
      promptText = `Tu es Root'In Coach, expert capillaire spécialisé dans les cheveux afro-texturés.
Tu as une connaissance encyclopédique des formules de produits capillaires du marché mondial.

PRODUIT À ANALYSER :
Marque : ${manualBrand}
Nom : ${manualName}
Type : ${manualType || 'Non spécifié'}

PROFIL :
Texture : ${texture || 'Crépus'} | Porosité : ${porosity || 'Moyenne'} | Épaisseur : ${thickness || 'Moyens'}

════════════════════════════════════════
TA MISSION (en 2 parties)
════════════════════════════════════════

PARTIE 1 — DÉTECTION D'INGRÉDIENTS (répondre uniquement true ou false)
Indique la PRÉSENCE ou ABSENCE de ces familles d'ingrédients dans ce produit :

"hasSulfates"      → true si le produit contient du SLS (Sodium Lauryl Sulfate), SLES (Sodium Laureth Sulfate) ou Ammonium Lauryl Sulfate
"hasSilicones"     → true si le produit contient du Dimethicone, Cyclopentasiloxane ou Amodimethicone
"hasDryingAlcohol" → true si le produit contient du Alcohol Denat, Isopropyl Alcohol ou Ethanol (alcools courts asséchants)
"hasNourishing"    → true si le produit contient du Beurre de Karité (Shea Butter), Huile de Ricin (Castor Oil) ou Huile d'Avocat (Persea Gratissima)
"hasLightHydration"→ true si le produit contient du Gel d'Aloe Vera, Huile de Jojoba (Simmondsia Chinensis) ou Glycérine

PARTIE 2 — RAPPORT EXPERT (texte libre)
Rédige un rapport précis sur CE produit pour CE profil. NE PAS inventer d'ingrédients.

════════════════════════════════════════
FORMAT JSON STRICT (aucun texte autour)
════════════════════════════════════════
{
  "hasSulfates": true,
  "hasSilicones": false,
  "hasDryingAlcohol": false,
  "hasNourishing": false,
  "hasLightHydration": false,
  "mainIngredients": ["Ingrédient réel (effet pour la texture ${texture || 'Crépus'})", "..."],
  "coachAdvice": "Paragraphe de 5-8 lignes spécifique à CE produit et CE profil. Explique les risques et bénéfices concrets.",
  "pointsOfVigilance": "Avertissement expert sur les ingrédients problématiques détectés. Sois précis et actionnable.",
  "brand": "${manualBrand}",
  "name": "${manualName}",
  "estimatedPrice": 0.0,
  "inciReport": {
    "good": ["Ingrédient bénéfique (raison)"],
    "neutral": ["Ingrédient neutre"],
    "avoid": ["Ingrédient problématique (risque spécifique pour ce profil)"]
  }
}

Si ce produit n'est PAS capillaire : {"error":"Non capillaire"}
Réponds UNIQUEMENT avec le JSON valide, aucun texte autour.`;
      parts.push({ text: promptText });
    }

    const models = [
      {
        name: 'gemini-2.5-flash',
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 1024 }  // Allow reasoning for scoring matrix
        }
      },
      {
        name: 'gemini-1.5-flash',
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        config: {
          responseMimeType: 'application/json'
        }
      }
    ];

    let geminiResponse: Response | null = null;
    let lastErrorMsg = '';

    for (const model of models) {
      const MAX_RETRIES = 1;
      let success = false;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          geminiResponse = await fetch(model.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: model.config
            })
          });

          if (geminiResponse.ok) {
            success = true;
            break;
          }

          const errorText = await geminiResponse.text().catch(() => '');
          lastErrorMsg = `Gemini ${model.name} ${geminiResponse.status}: ${errorText}`;

          if (geminiResponse.status === 429 && attempt < MAX_RETRIES) {
            let errJson: any = {};
            try { errJson = JSON.parse(errorText); } catch {}
            const retryMatch = JSON.stringify(errJson).match(/retry in ([0-9.]+)s/);
            const waitMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500 : 5000;
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }

          break;
        } catch (fetchErr: any) {
          lastErrorMsg = `Fetch error for ${model.name}: ${fetchErr.message || String(fetchErr)}`;
          break;
        }
      }

      if (success && geminiResponse && geminiResponse.ok) break;
    }

    if (!geminiResponse || !geminiResponse.ok) {
      throw new Error(`Gemini API indisponible. Détails: ${lastErrorMsg}`);
    }

    const data = await geminiResponse.json();
    const allParts = data.candidates?.[0]?.content?.parts ?? [];
    const textPart = allParts.find((p: any) => !p.thought && typeof p.text === 'string');
    const geminiText = textPart?.text;

    if (!geminiText) {
      const raw = JSON.stringify(data).substring(0, 300);
      throw new Error(`L'IA n'a pas renvoyé de texte. Raw: ${raw}`);
    }

    let parsedAnalysis: any;
    try {
      const jsonStr = geminiText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedAnalysis = JSON.parse(jsonStr);
    } catch (parseErr: any) {
      throw new Error(`PARSING_ERROR: L'IA n'a pas pu décrypter la formule. Assure-toi que la photo de la liste d'ingrédients (INCI) au dos du produit est bien nette, bien éclairée, sans reflets et bien lisible.`);
    }

    // ════════════════════════════════════════════════════════════════════
    // SERVER-SIDE SCORING ENGINE — Applied AFTER AI response, cannot be ignored
    // The AI score is only a starting point; these rules are deterministic.
    // ════════════════════════════════════════════════════════════════════
    const isManualEntry = !checkCompatibilityOnly && (manualName || manualBrand);

    if (isManualEntry && parsedAnalysis && !parsedAnalysis.error) {
      const profileTexture = (texture || '').toLowerCase();
      const profilePorosity = (porosity || '').toLowerCase();
      const profileThickness = (thickness || '').toLowerCase();
      const productNameLower = (manualName || '').toLowerCase();
      const productTypeLower = (manualType || '').toLowerCase();

      // ─── Profile flags (from user's stored profile) ──────────────────────
      const isTextured = ['crépus', 'frisés', 'bouclés', 'locksés', 'crepus', 'frises', 'boucles', 'lockses'].some(t => profileTexture.includes(t));
      const isLocks    = profileTexture.includes('lock');
      const isCrepu    = ['crépus', 'crepus'].some(t => profileTexture.includes(t));
      const isFrise    = ['frisés', 'frises'].some(t => profileTexture.includes(t));
      const isBoucle   = ['bouclés', 'boucles'].some(t => profileTexture.includes(t));
      const isFaiblePorosite = profilePorosity.includes('faible') || profilePorosity.includes('low');
      const isFortePorosite  = profilePorosity.includes('forte')  || profilePorosity.includes('high');
      const isEpais = ['épais', 'epais'].some(t => profileTexture.includes(t) || profileThickness.includes(t));
      const isFins  = ['fin'].some(t => profileThickness.includes(t) || profileTexture.includes(t));

      // ─── Product type: read from user's form field (100% reliable) ───────
      const WASHING_TYPES = ['lavage', 'shampoing', 'shampooing', 'co-wash', 'clarification', 'clarifi', 'co wash', 'detox', 'détox'];
      const isShampoo = WASHING_TYPES.some(k => productTypeLower.includes(k) || productNameLower.includes(k));

      // ─── Ingredient flags: double layer — AI boolean + text fallback ──────
      // Layer 1: AI boolean (fast, direct). Layer 2: text scan of what the AI
      // actually listed in mainIngredients/inciReport (very reliable listing).
      // We use OR — either layer triggers the rule.
      const allText = [
        ...(parsedAnalysis.mainIngredients  || []),
        ...(parsedAnalysis.inciReport?.good  || []),
        ...(parsedAnalysis.inciReport?.neutral || []),
        ...(parsedAnalysis.inciReport?.avoid || []),
        parsedAnalysis.coachAdvice       || '',
        parsedAnalysis.pointsOfVigilance || '',
      ].join(' ').toLowerCase();

      const aiHasSulfates =
        parsedAnalysis.hasSulfates === true ||
        allText.includes('sulfate') ||
        allText.includes('sls') ||
        allText.includes('sles');

      const aiHasSilicones =
        parsedAnalysis.hasSilicones === true ||
        ['dimethicone', 'cyclopentasiloxane', 'amodimethicone'].some(s => allText.includes(s));

      const aiHasDryingAlcohol =
        parsedAnalysis.hasDryingAlcohol === true ||
        ['alcohol denat', 'isopropyl alcohol', 'ethanol'].some(s => allText.includes(s));

      const aiHasNourishing =
        parsedAnalysis.hasNourishing === true ||
        ['shea butter', 'karite', 'karité', 'castor oil', 'ricin', 'avocado', 'avocat'].some(s => allText.includes(s));

      const aiHasLightHydration =
        parsedAnalysis.hasLightHydration === true ||
        ['aloe', 'jojoba', 'glycerin', 'glycerine', 'glycérine'].some(s => allText.includes(s));

      // ─── DETERMINISTIC SCORING ENGINE ────────────────────────────────────
      // Starts at 100. Caps applied with Math.min — cannot be bypassed.
      let score = 100;
      let vigilanceMsg: string | null = null;

      // RULE 1 — SLS/SLES in a washing product on textured hair → hard cap 35
      if (isShampoo && aiHasSulfates && isTextured) {
        score = Math.min(score, 35);
        vigilanceMsg = "⚠️ Ce shampoing contient des sulfates durs (SLS/SLES) qui décapent le sébum naturel indispensable à la protection de vos boucles. À éviter au quotidien — préfère un co-wash ou un shampoing sans sulfates.";
      }

      // RULE 2a — Occlusive silicones on locks → hard cap 20
      if (aiHasSilicones && isLocks) {
        score = Math.min(score, 20);
        vigilanceMsg = vigilanceMsg || "⚠️ Les silicones occlusifs (Dimethicone/Cyclopentasiloxane) créent une accumulation interne dans la lock qui devient indélogeable avec le temps et peut provoquer de la moisissure interne. Ce produit est déconseillé.";
      }
      // RULE 2b — Occlusive silicones on low-porosity crépus/frisés → cap 50
      else if (aiHasSilicones && (isCrepu || isFrise) && isFaiblePorosite) {
        score = Math.min(score, 50);
        vigilanceMsg = vigilanceMsg || "⚠️ Les silicones non solubles (Dimethicone) forment un film occlusif sur une fibre déjà imperméable. L'eau et les soins suivants ne pourront plus pénétrer — risque de sécheresse progressive.";
      }

      // RULE 3 — Drying alcohols on crépus/frisés → cap 45
      if (aiHasDryingAlcohol && (isCrepu || isFrise)) {
        score = Math.min(score, 45);
        vigilanceMsg = vigilanceMsg || "⚠️ Présence d'alcool à chaîne courte hautement asséchant (Alcohol Denat/Isopropyl). Sur cheveux texturés, il fait s'évaporer l'hydratation immédiatement et provoque de la casse et de la sécheresse chronique.";
      }

      // RULE 4 — Nourishing bonus for high-porosity crépus (+15, cap 100)
      if (aiHasNourishing && (isCrepu || isEpais) && isFortePorosite) {
        score = Math.min(100, score + 15);
      }

      // RULE 5 — Light hydration bonus for low-porosity bouclés/frisés (+15, cap 100)
      if (aiHasLightHydration && (isBoucle || isFrise) && (isFaiblePorosite || isFins)) {
        score = Math.min(100, score + 15);
      }

      // ─── Title from score ─────────────────────────────────────────────────
      let title: string;
      if (score >= 80)      title = '💚 Très compatible pour ton profil';
      else if (score >= 50) title = '🟡 Compatible avec précautions';
      else if (score >= 30) title = '🔴 Déconseillé pour ton profil';
      else                  title = '🔴 Incompatible — à éviter';

      // ─── Write all computed values into the response ──────────────────────
      parsedAnalysis.compatibilityScore = score;
      parsedAnalysis.score = score;
      parsedAnalysis.title = title;
      parsedAnalysis.description = parsedAnalysis.coachAdvice || parsedAnalysis.description || '';
      if (vigilanceMsg) {
        parsedAnalysis.pointsOfVigilance = vigilanceMsg;
      }
    }

    return json(parsedAnalysis, 200);

  } catch (error: any) {
    console.error('Scanner Error:', error);
    const errMsg = error.message || String(error);
    
    let userMessage = 'Erreur lors de l\'analyse du produit.';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (errMsg.includes('PARSING_ERROR:')) {
      userMessage = errMsg.replace('PARSING_ERROR: ', '').replace('PARSING_ERROR:', '');
      errorCode = 'JSON_PARSE_ERROR';
    } else if (errMsg.includes('API key') || errMsg.includes('Clé API manquante')) {
      userMessage = 'Configuration du serveur incorrecte (clé API manquante). Veuillez contacter l\'administrateur.';
      errorCode = 'CONFIG_ERROR';
    } else if (errMsg.includes('indisponible') || errMsg.includes('fetch') || errMsg.includes('Fetch error') || errMsg.includes('Failed to fetch')) {
      userMessage = 'Le service d\'analyse est temporairement injoignable. Vérifie ta connexion internet et réessaie.';
      errorCode = 'NETWORK_ERROR';
    } else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('QUOTA_EXCEEDED')) {
      userMessage = 'Le serveur est surchargé. Réessaie dans quelques instants.';
      errorCode = 'QUOTA_ERROR';
    } else {
      userMessage = errMsg;
    }
    
    return json({
      error: userMessage,
      code: errorCode,
      details: errMsg
    }, 500);
  }
}
