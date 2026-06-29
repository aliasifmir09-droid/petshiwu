// Pet Symptom Checker decision tree data
// Used by /symptom-checker page
// Each symptom is a JSON-driven triage flow with severity escalation

export type TriageLevel = 'home' | 'vet-today' | 'emergency';

export interface TriageOutcome {
  level: TriageLevel;
  headline: string;
  recommendation: string;
  nextSteps: string[];
  watchFor: string[];
  relatedProducts?: { name: string; slug: string; reason: string }[];
  relatedBlogs?: { title: string; slug: string; reason: string }[];
}

export interface QuestionOption {
  label: string;
  value: string;
  severity: 'normal' | 'concern' | 'critical';
  // Optional immediate outcome override
  outcome?: TriageLevel;
}

export interface Question {
  id: string;
  question: string;
  helper?: string;
  options: QuestionOption[];
  // Map of option value -> next question id, or 'triage'/'end'
  nextMap: Record<string, string>;
}

export interface Symptom {
  id: string;
  petType: 'dog' | 'cat';
  emoji: string;
  title: string;
  shortLabel: string;
  description: string;
  redFlags: string[]; // Display as "Go to ER immediately if..."
  questions: Question[];
}

export const SYMPTOMS: Symptom[] = [
  // ===== DOG SYMPTOMS =====
  {
    id: 'dog-vomiting',
    petType: 'dog',
    emoji: '🤮',
    title: 'Dog Vomiting',
    shortLabel: 'Vomiting',
    description: 'Your dog is throwing up or trying to vomit. Let\'s figure out how serious it is.',
    redFlags: [
      'Bloated, hard belly (especially in deep-chested breeds)',
      'Repeated unproductive retching',
      'Vomiting blood (red or coffee-ground appearance)',
      'Suspected toxin ingestion (chocolate, xylitol, grapes, medication)'
    ],
    questions: [
      {
        id: 'q1',
        question: 'How long has your dog been vomiting?',
        helper: 'Single episode vs. prolonged vomiting tells us very different stories.',
        options: [
          { label: 'Just started (less than 12 hours)', value: 'acute', severity: 'normal' },
          { label: '12–24 hours', value: 'subacute', severity: 'concern' },
          { label: 'More than 24 hours', value: 'chronic', severity: 'critical' }
        ],
        nextMap: { acute: 'q2', subacute: 'q2', chronic: 'triage-vet-today' }
      },
      {
        id: 'q2',
        question: 'What does the vomit look like?',
        options: [
          { label: 'Undigested food or yellow bile', value: 'normal', severity: 'normal' },
          { label: 'Foamy white foam', value: 'foam', severity: 'concern' },
          { label: 'Blood (red streaks or dark coffee-ground)', value: 'blood', severity: 'critical' }
        ],
        nextMap: { normal: 'q3', foam: 'q3', blood: 'triage-emergency' }
      },
      {
        id: 'q3',
        question: 'Is your dog otherwise acting normal?',
        helper: 'Energy level, interest in food/water, willingness to play.',
        options: [
          { label: 'Yes, mostly normal between episodes', value: 'normal', severity: 'normal' },
          { label: 'Lethargic, hiding, or not interested in food', value: 'lethargic', severity: 'concern' },
          { label: 'Collapsed, unresponsive, or in distress', value: 'critical', severity: 'critical' }
        ],
        nextMap: { normal: 'q4', lethargic: 'triage-vet-today', critical: 'triage-emergency' }
      },
      {
        id: 'q4',
        question: 'Could your dog have eaten something dangerous?',
        helper: 'Common toxins: chocolate, xylitol, grapes/raisins, onions, medications, rodenticides, household cleaners, foreign objects.',
        options: [
          { label: 'No, normal diet and behavior', value: 'no', severity: 'normal' },
          { label: 'Possible — they got into something', value: 'maybe', severity: 'concern' },
          { label: 'Yes — known toxin or foreign body', value: 'yes', severity: 'critical' }
        ],
        nextMap: { no: 'triage-home', maybe: 'triage-vet-today', yes: 'triage-emergency' }
      }
    ]
  },
  {
    id: 'dog-diarrhea',
    petType: 'dog',
    emoji: '💩',
    title: 'Dog Diarrhea',
    shortLabel: 'Diarrhea',
    description: 'Loose, watery, or frequent stools. Let\'s check what\'s going on.',
    redFlags: [
      'Bloody diarrhea (bright red or black/tarry)',
      'Accompanied by vomiting (especially in puppies)',
      'Severe dehydration (skin tents when pinched)',
      'Suspected parvovirus in unvaccinated puppy'
    ],
    questions: [
      {
        id: 'q1',
        question: 'How long has the diarrhea been happening?',
        options: [
          { label: 'Less than 24 hours', value: 'acute', severity: 'normal' },
          { label: '1–3 days', value: 'subacute', severity: 'concern' },
          { label: 'More than 3 days or recurring', value: 'chronic', severity: 'critical' }
        ],
        nextMap: { acute: 'q2', subacute: 'q2', chronic: 'triage-vet-today' }
      },
      {
        id: 'q2',
        question: 'Is there blood or unusual color?',
        options: [
          { label: 'No, normal brown stool (just soft)', value: 'normal', severity: 'normal' },
          { label: 'Mucus or slight pink tint', value: 'mucus', severity: 'concern' },
          { label: 'Bright red blood or black/tarry', value: 'blood', severity: 'critical' }
        ],
        nextMap: { normal: 'q3', mucus: 'q3', blood: 'triage-emergency' }
      },
      {
        id: 'q3',
        question: 'Any dietary indiscretion?',
        helper: 'New food, table scraps, trash, foreign object, stress.',
        options: [
          { label: 'No change in diet or environment', value: 'no', severity: 'normal' },
          { label: 'Yes — likely cause identified', value: 'maybe', severity: 'concern' },
          { label: 'Suspected foreign body or toxin', value: 'toxin', severity: 'critical' }
        ],
        nextMap: { no: 'q4', maybe: 'triage-home', toxin: 'triage-emergency' }
      },
      {
        id: 'q4',
        question: 'How is your dog\'s overall energy and hydration?',
        options: [
          { label: 'Normal energy, drinking water, no vomiting', value: 'normal', severity: 'normal' },
          { label: 'Low energy or mild dehydration', value: 'lethargic', severity: 'concern' },
          { label: 'Severe lethargy, vomiting, or collapse', value: 'critical', severity: 'critical' }
        ],
        nextMap: { normal: 'triage-home', lethargic: 'triage-vet-today', critical: 'triage-emergency' }
      }
    ]
  },
  {
    id: 'dog-not-eating',
    petType: 'dog',
    emoji: '🍽️',
    title: 'Dog Not Eating',
    shortLabel: 'Not Eating',
    description: 'Refusing food or eating much less than usual. Let\'s triage.',
    redFlags: [
      'No food or water for more than 24 hours in adult dog',
      'Accompanied by vomiting or lethargy',
      'Sudden weight loss or muscle wasting',
      'Puppy (under 6 months) refusing food'
    ],
    questions: [
      {
        id: 'q1',
        question: 'How long since your dog ate a normal meal?',
        options: [
          { label: 'Skipped one meal (less than 24h)', value: 'short', severity: 'normal' },
          { label: '24–48 hours', value: 'medium', severity: 'concern' },
          { label: 'More than 48 hours', value: 'long', severity: 'critical' }
        ],
        nextMap: { short: 'q2', medium: 'triage-vet-today', long: 'triage-vet-today' }
      },
      {
        id: 'q2',
        question: 'Is your dog drinking water normally?',
        options: [
          { label: 'Yes, normal water intake', value: 'normal', severity: 'normal' },
          { label: 'Drinking less than usual', value: 'less', severity: 'concern' },
          { label: 'Not drinking at all', value: 'none', severity: 'critical' }
        ],
        nextMap: { normal: 'q3', less: 'q3', none: 'triage-emergency' }
      },
      {
        id: 'q3',
        question: 'Any other symptoms?',
        options: [
          { label: 'No — seems fine otherwise', value: 'no', severity: 'normal' },
          { label: 'Vomiting, diarrhea, or lethargy', value: 'some', severity: 'concern' },
          { label: 'Multiple severe symptoms', value: 'many', severity: 'critical' }
        ],
        nextMap: { no: 'triage-home', some: 'triage-vet-today', many: 'triage-emergency' }
      }
    ]
  },
  {
    id: 'dog-lethargy',
    petType: 'dog',
    emoji: '😴',
    title: 'Dog Lethargy / Low Energy',
    shortLabel: 'Lethargy',
    description: 'Your dog seems unusually tired, weak, or unresponsive. Let\'s assess.',
    redFlags: [
      'Collapse or inability to stand',
      'Pale, blue, or yellow gums',
      'Severe pain (crying, guarding body)',
      'Difficulty breathing'
    ],
    questions: [
      {
        id: 'q1',
        question: 'How sudden was the energy change?',
        options: [
          { label: 'Gradual over several days', value: 'gradual', severity: 'concern' },
          { label: 'Sudden — within hours', value: 'sudden', severity: 'critical' }
        ],
        nextMap: { gradual: 'q2', sudden: 'q2' }
      },
      {
        id: 'q2',
        question: 'Is your dog eating and drinking?',
        options: [
          { label: 'Yes, normal appetite', value: 'normal', severity: 'normal' },
          { label: 'Reduced appetite or thirst', value: 'reduced', severity: 'concern' },
          { label: 'Refusing food and water entirely', value: 'none', severity: 'critical' }
        ],
        nextMap: { normal: 'q3', reduced: 'q3', none: 'triage-emergency' }
      },
      {
        id: 'q3',
        question: 'Any other symptoms?',
        options: [
          { label: 'Mild — seems a bit off but stable', value: 'mild', severity: 'normal' },
          { label: 'Vomiting, diarrhea, limping, or pain', value: 'moderate', severity: 'concern' },
          { label: 'Collapse, pale gums, or breathing trouble', value: 'severe', severity: 'critical' }
        ],
        nextMap: { mild: 'triage-home', moderate: 'triage-vet-today', severe: 'triage-emergency' }
      }
    ]
  },
  {
    id: 'dog-limping',
    petType: 'dog',
    emoji: '🦴',
    title: 'Dog Limping / Lameness',
    shortLabel: 'Limping',
    description: 'Favoring a leg, limping, or refusing to bear weight. Let\'s check.',
    redFlags: [
      'Non-weight-bearing after trauma or fall',
      'Visible bone deformity or open wound',
      'Dragging a leg (neurological concern)',
      'Sudden inability to use back legs'
    ],
    questions: [
      {
        id: 'q1',
        question: 'Did you see what caused it?',
        options: [
          { label: 'Yes — trauma, fall, or known injury', value: 'trauma', severity: 'concern' },
          { label: 'No — gradual onset or unknown', value: 'unknown', severity: 'normal' }
        ],
        nextMap: { trauma: 'q2', unknown: 'q2' }
      },
      {
        id: 'q2',
        question: 'How severe is the limp?',
        options: [
          { label: 'Mild — slightly favoring leg', value: 'mild', severity: 'normal' },
          { label: 'Moderate — clearly limping, slower walks', value: 'moderate', severity: 'concern' },
          { label: 'Severe — refuses to put weight on it', value: 'severe', severity: 'critical' }
        ],
        nextMap: { mild: 'q3', moderate: 'q3', severe: 'triage-emergency' }
      },
      {
        id: 'q3',
        question: 'How long has it been going on?',
        options: [
          { label: 'Less than 24 hours', value: 'short', severity: 'normal' },
          { label: '1–3 days', value: 'medium', severity: 'concern' },
          { label: 'More than 3 days or getting worse', value: 'long', severity: 'critical' }
        ],
        nextMap: { short: 'triage-home', medium: 'triage-vet-today', long: 'triage-vet-today' }
      }
    ]
  },
  {
    id: 'dog-coughing',
    petType: 'dog',
    emoji: '😷',
    title: 'Dog Coughing',
    shortLabel: 'Coughing',
    description: 'Persistent cough, gagging, or noisy breathing. Let\'s figure out why.',
    redFlags: [
      'Collapse or fainting after cough',
      'Blue or pale gums',
      'Suspected choking (cannot complete a breath)',
      'Coughing up blood'
    ],
    questions: [
      {
        id: 'q1',
        question: 'What does the cough sound like?',
        options: [
          { label: 'Dry, hacking (like something stuck)', value: 'dry', severity: 'normal' },
          { label: 'Wet, productive (sounds moist)', value: 'wet', severity: 'concern' },
          { label: 'Honking or goose-like', value: 'honking', severity: 'concern' }
        ],
        nextMap: { dry: 'q2', wet: 'q2', honking: 'q2' }
      },
      {
        id: 'q2',
        question: 'How is your dog\'s breathing between coughs?',
        options: [
          { label: 'Normal, comfortable', value: 'normal', severity: 'normal' },
          { label: 'Faster than usual or mild effort', value: 'fast', severity: 'concern' },
          { label: 'Labored, gasping, or distress', value: 'labored', severity: 'critical' }
        ],
        nextMap: { normal: 'q3', fast: 'triage-vet-today', labored: 'triage-emergency' }
      },
      {
        id: 'q3',
        question: 'How long has the cough been happening?',
        options: [
          { label: 'Less than a week', value: 'short', severity: 'normal' },
          { label: '1–3 weeks', value: 'medium', severity: 'concern' },
          { label: 'More than 3 weeks or worsening', value: 'long', severity: 'critical' }
        ],
        nextMap: { short: 'triage-home', medium: 'triage-vet-today', long: 'triage-vet-today' }
      }
    ]
  },
  {
    id: 'dog-itching',
    petType: 'dog',
    emoji: '🐕',
    title: 'Dog Itching / Scratching',
    shortLabel: 'Itching',
    description: 'Excessive scratching, licking, chewing, or skin irritation.',
    redFlags: [
      'Open wounds or bleeding from scratching',
      'Hot spots spreading rapidly',
      'Facial swelling or hives (allergic reaction)',
      'Suspected toxin contact'
    ],
    questions: [
      {
        id: 'q1',
        question: 'Where is your dog itching most?',
        options: [
          { label: 'Ears, paws, or rear (common allergy zones)', value: 'allergy', severity: 'normal' },
          { label: 'One specific area (fleas, hot spot, injury)', value: 'localized', severity: 'concern' },
          { label: 'All over the body', value: 'general', severity: 'concern' }
        ],
        nextMap: { allergy: 'q2', localized: 'q2', general: 'q2' }
      },
      {
        id: 'q2',
        question: 'Are there visible skin changes?',
        options: [
          { label: 'Mild — slightly red or flaky', value: 'mild', severity: 'normal' },
          { label: 'Hair loss, scabs, or hot spots', value: 'moderate', severity: 'concern' },
          { label: 'Bleeding, pus, or severe inflammation', value: 'severe', severity: 'critical' }
        ],
        nextMap: { mild: 'q3', moderate: 'triage-vet-today', severe: 'triage-vet-today' }
      },
      {
        id: 'q3',
        question: 'How long has this been happening?',
        options: [
          { label: 'Less than a week', value: 'short', severity: 'normal' },
          { label: 'Recurring or seasonal', value: 'recurring', severity: 'concern' },
          { label: 'Constant and worsening', value: 'worsening', severity: 'concern' }
        ],
        nextMap: { short: 'triage-home', recurring: 'triage-vet-today', worsening: 'triage-vet-today' }
      }
    ]
  },
  // ===== CAT SYMPTOMS =====
  {
    id: 'cat-vomiting',
    petType: 'cat',
    emoji: '🤮',
    title: 'Cat Vomiting',
    shortLabel: 'Vomiting',
    description: 'Your cat is throwing up. Cats hide illness, so vomiting is always worth attention.',
    redFlags: [
      'Repeated unproductive retching (hairball vs. obstruction)',
      'Vomiting blood or foreign objects',
      'Suspected toxin (lily, essential oils, medication)',
      'Accompanied by severe lethargy or collapse'
    ],
    questions: [
      {
        id: 'q1',
        question: 'How often is your cat vomiting?',
        options: [
          { label: 'Once or twice (likely hairball or mild)', value: 'mild', severity: 'normal' },
          { label: 'Several times in 24 hours', value: 'moderate', severity: 'concern' },
          { label: 'Persistent or cannot keep anything down', value: 'severe', severity: 'critical' }
        ],
        nextMap: { mild: 'q2', moderate: 'q2', severe: 'triage-emergency' }
      },
      {
        id: 'q2',
        question: 'What does the vomit look like?',
        options: [
          { label: 'Hairball or undigested food', value: 'hairball', severity: 'normal' },
          { label: 'Yellow bile or foam', value: 'bile', severity: 'concern' },
          { label: 'Blood, pink, or unusual color', value: 'blood', severity: 'critical' }
        ],
        nextMap: { hairball: 'q3', bile: 'q3', blood: 'triage-emergency' }
      },
      {
        id: 'q3',
        question: 'How is your cat otherwise?',
        options: [
          { label: 'Normal behavior, eating, using litter box', value: 'normal', severity: 'normal' },
          { label: 'Hiding, low energy, or off food', value: 'lethargic', severity: 'concern' },
          { label: 'Not using litter box or collapse', value: 'critical', severity: 'critical' }
        ],
        nextMap: { normal: 'triage-home', lethargic: 'triage-vet-today', critical: 'triage-emergency' }
      }
    ]
  },
  {
    id: 'cat-urination',
    petType: 'cat',
    emoji: '⚠️',
    title: 'Cat Urination Problems',
    shortLabel: 'Urinating Issues',
    description: 'Straining to pee, frequent litter box visits, or peeing outside the box. Male cats: this is an emergency.',
    redFlags: [
      'Male cat straining with no urine output (urethral blockage — life-threatening)',
      'Crying or vocalizing in litter box',
      'Blood in urine',
      'Cat hiding and refusing to eat'
    ],
    questions: [
      {
        id: 'q1',
        question: 'Is your cat producing urine?',
        helper: 'Watch them in the litter box. Straining with no output = emergency.',
        options: [
          { label: 'Yes, normal urine output', value: 'yes', severity: 'normal' },
          { label: 'Small amounts, frequent attempts', value: 'small', severity: 'concern' },
          { label: 'Straining but no urine, or crying in box', value: 'none', severity: 'critical' }
        ],
        nextMap: { yes: 'q2', small: 'q2', none: 'triage-emergency' }
      },
      {
        id: 'q2',
        question: 'Is there blood or unusual color?',
        options: [
          { label: 'No, normal yellow', value: 'normal', severity: 'normal' },
          { label: 'Pink or red-tinged', value: 'blood', severity: 'critical' }
        ],
        nextMap: { normal: 'q3', blood: 'triage-vet-today' }
      },
      {
        id: 'q3',
        question: 'Behavior changes?',
        options: [
          { label: 'Peeing outside box but otherwise normal', value: 'behavioral', severity: 'normal' },
          { label: 'Hiding, off food, or low energy', value: 'lethargic', severity: 'concern' }
        ],
        nextMap: { behavioral: 'triage-vet-today', lethargic: 'triage-vet-today' }
      }
    ]
  },
  {
    id: 'cat-not-eating',
    petType: 'cat',
    emoji: '🍽️',
    title: 'Cat Not Eating',
    shortLabel: 'Not Eating',
    description: 'Cats who stop eating can develop hepatic lipidosis (fatty liver disease) within days. Always take this seriously.',
    redFlags: [
      'No food for more than 24 hours (especially in overweight cats)',
      'Yellow gums or eyes (jaundice)',
      'Hiding, lethargic, or not grooming',
      'Vomiting or not using litter box'
    ],
    questions: [
      {
        id: 'q1',
        question: 'How long since your cat ate a normal meal?',
        options: [
          { label: 'Skipped one meal (less than 24h)', value: 'short', severity: 'normal' },
          { label: '24–48 hours', value: 'medium', severity: 'concern' },
          { label: 'More than 48 hours', value: 'long', severity: 'critical' }
        ],
        nextMap: { short: 'q2', medium: 'triage-vet-today', long: 'triage-emergency' }
      },
      {
        id: 'q2',
        question: 'Is your cat drinking water?',
        options: [
          { label: 'Yes, normal water intake', value: 'normal', severity: 'normal' },
          { label: 'Drinking less than usual', value: 'less', severity: 'concern' },
          { label: 'Not drinking at all', value: 'none', severity: 'critical' }
        ],
        nextMap: { normal: 'q3', less: 'triage-vet-today', none: 'triage-emergency' }
      },
      {
        id: 'q3',
        question: 'Any other symptoms?',
        options: [
          { label: 'No — otherwise acting normal', value: 'no', severity: 'normal' },
          { label: 'Vomiting, lethargy, or hiding', value: 'some', severity: 'concern' },
          { label: 'Multiple severe symptoms', value: 'many', severity: 'critical' }
        ],
        nextMap: { no: 'triage-home', some: 'triage-vet-today', many: 'triage-emergency' }
      }
    ]
  }
];

