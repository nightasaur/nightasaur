import React from 'react';

interface SocialAuthButtonProps {
  provider: 'google' | 'apple' | 'facebook';
  disabled?: boolean;
  onClick?: () => void;
}

const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({ 
  provider, 
  disabled = false,
  onClick 
}) => {
  const config = {
    google: {
      label: 'Continue with Google',
      labelZh: '使用 Google 繼續',
      icon: 'G',
      bgColor: 'bg-white hover:bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300',
    },
    apple: {
      label: 'Continue with Apple',
      labelZh: '使用 Apple 繼續',
      icon: '',
      bgColor: 'bg-black hover:bg-gray-900',
      textColor: 'text-white',
      borderColor: 'border-gray-800',
    },
    facebook: {
      label: 'Continue with Facebook',
      labelZh: '使用 Facebook 繼續',
      icon: 'f',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
      borderColor: 'border-blue-700',
    },
  };

  const { label, labelZh, icon, bgColor, textColor, borderColor } = config[provider];

  return (
    <button
      type="button"
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3 
        rounded-lg border transition-all duration-200
        ${bgColor} ${textColor} ${borderColor}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        font-medium
      `}
      disabled={disabled}
      onClick={onClick}
      aria-label={`Continue with ${provider}`}
    >
      <span className="font-bold text-lg">{icon}</span>
      <div className="text-center">
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{labelZh}</span>
      </div>
    </button>
  );
};

interface SocialAuthButtonsProps {
  disabled?: boolean;
  showComingSoon?: boolean;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ 
  disabled = true,
  showComingSoon = true 
}) => {
  const handleSocialClick = (provider: string) => {
    if (disabled) {
      return;
    }
    // 未來實現：處理社交登入
    console.log(`Social login with ${provider} clicked`);
  };

  return (
    <div className="space-y-3">
      {showComingSoon && (
        <div className="text-center mb-4">
          <p className="text-sm text-white/60">
            社交登入功能即將推出 / Social login coming soon
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        <SocialAuthButton 
          provider="google" 
          disabled={disabled}
          onClick={() => handleSocialClick('google')}
        />
        <SocialAuthButton 
          provider="apple" 
          disabled={disabled}
          onClick={() => handleSocialClick('apple')}
        />
        <SocialAuthButton 
          provider="facebook" 
          disabled={disabled}
          onClick={() => handleSocialClick('facebook')}
        />
      </div>
    </div>
  );
};

export default SocialAuthButtons;