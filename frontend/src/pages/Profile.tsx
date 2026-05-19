import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { petService } from '@/services/pets';
import { Pet } from '@/types';
import { User, Mail, Phone, Lock, Save, PawPrint, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

// ─── Species config ───────────────────────────────────────────────────────────
const SPECIES = [
  { value: 'dog',          label: 'Dog',          emoji: '🐕' },
  { value: 'cat',          label: 'Cat',          emoji: '🐈' },
  { value: 'bird',         label: 'Bird',         emoji: '🐦' },
  { value: 'fish',         label: 'Fish',         emoji: '🐠' },
  { value: 'reptile',      label: 'Reptile',      emoji: '🦎' },
  { value: 'small-animal', label: 'Small Animal', emoji: '🐹' },
  { value: 'other',        label: 'Other',        emoji: '🐾' },
];

const ALLERGENS = ['Chicken', 'Beef', 'Fish', 'Lamb', 'Grain', 'Wheat', 'Corn', 'Soy', 'Dairy', 'Eggs'];

const SIZES = [
  { value: 'small',  label: 'Small',   sub: 'Under 20 lbs' },
  { value: 'medium', label: 'Medium',  sub: '20–55 lbs' },
  { value: 'large',  label: 'Large',   sub: '55–100 lbs' },
  { value: 'xlarge', label: 'X-Large', sub: 'Over 100 lbs' },
];

const SPECIES_COLORS: Record<string, string> = {
  dog:          'bg-amber-50  border-amber-200',
  cat:          'bg-purple-50 border-purple-200',
  bird:         'bg-sky-50    border-sky-200',
  fish:         'bg-cyan-50   border-cyan-200',
  reptile:      'bg-green-50  border-green-200',
  'small-animal': 'bg-pink-50  border-pink-200',
  other:        'bg-gray-50   border-gray-200',
};

function getSpecies(value: string) {
  return SPECIES.find(s => s.value === value) || SPECIES[SPECIES.length - 1];
}

function petAge(birthday?: string): string | null {
  if (!birthday) return null;
  const born = new Date(birthday);
  const now = new Date();
  const months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (months < 1) return 'Under 1 month';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} old`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'} old`;
  return `${years}y ${rem}mo old`;
}

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  petName: '', species: '', breed: '', birthday: '',
  sex: '', isFixed: false, weight: '', size: '',
  allergies: [] as string[], notes: '',
};

// ─── Pet Form Component ───────────────────────────────────────────────────────
interface PetFormProps {
  initial?: typeof EMPTY_FORM;
  onSubmit: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  isPending: boolean;
  isEdit?: boolean;
}

