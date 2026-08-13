import {
  estimateDailyCalories,
  extractJsonObject,
  mapSpeciesToPetType,
  parseNeuralTwin,
} from '../../../utils/neuralScan';

describe('neuralScan', () => {
  test('maps small-animal to small-pet catalog type', () => {
    expect(mapSpeciesToPetType('small-animal')).toBe('small-pet');
    expect(mapSpeciesToPetType('dog')).toBe('dog');
    expect(mapSpeciesToPetType('alien')).toBeNull();
  });

  test('parses Gemini JSON into a twin dossier', () => {
    const twin = parseNeuralTwin({
      subject: 'pet',
      species: 'dog',
      breed: 'French Bulldog',
      breedConfidence: 91,
      lifeStage: 'adult',
      sizeClass: 'small',
      coat: 'short',
      estimatedWeightLbs: 22,
      traits: ['compact', 'bat ears'],
      healthWatch: ['brachycephalic breathing'],
      careFocus: ['weight control'],
      shopQueries: ['limited ingredient dog food'],
      summary: 'Adult Frenchie with a sturdy compact frame.',
    });
    expect(twin?.petType).toBe('dog');
    expect(twin?.breed).toBe('French Bulldog');
    expect(twin?.dailyCalories).toBeGreaterThan(300);
    expect(twin?.shopQueries[0]).toContain('dog food');
  });

  test('extracts JSON from markdown fences', () => {
    const parsed = extractJsonObject('```json\n{"subject":"pet","species":"cat"}\n```');
    expect(parseNeuralTwin(parsed)?.species).toBe('cat');
  });

  test('returns null for garbage payloads', () => {
    expect(parseNeuralTwin(null)).toBeNull();
    expect(extractJsonObject('no json here')).toBeNull();
  });

  test('estimates senior cat calories lower than kitten', () => {
    const senior = estimateDailyCalories('cat', 10, 'senior');
    const kitten = estimateDailyCalories('cat', 10, 'kitten');
    expect(senior).not.toBeNull();
    expect(kitten).not.toBeNull();
    expect(kitten as number).toBeGreaterThan(senior as number);
  });
});
