import { Request, Response } from 'express';
import User from '../models/User';

// Helper: derive birthdayMMDD from a full date string "YYYY-MM-DD"
function toMMDD(dateStr: string): string | undefined {
  const m = dateStr.match(/^\d{4}-(\d{2})-(\d{2})$/);
  return m ? `${m[1]}-${m[2]}` : undefined;
}

/** GET /api/v1/users/me/pets */
export const getMyPets = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user._id).select('pets');
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, data: user.pets });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** POST /api/v1/users/me/pets */
export const addPet = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user._id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const { petName, species, breed, birthday, sex, isFixed, weight, size, allergies, notes, photo } = req.body;

    if (!petName || !petName.trim()) {
      res.status(400).json({ success: false, message: 'Pet name is required' }); return;
    }
    if (!species || !species.trim()) {
      res.status(400).json({ success: false, message: 'Species is required' }); return;
    }
    if (user.pets.length >= 10) {
      res.status(400).json({ success: false, message: 'Maximum 10 pets per account' }); return;
    }

    const newPet: any = {
      petName: petName.trim(),
      species: species.trim().toLowerCase(),
    };
    if (breed)    newPet.breed    = breed.trim();
    if (birthday) { newPet.birthday = birthday; newPet.birthdayMMDD = toMMDD(birthday); }
    if (sex)      newPet.sex      = sex;
    if (isFixed !== undefined) newPet.isFixed = Boolean(isFixed);
    if (weight)   newPet.weight   = Number(weight);
    if (size)     newPet.size     = size;
    if (Array.isArray(allergies)) newPet.allergies = allergies.filter(Boolean);
    if (notes)    newPet.notes    = notes.trim();
    if (photo)    newPet.photo    = photo;

    user.pets.push(newPet);
    await user.save();

    const added = user.pets[user.pets.length - 1];
    res.status(201).json({ success: true, data: added, message: `${newPet.petName} added to your profile!` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** PUT /api/v1/users/me/pets/:petId */
export const updatePet = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user._id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const pet = user.pets.find(p => p._id?.toString() === req.params.petId);
    if (!pet) { res.status(404).json({ success: false, message: 'Pet not found' }); return; }

    const { petName, species, breed, birthday, sex, isFixed, weight, size, allergies, notes, photo } = req.body;

    if (petName !== undefined)  pet.petName  = petName.trim();
    if (species !== undefined)  pet.species  = species.trim().toLowerCase();
    if (breed !== undefined)    pet.breed    = breed ? breed.trim() : undefined;
    if (birthday !== undefined) {
      pet.birthday    = birthday || undefined;
      pet.birthdayMMDD = birthday ? toMMDD(birthday) : undefined;
    }
    if (sex !== undefined)      pet.sex      = sex || undefined;
    if (isFixed !== undefined)  pet.isFixed  = isFixed === '' ? undefined : Boolean(isFixed);
    if (weight !== undefined)   pet.weight   = weight ? Number(weight) : undefined;
    if (size !== undefined)     pet.size     = size || undefined;
    if (allergies !== undefined) pet.allergies = Array.isArray(allergies) ? allergies.filter(Boolean) : [];
    if (notes !== undefined)    pet.notes    = notes ? notes.trim() : undefined;
    if (photo !== undefined)    pet.photo    = photo || undefined;

    await user.save();
    res.json({ success: true, data: pet, message: 'Pet updated!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** DELETE /api/v1/users/me/pets/:petId */
export const deletePet = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user._id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const idx = user.pets.findIndex(p => p._id?.toString() === req.params.petId);
    if (idx === -1) { res.status(404).json({ success: false, message: 'Pet not found' }); return; }

    const name = user.pets[idx].petName;
    user.pets.splice(idx, 1);
    await user.save();

    res.json({ success: true, message: `${name} removed from your profile.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