function PetForm({ initial = EMPTY_FORM, onSubmit, onCancel, isPending, isEdit }: PetFormProps) {
  const [form, setForm] = useState(initial);
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initial.sex || initial.isFixed || initial.weight || initial.size || initial.notes)
  );

  const set = (key: keyof typeof EMPTY_FORM, val: any) => setForm(f => ({ ...f, [key]: val }));

  const toggleAllergen = (a: string) => {
    const lower = a.toLowerCase();
    set('allergies', form.allergies.includes(lower)
      ? form.allergies.filter(x => x !== lower)
      : [...form.allergies, lower]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.petName.trim() || !form.species) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Species picker */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Species <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {SPECIES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => set('species', s.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                form.species === s.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="leading-tight text-center">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Name + Breed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Pet Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.petName}
            onChange={e => set('petName', e.target.value)}
            placeholder="e.g. Luna"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Breed <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={form.breed}
            onChange={e => set('breed', e.target.value)}
            placeholder={form.species === 'dog' ? 'e.g. Golden Retriever' : form.species === 'cat' ? 'e.g. Siamese' : 'e.g. Parakeet'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      </div>

      {/* Birthday */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Birthday <span className="text-gray-400 font-normal">(optional — for birthday treats!)</span></label>
        <input
          type="date"
          value={form.birthday}
          onChange={e => set('birthday', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Allergies / Ingredients to Avoid <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map(a => {
            const active = form.allergies.includes(a.toLowerCase());
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAllergen(a)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? 'bg-red-100 border-red-400 text-red-700'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {active ? '✓ ' : ''}{a}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-1">We'll flag products containing these ingredients.</p>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline"
      >
        {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {showAdvanced ? 'Hide' : 'More details'} (sex, weight, size, notes)
      </button>

      {showAdvanced && (
        <div className="space-y-4 pt-1">
          {/* Sex + Fixed */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sex</label>
              <div className="flex gap-2">
                {['male', 'female'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('sex', form.sex === s ? '' : s)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      form.sex === s
                        ? 'bg-primary-100 border-primary-400 text-primary-700'
                        : 'bg-gray-100 border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {s === 'male' ? '♂ Male' : '♀ Female'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 sm:mt-5">
              <input
                type="checkbox"
                id="isFixed"
                checked={form.isFixed}
                onChange={e => set('isFixed', e.target.checked)}
                className="w-4 h-4 accent-primary-600"
              />
              <label htmlFor="isFixed" className="text-sm text-gray-700">Spayed / Neutered</label>
            </div>
          </div>

          {/* Weight + Size (for dogs/cats) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (lbs)</label>
              <input
                type="number"
                value={form.weight}
                onChange={e => set('weight', e.target.value)}
                min="0"
                max="300"
                placeholder="e.g. 45"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            {(form.species === 'dog' || form.species === 'cat') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Size</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SIZES.map(sz => (
                    <button
                      key={sz.value}
                      type="button"
                      onClick={() => set('size', form.size === sz.value ? '' : sz.value)}
                      className={`flex flex-col items-start px-3 py-2 rounded-lg border text-xs transition-all ${
                        form.size === sz.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-semibold">{sz.label}</span>
                      <span className="text-gray-400">{sz.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any special needs, health conditions, or preferences..."
              rows={2}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending || !form.petName.trim() || !form.species}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 text-sm"
        >
          <Save size={16} />
          {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Pet'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Pet Card Component ───────────────────────────────────────────────────────
interface PetCardProps {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}

function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const sp = getSpecies(pet.species);
  const colorClass = SPECIES_COLORS[pet.species] || SPECIES_COLORS.other;
  const age = petAge(pet.birthday);

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClass} flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{sp.emoji}</span>
          <div>
            <h4 className="font-bold text-gray-900 text-base leading-tight">{pet.petName}</h4>
            <p className="text-sm text-gray-600">
              {sp.label}{pet.breed ? ` · ${pet.breed}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/70 text-gray-500 hover:text-gray-700 transition-colors" title="Edit">
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors" title="Remove">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {age && (
          <span className="bg-white/70 border border-white px-2 py-0.5 rounded-full text-gray-600">
            🎂 {age}
          </span>
        )}
        {pet.sex && (
          <span className="bg-white/70 border border-white px-2 py-0.5 rounded-full text-gray-600 capitalize">
            {pet.sex === 'male' ? '♂' : '♀'} {pet.sex}
          </span>
        )}
        {pet.isFixed && (
          <span className="bg-white/70 border border-white px-2 py-0.5 rounded-full text-gray-600">
            Spayed/Neutered
          </span>
        )}
        {pet.weight && (
          <span className="bg-white/70 border border-white px-2 py-0.5 rounded-full text-gray-600">
            {pet.weight} lbs
          </span>
        )}
        {pet.size && (
          <span className="bg-white/70 border border-white px-2 py-0.5 rounded-full text-gray-600 capitalize">
            {pet.size === 'xlarge' ? 'X-Large' : pet.size}
          </span>
        )}
      </div>

      {pet.allergies && pet.allergies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-gray-500 mr-1">Avoids:</span>
          {pet.allergies.map(a => (
            <span key={a} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full capitalize border border-red-200">
              {a}
            </span>
          ))}
        </div>
      )}

      {pet.notes && (
        <p className="text-xs text-gray-500 italic leading-snug">{pet.notes}</p>
      )}
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
const Profile = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Pet UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);

  // ── Pet queries ──────────────────────────────────────────────────────────────
  const { data: pets = [], refetch: refetchPets } = useQuery({
    queryKey: ['myPets'],
    queryFn: petService.getMyPets,
    enabled: !!user,
  });

  const addPetMutation = useMutation({
    mutationFn: petService.addPet,
    onSuccess: (newPet) => {
      queryClient.invalidateQueries({ queryKey: ['myPets'] });
      setShowAddForm(false);
      showToast(`${newPet.petName} added to your profile! 🐾`, 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to add pet', 'error'),
  });

  const updatePetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => petService.updatePet(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['myPets'] });
      setEditingPetId(null);
      showToast(`${updated.petName} updated!`, 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to update pet', 'error'),
  });

  const deletePetMutation = useMutation({
    mutationFn: petService.deletePet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPets'] });
      setDeletingPetId(null);
      showToast('Pet removed from your profile.', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to remove pet', 'error'),
  });

  // ── Profile/password mutations ───────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setIsEditingProfile(false);
      showToast('Profile updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.updatePassword(currentPassword, newPassword),
    onSuccess: () => {
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update password', 'error');
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match!', 'error'); return;
    }
    if (passwordData.newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error'); return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const cancelEdit = () => {
    setProfileData({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: user?.phone || '' });
    setIsEditingProfile(false);
  };

  // ── Pet form helpers ─────────────────────────────────────────────────────────
  const petToForm = (pet: Pet) => ({
    petName:   pet.petName,
    species:   pet.species,
    breed:     pet.breed || '',
    birthday:  pet.birthday || '',
    sex:       pet.sex || '',
    isFixed:   pet.isFixed || false,
    weight:    pet.weight ? String(pet.weight) : '',
    size:      pet.size || '',
    allergies: pet.allergies || [],
    notes:     pet.notes || '',
  });

  const handleAddSubmit = (form: typeof EMPTY_FORM) => {
    addPetMutation.mutate({
      petName:   form.petName,
      species:   form.species,
      breed:     form.breed || undefined,
      birthday:  form.birthday || undefined,
      sex:       (form.sex as any) || undefined,
      isFixed:   form.isFixed || undefined,
      weight:    form.weight ? Number(form.weight) : undefined,
      size:      (form.size as any) || undefined,
      allergies: form.allergies.length ? form.allergies : undefined,
      notes:     form.notes || undefined,
    } as any);
  };

  const handleEditSubmit = (petId: string, form: typeof EMPTY_FORM) => {
    updatePetMutation.mutate({
      id: petId,
      data: {
        petName:   form.petName,
        species:   form.species,
        breed:     form.breed || '',
        birthday:  form.birthday || '',
        sex:       form.sex || '',
        isFixed:   form.isFixed,
        weight:    form.weight ? Number(form.weight) : '',
        size:      form.size || '',
        allergies: form.allergies,
        notes:     form.notes || '',
      }
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <User size={48} className="text-primary-600" />
                </div>
                <h2 className="text-xl font-bold mb-1">{user?.firstName} {user?.lastName}</h2>
                <p className="text-gray-600 mb-2">{user?.email}</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {user?.role === 'admin' ? 'Administrator' : 'Customer'}
                </span>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-600">{user?.email}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-600">{user?.phone}</span>
                    </div>
                  )}
                  {pets.length > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <PawPrint size={16} className="text-gray-400" />
                      <span className="text-gray-600">{pets.length} pet{pets.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Personal Information</h3>
                {!isEditingProfile && (
                  <button onClick={() => setIsEditingProfile(true)} className="text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                )}
              </div>

              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                      <p className="text-gray-900">{user?.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                      <p className="text-gray-900">{user?.lastName}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                    <p className="text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                    <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name *</label>
                      <input type="text" required value={profileData.firstName} onChange={e => setProfileData({ ...profileData, firstName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input type="text" required value={profileData.lastName} onChange={e => setProfileData({ ...profileData, lastName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address *</label>
                    <input type="email" required value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input type="tel" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={updateProfileMutation.isPending} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50">
                      <Save size={18} />{updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={cancelEdit} className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* ── My Pets ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <PawPrint size={22} className="text-primary-600" />
                  <h3 className="text-xl font-bold">My Pets</h3>
                  {pets.length > 0 && (
                    <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded-full">{pets.length}</span>
                  )}
                </div>
                {!showAddForm && (
                  <button
                    onClick={() => { setShowAddForm(true); setEditingPetId(null); }}
                    className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
                  >
                    <Plus size={16} /> Add Pet
                  </button>
                )}
              </div>

              {/* Add form */}
              {showAddForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800">Add a New Pet</h4>
                    <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                  </div>
                  <PetForm
                    onSubmit={handleAddSubmit}
                    onCancel={() => setShowAddForm(false)}
                    isPending={addPetMutation.isPending}
                  />
                </div>
              )}

              {/* Pet cards grid */}
              {pets.length === 0 && !showAddForm ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3">🐾</div>
                  <p className="text-gray-600 font-medium mb-1">No pets added yet</p>
                  <p className="text-gray-500 text-sm mb-4">Add your pet to get personalized product recommendations, birthday reminders, and more.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary-700 text-sm"
                  >
                    <Plus size={16} /> Add Your First Pet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pets.map(pet => (
                    <div key={pet._id}>
                      {editingPetId === pet._id ? (
                        <div className="p-4 bg-gray-50 rounded-xl border-2 border-primary-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-gray-800 text-sm">Edit {pet.petName}</h4>
                            <button onClick={() => setEditingPetId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                          </div>
                          <PetForm
                            initial={petToForm(pet)}
                            onSubmit={form => handleEditSubmit(pet._id, form)}
                            onCancel={() => setEditingPetId(null)}
                            isPending={updatePetMutation.isPending}
                            isEdit
                          />
                        </div>
                      ) : deletingPetId === pet._id ? (
                        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex flex-col gap-3">
                          <p className="text-sm font-medium text-gray-800">Remove <strong>{pet.petName}</strong> from your profile?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => deletePetMutation.mutate(pet._id)}
                              disabled={deletePetMutation.isPending}
                              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                              {deletePetMutation.isPending ? 'Removing...' : 'Yes, Remove'}
                            </button>
                            <button
                              onClick={() => setDeletingPetId(null)}
                              className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-semibold hover:bg-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <PetCard
                          pet={pet}
                          onEdit={() => { setEditingPetId(pet._id); setShowAddForm(false); }}
                          onDelete={() => setDeletingPetId(pet._id)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Password &amp; Security</h3>
                {!isChangingPassword && (
                  <button onClick={() => setIsChangingPassword(true)} className="text-primary-600 hover:text-primary-700 font-medium">Change Password</button>
                )}
              </div>

              {!isChangingPassword ? (
                <div className="flex items-center gap-3 text-gray-600">
                  <Lock size={20} />
                  <p>••••••••</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password *</label>
                    <input type="password" required value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password *</label>
                    <input type="password" required value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" minLength={8} />
                    <p className="text-sm text-gray-500 mt-1">Must be at least 8 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm New Password *</label>
                    <input type="password" required value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" minLength={8} />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={updatePasswordMutation.isPending} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50">
                      <Lock size={18} />{updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </button>
                    <button type="button" onClick={() => { setIsChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Type:</span>
                  <span className="font-medium">{user?.role === 'admin' ? 'Administrator' : 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since:</span>
                  <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default Profile;
