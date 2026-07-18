import type { FitnessWorldState } from '@/lib/policy/world';

const THEME = {
  foundation: { primary: '#c7f65a', secondary: '#4f5e45', glow: 'rgba(199,246,90,.32)' },
  momentum: { primary: '#59d7a0', secondary: '#416a5a', glow: 'rgba(89,215,160,.34)' },
  performance: { primary: '#8d9cff', secondary: '#4e557f', glow: 'rgba(141,156,255,.36)' },
  elite: { primary: '#ffc76b', secondary: '#72552c', glow: 'rgba(255,199,107,.38)' },
};

export default function FitnessAvatar({ avatar, level, compact = false }: { avatar: FitnessWorldState['avatar']; level: number; compact?: boolean }) {
  const colors = THEME[avatar.theme];
  return (
    <div className={`fitness-avatar ${compact ? 'is-compact' : ''}`} style={{ '--avatar-accent': colors.primary, '--avatar-glow': colors.glow } as React.CSSProperties}>
      <svg viewBox="0 0 240 300" role="img" aria-label={`Your symbolic fitness avatar, level ${level} ${avatar.rank}`}>
        <defs>
          <linearGradient id={`avatar-kit-${avatar.theme}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={colors.primary} /><stop offset="1" stopColor={colors.secondary} />
          </linearGradient>
          <radialGradient id={`avatar-skin-${avatar.theme}`}><stop offset="0" stopColor="#bb8a6d" /><stop offset="1" stopColor="#76513e" /></radialGradient>
        </defs>
        <ellipse className="avatar-aura" cx="120" cy="266" rx="78" ry="16" fill={colors.glow} />
        <path className="avatar-backlight" d="M120 20 C59 20 28 77 35 151 C40 223 73 264 120 272 C167 264 200 223 205 151 C212 77 181 20 120 20Z" fill="none" stroke={colors.primary} opacity=".16" />
        <circle cx="120" cy="65" r="34" fill={`url(#avatar-skin-${avatar.theme})`} />
        <path d="M89 61 Q95 25 124 28 Q154 30 154 62 Q139 45 104 47Z" fill="#202421" />
        <path d="M84 112 Q120 91 156 112 L170 203 Q147 224 120 224 Q93 224 70 203Z" fill={`url(#avatar-kit-${avatar.theme})`} />
        <path d="M87 113 L58 139 L48 202" fill="none" stroke={`url(#avatar-skin-${avatar.theme})`} strokeWidth="25" strokeLinecap="round" />
        <path d="M153 113 L182 139 L192 202" fill="none" stroke={`url(#avatar-skin-${avatar.theme})`} strokeWidth="25" strokeLinecap="round" />
        <path d="M94 211 L83 273" fill="none" stroke="#2c3330" strokeWidth="31" strokeLinecap="round" />
        <path d="M146 211 L157 273" fill="none" stroke="#2c3330" strokeWidth="31" strokeLinecap="round" />
        <path d="M73 281h34M133 281h35" stroke={colors.primary} strokeWidth="12" strokeLinecap="round" />
        <path d="M95 118 Q120 132 145 118 L142 154 Q120 166 98 154Z" fill="rgba(8,12,9,.38)" />
        <path d="M111 129h18v18h-18z" rx="4" fill={colors.primary} />
        <text x="120" y="143" textAnchor="middle" fill="#142000" fontSize="10" fontWeight="900">FC</text>
        {level >= 6 && <path d="M51 190h17v8H51zM172 190h17v8h-17z" fill={colors.primary} />}
        {level >= 21 && <path d="M120 172 l12 16 -12 12 -12-12Z" fill="none" stroke={colors.primary} strokeWidth="3" />}
      </svg>
      {!compact && <div><span>Level {level}</span><strong>{avatar.rank}</strong><small>{avatar.outfit} · {avatar.accessory}</small></div>}
    </div>
  );
}