// Triage outcomes — indexed by level
export const TRIAGE_OUTCOMES: Record<TriageLevel, TriageOutcome> = {
  'home': {
    level: 'home',
    headline: 'Monitor at home',
    recommendation: 'This sounds manageable with at-home care. Watch closely for any change in symptoms over the next 24–48 hours. If anything worsens, escalate to your vet.',
    nextSteps: [
      'Keep your pet comfortable and hydrated',
      'Offer a bland diet (boiled chicken + white rice for dogs; small frequent meals for cats)',
      'Rest and limit activity',
      'Track symptoms in a log (time, severity, behavior)',
      'Reassess every 6–12 hours'
    ],
    watchFor: [
      'Symptoms persisting beyond 48 hours',
      'New symptoms appearing',
      'Energy level dropping',
      'Refusing food or water'
    ],
    relatedProducts: [
      { name: 'Probiotic for Digestive Health', slug: '/products/probiotics-for-dogs', reason: 'Supports gut recovery during mild GI upset' },
      { name: 'Rehydration Support', slug: '/products/electrolyte-supplements', reason: 'Helps maintain hydration during recovery' }
    ],
    relatedBlogs: [
      { title: 'When to worry about pet vomiting at home', slug: '/learning/dog-vomiting-causes', reason: 'Home management guide' }
    ]
  },
  'vet-today': {
    level: 'vet-today',
    headline: 'See a vet within 24 hours',
    recommendation: 'These symptoms suggest something that needs professional evaluation soon — not an emergency, but not something to wait out. Schedule an appointment with your vet today or tomorrow.',
    nextSteps: [
      'Call your primary vet and request a same-day or next-day appointment',
      'If your vet is unavailable, find a nearby urgent care vet',
      'Document symptoms: when they started, frequency, any patterns',
      'Bring a fresh stool/urine sample if relevant',
      'Avoid home remedies until you\'ve talked to a vet'
    ],
    watchFor: [
      'Rapid worsening of any symptom',
      'New concerning symptoms (vomiting, lethargy, breathing trouble)',
      'Refusal of food or water for more than 24 hours'
    ],
    relatedBlogs: [
      { title: 'Choosing a vet in NYC', slug: '/learning/vet-near-me-nyc', reason: 'Find a vet quickly in NYC' }
    ]
  },
  'emergency': {
    level: 'emergency',
    headline: 'Go to emergency vet NOW',
    recommendation: 'This is potentially life-threatening. Don\'t wait — head to the nearest emergency veterinary hospital immediately. If your regular vet offers emergency hours, call ahead so they can prepare.',
    nextSteps: [
      'Go to the nearest 24/7 emergency veterinary hospital immediately',
      'Call ahead if possible so they can prepare for you',
      'Bring any medication/vomit/stool samples if available',
      'Do NOT induce vomiting unless directed by a vet',
      'Keep your pet calm and warm during transport'
    ],
    watchFor: [
      'Collapse, seizures, or loss of consciousness',
      'Pale, blue, or yellow gums',
      'Difficulty breathing',
      'Severe pain or distress'
    ],
    relatedBlogs: [
      { title: 'NYC emergency vets: 24/7 hospitals near you', slug: '/learning/emergency-vet-nyc', reason: 'Find an emergency vet in NYC fast' }
    ]
  }
};
