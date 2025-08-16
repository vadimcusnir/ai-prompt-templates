// ECOMMERCE FRAMEWORK GENERATOR
export interface FrameworkData {
  title: string;
  context_frame: string;
  protocol_steps: string[];
  required_inputs: string[];
  difficulty_score?: number;
  implementation_time?: string;
  antipatterns?: string[];
}

export function generateEcommerceFramework(category: string, index: number): FrameworkData {
  const frameworks: Record<string, FrameworkData> = {
    conversion_optimization: {
      title: `Psychology-Driven Conversion Framework #${index}`,
      context_frame: "Most ecommerce operates at feature level, missing psychological conversion triggers.",
      protocol_steps: [
        "Map customer psychological journey from awareness to purchase",
        "Identify conversion friction points through behavioral analysis", 
        "Apply cognitive bias triggers (scarcity, social proof, reciprocity)",
        "Design micro-interactions that eliminate purchase hesitation",
        "Test emotional triggers alongside rational benefits",
        "Measure psychological conversion factors, not just metrics",
        "Optimize decision architecture, not just user interface"
      ],
      required_inputs: [
        "Customer behavior analytics data",
        "Conversion funnel performance metrics", 
        "Psychological trigger testing parameters",
        "Target conversion improvement goals"
      ]
    },
    
    pricing_psychology: {
      title: `Psychological Pricing Architecture #${index}`,
      context_frame: "Most pricing strategies ignore cognitive biases that influence purchase decisions.",
      protocol_steps: [
        "Analyze price sensitivity through behavioral economics lens",
        "Identify anchoring opportunities in product positioning",
        "Apply charm pricing and decoy effects strategically",
        "Design bundle psychology for perceived value optimization",
        "Test psychological price points against rational thresholds",
        "Measure willingness to pay through preference revelation",
        "Optimize pricing architecture for psychological impact"
      ],
      required_inputs: [
        "Historical pricing data and customer response metrics",
        "Competitor pricing analysis",
        "Customer segment value perception data",
        "A/B testing infrastructure for price experiments"
      ]
    },

    semantic_search_merchandising: {
      title: `Semantic Search & AI Merchandising #${index}`,
      context_frame: "Keyword search ratează intenția; merchandisarea rămâne statică.",
      protocol_steps: [
        "Ingest produsele (titlu, atribute, preț, marjă, stoc) într-un index vectorial",
        "Construiește hartă de sinonime și fraze de domeniu; normalizează taxonomia",
        "Re-rankează cu semnale comportamentale (CTR, add-to-cart, revenue per result)",
        "Activează facete semantice și colecții dinamice pe intenții",
        "Gestionează interogările fără rezultate cu fallback-uri inteligente",
        "Aplică reguli de merchandising (boost marjă, noutate, stoc, sezon)",
        "Rulează A/B pe ranking și merchandising; monitorizează zero-result rate"
      ],
      required_inputs: [
        "Catalog produse (CSV/JSON cu atribute), imagini, categorii",
        "Loguri căutare + interogări fără rezultate",
        "Clickstream (vizualizări, clicuri, ATC, cumpărări)",
        "Listă sinonime/stopwords, config model embeddings/re-ranking"
      ]
    },

    checkout_friction_performance: {
      title: `Checkout Speed & Friction Kill‑List #${index}`,
      context_frame: "Milisecundele și câmpurile inutile ard intenția și conversia.",
      protocol_steps: [
        "Măsoară TTFB, LCP, CLS, JS weight; cartografiază fricțiunile de formular",
        "Trece la checkout one‑page cu opțiune guest + auto‑salvare coș",
        "Activează portofele rapide (Apple Pay/Google Pay/Shop Pay)",
        "Implementează auto‑fill și validare adresă în timp real",
        "Reduce câmpurile (progressive disclosure); copiere inteligentă pentru erori",
        "Asigură fluxuri clare pentru erori de plată și reîncercare sigură",
        "Rulează load/perf tests; monitorizează drop‑off per pas"
      ],
      required_inputs: [
        "Evenimente funnel de checkout (view_checkout→purchase)",
        "Integrare gateway plăți + tokenizare",
        "API validare adresă/poștală",
        "Raport web performance (Core Web Vitals)"
      ]
    },

    returns_exchange_profit_engine: {
      title: `Returns & Exchange Profit Engine #${index}`,
      context_frame: "Returnările văzute ca pierdere; tratează-le ca mecanism de retenție și recaptare venit.",
      protocol_steps: [
        "Definește praguri și clarifică politica; afișează înainte de cumpărare",
        "Lansează portal self‑service cu schimb instant (mărime/culoare)",
        "Oferă stimulente smart (credit magazin, bundle la schimb)",
        "Colectează reason codes; reduce returul prin ghiduri de mărimi/fit",
        "Rutează logistic invers pe cost/timp; automatizează etichetele",
        "Testează 'try‑before‑you‑buy' pe categorii cu risc mic",
        "Măsoară re‑achiziție și LTV post‑return vs cost operațional"
      ],
      required_inputs: [
        "Date RMA + motive retur",
        "Integrare OMS/WMS + curieri",
        "Atribute produse pentru fit/sizing",
        "Politici de restocare și costuri"
      ]
    },

    ugc_trust_architecture: {
      title: `UGC Trust & Social Proof Architecture #${index}`,
      context_frame: "Dovezile sociale sunt fragmentate; construiește un sistem de încredere, nu un widget.",
      protocol_steps: [
        "Declanșează captarea UGC post‑achiziție (email/SMS) cu stimulente etice",
        "Activează recenzii foto/video + Q&A pe produs",
        "Implementează moderare + detecție fraudă și ghiduri de autenticitate",
        "Afișează UGC strategic pe PDP/PLP/cart + marcaj schema.org",
        "Leagă profilul recenzorului de credibilitate (badge, istoric)",
        "Testează poziționarea componentelor de încredere (A/B multivariabil)",
        "Reciclează UGC în ads/landing cu mențiuni conforme"
      ],
      required_inputs: [
        "Fluxuri ESP/SMS pentru post‑purchase",
        "Platformă UGC sau module proprii",
        "Ghid de moderare și politici legale",
        "Template-uri PDP/PLP și sloturi pentru UGC"
      ]
    },

    internationalization_localization: {
      title: `Globalization & Localization Commerce Stack #${index}`,
      context_frame: "Fără limbă, monedă, taxe și legal localizate, cross‑border-ul moare.",
      protocol_steps: [
        "Detectează geo/limbă/monedă; definește reguli fallback",
        "Tradu UI și descrieri produse cu memorie terminologică",
        "Aplică prețuri locale, TVA/GST și taxe/duty (DDP/DAP)",
        "Configurează shipping/ETA per țară + metode preferate",
        "Generează pagini legale/returnări per piață; conforme",
        "Activează SEO internațional (hreflang, sitemap pe limbă)",
        "Asigură suport multilingv și SLA per piață"
      ],
      required_inputs: [
        "Listă țări țintă + prioritizare",
        "Config taxe/duty + transportatori",
        "Memorie de traducere + glosar brand",
        "Gateway plăți cu multi‑currency"
      ]
    },

    dynamic_bundling_kits: {
      title: `Dynamic Bundling & Kit Builder #${index}`,
      context_frame: "Bundle-urile statice limitează AOV; kit-urile dinamice cresc marja și relevanța.",
      protocol_steps: [
        "Construiește graful de compatibilitate și complementaritate între produse",
        "Generează bundle-uri algoritmice pe intenție/sezon/marjă",
        "Lansează UI de kit builder cu constrângeri și recomandări",
        "Definește reguli de prețare dinamică și discount pe compoziție",
        "Activează cross‑sell/upsell contextual din coș",
        "Măsoară AOV, marjă și rată retur pe bundle",
        "Iterează cu merch + insight comportamental"
      ],
      required_inputs: [
        "Atribute/relatii produse (compatibilitate/alternativă/complementar)",
        "Date de cost și marjă",
        "Reguli discount și cupoane",
        "Evenimente coș și checkout"
      ]
    },

    lifecycle_messaging_orchestration: {
      title: `Lifecycle Messaging Engine (Email/SMS/Push) #${index}`,
      context_frame: "Blast-urile ignoră ciclul de viață; banii stau în trigger-e, nu în newsletter.",
      protocol_steps: [
        "Segmentează RFM + valoare estimată (CLV) pe utilizator",
        "Mapează evenimente trigger (browse, ATC, cart drop, post‑purchase, lapsed)",
        "Construiește bibliotecă de conținut per segment și canal",
        "Setează ferestre de trimitere și frecvență (throttling/caps)",
        "Optimizează deliverability (warm‑up, autentificare, rep aut.)",
        "Măsoară venit per recipient și lift incremental (holdout)",
        "Iterează pe subiecte, oferte și timming pe cohortă"
      ],
      required_inputs: [
        "CDP/CRM cu evenimente și preferințe",
        "Template-uri pe canal (email/SMS/push)",
        "Metrici deliverability și reputație domeniu"
      ]
    },

    real_time_personalization: {
      title: `Real‑Time On‑Site Personalization #${index}`,
      context_frame: "PDP/PLP generice risipesc intenție; personalizează în sesiune fără invazie.",
      protocol_steps: [
        "Colectează semnale first/zero‑party în sesiune cu consimțământ",
        "Deduce persona/intenția din comportament (vizualizări, dwell, scroll)",
        "Variază blocuri de conținut pe PDP/PLP (headline, imagini, recenzii)",
        "Re‑rank recomandări (content‑based + collaborative) în timp real",
        "Explică personalizarea (why‑shown); respectă confidențialitatea",
        "Testează A/B personalizare vs baseline generic",
        "Monitorizează uplift și evită supra‑personalizarea (saturație)"
      ],
      required_inputs: [
        "Stream evenimente comportamentale (view, click, add_to_cart)",
        "Reguli/model ML de personalizare",
        "Variant library (copy, imagini, componente)",
        "Config consimțământ și preferințe"
      ]
    }
  };
  
  return frameworks[category] || generateDefaultFramework(category, index);
}

function generateDefaultFramework(category: string, index: number): FrameworkData {
  return {
    title: `${category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Framework #${index}`,
    context_frame: `Standard approaches to ${category.replace(/_/g, ' ')} miss strategic depth.`,
    protocol_steps: [
      "Analyze current implementation gaps",
      "Define strategic objectives and success metrics",
      "Design systematic approach to improvement",
      "Implement measurement and testing framework",
      "Optimize based on performance data"
    ],
    required_inputs: [
      "Current performance baseline data",
      "Strategic objectives and constraints",
      "Implementation resources and timeline",
      "Success measurement criteria"
    ]
  };
}

// Utility function pentru calcularea prețurilor AI-PROMPTS
export function generatePriceAI(depth: number, complexity: number): number {
  const basePrice = 29;
  const depthMultiplier = depth * 15;
  const complexityMultiplier = complexity * 25;
  const price = basePrice + depthMultiplier + complexityMultiplier;
  
  // Ensure digital root 2
  let finalPrice = price;
  while (getDigitalRoot(finalPrice) !== 2) {
    finalPrice += 1;
  }
  
  return Math.min(finalPrice, 299) * 100; // în cenți
}

function getDigitalRoot(n: number): number {
  while (n >= 10) {
    n = n.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return n;
}