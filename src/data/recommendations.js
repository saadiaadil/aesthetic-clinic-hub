/**
 * "Not sure where to start?" discovery assistant (Stitch homepage).
 * Focus area × objective → recommended treatment. This is the rule-based
 * foundation for the Phase 2 AI recommendation engine.
 */

export const ASSISTANT_AREAS = [
  { id: 'skin', label: 'Skin', icon: 'scanFace' },
  { id: 'face', label: 'Face Contour', icon: 'wandSparkles' },
  { id: 'hair', label: 'Hair', icon: 'flower' },
  { id: 'body', label: 'Body', icon: 'personStanding' },
  { id: 'wellness', label: 'Wellness', icon: 'heartPulse' },
];

export const ASSISTANT_GOALS = [
  { id: 'prevent', label: 'Preventative', description: 'Slow aging & build collagen barrier' },
  { id: 'concern', label: 'Specific Concern', description: 'Texture, pigmentation, or wrinkles' },
  { id: 'consult', label: 'Consult Only', description: 'Expert diagnosis from a board doctor' },
];

export const ASSISTANT_MATCHES = {
  'skin-prevent': { title: 'Profhilo Bioremodeling + Deep Hydration', description: 'Ideal for slow-aging cellular matrix renewal and preventative collagen scaffolding.', treatmentId: 'profhilo-bioremodeling', score: 98 },
  'skin-concern': { title: 'Morpheus8 RF Microneedling + BBL HERO', description: 'Best-in-class resurfacing for stubborn hyperpigmentation, acne marks, and texture.', treatmentId: 'morpheus8-rf-microneedling', score: 96 },
  'skin-consult': { title: 'Comprehensive Digital Visia Skin Analysis', description: 'Sub-surface UV and pore scanning with senior dermatologist diagnosis.', treatmentId: 'hydrafacial-elite', score: 94 },
  'face-prevent': { title: 'Baby Botox & Preventative Forehead Micro-Dosing', description: 'Gentle natural expression smoothing without stiffness.', treatmentId: 'baby-botox', score: 97 },
  'face-concern': { title: 'Juvederm Volux Jawline & Cheek Definition', description: 'Structural hyaluronic matrix contouring tailored for Arabian bone harmony.', treatmentId: 'jawline-cheek-filler', score: 95 },
  'face-consult': { title: 'Facial Harmonization Board Consultation', description: 'Full 3D anatomical assessment with the cosmetic surgery team.', treatmentId: 'jawline-cheek-filler', score: 93 },
  'hair-prevent': { title: 'Exosome Scalp Oxygenation Programme', description: 'Strengthens roots and boosts micro-circulation for seasonal density.', treatmentId: 'exosome-scalp-therapy', score: 92 },
  'hair-concern': { title: 'Autologous Exosome & High-Concentrate PRP', description: 'Direct follicle stimulation for androgenic thinning and alopecia recovery.', treatmentId: 'prp-hair-restoration', score: 96 },
  'hair-consult': { title: 'Trichoscopic Scalp Evaluation', description: 'Microscopic follicle count and clinical plan by a certified trichologist.', treatmentId: 'regenera-activa', score: 91 },
  'body-prevent': { title: 'EMSCULPT NEO Maintenance Programme', description: 'Maintains muscle tone and tissue firmness between seasons.', treatmentId: 'emsculpt-neo', score: 90 },
  'body-concern': { title: 'Onda Coolwaves & Cryolipolysis Protocol', description: 'Targeted sub-mental and flank fat cell breakdown with skin tightening.', treatmentId: 'onda-coolwaves', score: 95 },
  'body-consult': { title: 'Non-Invasive Body Sculpting Assessment', description: 'InBody bio-impedance measurement and custom machine session roadmap.', treatmentId: 'coolsculpting-elite', score: 92 },
  'wellness-prevent': { title: 'Glutathione & Vitamin C Immunity IV Drips', description: 'Cellular defense and overall luminance infusion.', treatmentId: 'glutathione-iv', score: 93 },
  'wellness-concern': { title: 'NAD+ Longevity & Anti-Fatigue Protocol', description: 'Restores mitochondrial energy and optimizes recovery.', treatmentId: 'nad-longevity-iv', score: 94 },
  'wellness-consult': { title: 'Integrative Aesthetic Wellness Screening', description: 'Hormonal balance and micronutrient lab review with functional doctors.', treatmentId: 'glutathione-iv', score: 90 },
};
