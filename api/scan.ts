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
    texture, porosity, barcodeImage, barcode
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

RÈGLE ABSOLUE : Tu n'as PAS le droit d'inventer un produit, de supposer, ni de reconstituer une formule fictive.
Si ce code-barres correspond à un produit capillaire que tu connais avec CERTITUDE (≥90% de confiance), retourne :
{"recognized":true,"brand":"Marque exacte","name":"Nom exact","score":75,"title":"Titre court 🌿","description":"Analyse personnalisée 2-3 phrases.","inciReport":{"good":["Ingrédient (bénéfice)"],"neutral":["Ingrédient"],"avoid":["Ingrédient (risque)"]}}
Dans TOUS les autres cas (produit inconnu, doute, non capillaire, code-barres non reconnu) retourne UNIQUEMENT :
{"recognized":false}`;
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

RÈGLE ABSOLUE : Tu n'as PAS le droit d'inventer une formule, une marque, ou un nom de produit.
- Si les images sont floues, illisibles, ou si tu ne peux pas lire clairement la liste INCI et identifier la marque avec certitude → retourne UNIQUEMENT : {"recognized":false}
- Si le produit n'est PAS capillaire → retourne UNIQUEMENT : {"recognized":false}
- Si le produit est clairement identifié ET la liste INCI est lisible avec certitude, retourne :
{"recognized":true,"brand":"Marque exacte lue sur le produit","name":"Nom exact lu sur le produit","score":75,"title":"Titre court 🌿","description":"Analyse personnalisée 2-3 phrases.","inciReport":{"good":["Ingrédient (bénéfice)"],"neutral":["Ingrédient"],"avoid":["Ingrédient (risque)"]}}
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

RÈGLE ABSOLUE : Tu n'as PAS le droit d'inventer une formule ou une marque.
- Si l'image est floue, illisible ou que la liste INCI n'est pas clairement visible → retourne UNIQUEMENT : {"recognized":false}
- Si la liste INCI est clairement lisible, retourne :
{"recognized":true,"brand":"Marque si visible sinon \"Marque non identifiée\"","name":"Nom si visible sinon \"Produit scanné\"","score":75,"title":"Titre court 🌿","description":"Analyse personnalisée 2-3 phrases.","inciReport":{"good":["Ingrédient (bénéfice)"],"neutral":["Ingrédient"],"avoid":["Ingrédient (risque)"]}}
Réponds UNIQUEMENT en JSON valide (sans markdown).`;
      parts.push({ text: promptText });
      parts.push({ inlineData: { mimeType, data: base64Data } });

    // ── Option 5 : Ingredients text (from barcode lookup) ────────────────────
    } else if (ingredientsText) {
      promptText = `Expert INCI capillaire (cheveux afro/texturés).
Liste INCI : ${ingredientsText}
Profil : Texture ${texture || 'Crépus'}, Porosité ${porosity || 'Moyenne'}

Réponds UNIQUEMENT en JSON valide (sans markdown) :
{"brand":"Marque","name":"Nom","score":75,"title":"Titre court 🌿","description":"Analyse personnalisée 2-3 phrases.","inciReport":{"good":["Ingrédient (bénéfice)"],"neutral":["Ingrédient"],"avoid":["Ingrédient (risque)"]}}`;
      parts.push({ text: promptText });

    // ── Option 6 : Manual entry ───────────────────────────────────────────────
    } else {
      promptText = `Expert INCI capillaire (cheveux afro/texturés). Analyse ce produit via ta base de connaissances.
Produit : ${manualBrand} — ${manualName} (${manualType || 'Non spécifié'})
Profil : Texture ${texture || 'Crépus'}, Porosité ${porosity || 'Moyenne'}

Reconstitue la formule INCI officielle de ce produit. Évalue sa compatibilité.
Réponds UNIQUEMENT en JSON valide (sans markdown) :
{"brand":"${manualBrand}","name":"${manualName}","score":75,"title":"Titre court 🌿","description":"Analyse personnalisée 2-3 phrases, mentionne l'analyse via base de connaissances.","inciReport":{"good":["Ingrédient (bénéfice)"],"neutral":["Ingrédient"],"avoid":["Ingrédient (risque)"]}}
Si ce n'est PAS un produit capillaire : {"error":"Non capillaire"}`;
      parts.push({ text: promptText });
    }

    const models = [
      {
        name: 'gemini-2.5-flash',
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 }
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
            try {
              errJson = JSON.parse(errorText);
            } catch {}
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

      if (success && geminiResponse && geminiResponse.ok) {
        break;
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      throw new Error(`Gemini API indisponible. Détails: ${lastErrorMsg}`);
    }

    const data = await geminiResponse.json();

    // gemini-2.5-flash may return multiple parts: thought tokens (thought:true)
    // followed by the actual response. We skip thought parts and find the real text.
    const allParts = data.candidates?.[0]?.content?.parts ?? [];
    const textPart = allParts.find((p: any) => !p.thought && typeof p.text === 'string');
    const geminiText = textPart?.text;

    if (!geminiText) {
      const raw = JSON.stringify(data).substring(0, 300);
      throw new Error(`L'IA n'a pas renvoyé de texte. Raw: ${raw}`);
    }

    // Extract JSON — strip any accidental markdown fences
    const jsonStr = geminiText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsedAnalysis = JSON.parse(jsonStr);
    return json(parsedAnalysis, 200);

  } catch (error: any) {
    console.error('Scanner Error:', error);
    return json({
      error: 'Erreur lors de l\'analyse du produit.',
      details: error.message || String(error)
    }, 500);
  }
}
