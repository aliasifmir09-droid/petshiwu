import { Check, X } from 'lucide-react';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const requirements: PasswordRequirement[] = [
    {
      label: 'At least 6 characters',
      test: (pwd) => pwd.length >= 6
    },
    {
      label: 'At least one uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd)
    },
    {
      label: 'At least one lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd)
    },
    {
      label: 'At least one number',
      test: (pwd) => /\d/.test(pwd)
    }
  ];

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
      <ul className="space-y-1.5">
        {requirements.map((requirement, index) => {
          const isMet = requirement.test(password);
          return (
            <li
              key={index}
              className={`flex items-center text-sm ${
                isMet ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {isMet ? (
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              <span>{requirement.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;

