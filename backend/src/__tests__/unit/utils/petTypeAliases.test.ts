import { petTypeQueryValues } from '../../../utils/petTypeAliases';

describe('petTypeQueryValues', () => {
  test('small-animal matches catalog small-pet records', () => {
    const values = petTypeQueryValues('small-animal');
    expect(values).toEqual(expect.arrayContaining(['small-pet', 'small pet', 'small-animal']));
  });

  test('dog stays dog', () => {
    expect(petTypeQueryValues('Dog')).toEqual(expect.arrayContaining(['dog']));
    expect(petTypeQueryValues('dog')).not.toContain('small-pet');
  });
});
