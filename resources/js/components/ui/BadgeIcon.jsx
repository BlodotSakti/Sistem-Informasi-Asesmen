import React from 'react';

const icons = {
    'Bintang Sains': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-star" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="100%" stopColor="#EAB308" />
                </linearGradient>
                <filter id="glow-star" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <path d="M50 10 L61 35 L88 39 L68 58 L73 85 L50 72 L27 85 L32 58 L12 39 L39 35 Z" fill="url(#grad-star)" filter="url(#glow-star)" />
            <circle cx="50" cy="50" r="15" fill="#FEF08A" opacity="0.4" />
        </svg>
    ),
    'Pemikir Kritis': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-bulb" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
            </defs>
            <path d="M50 15 C35 15 25 25 25 40 C25 50 32 58 35 65 L35 75 C35 78 38 80 40 80 L60 80 C62 80 65 78 65 75 L65 65 C68 58 75 50 75 40 C75 25 65 15 50 15 Z" fill="url(#grad-bulb)" />
            <path d="M38 85 L62 85 C64 85 65 87 65 88 C65 90 64 92 62 92 L38 92 C36 92 35 90 35 88 C35 87 36 85 38 85 Z" fill="#94A3B8" />
            <path d="M45 40 L50 30 L55 40 M50 45 L50 55" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    'Teknolog Muda': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-rocket" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="grad-fire" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F97316" />
                    <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
            </defs>
            <path d="M50 15 C60 25 65 40 65 60 L35 60 C35 40 40 25 50 15 Z" fill="url(#grad-rocket)" />
            <path d="M35 60 L25 75 L35 70 Z" fill="#94A3B8" />
            <path d="M65 60 L75 75 L65 70 Z" fill="#94A3B8" />
            <path d="M40 60 L50 85 L60 60 Z" fill="url(#grad-fire)" />
            <circle cx="50" cy="40" r="8" fill="#FFF" opacity="0.8" />
        </svg>
    ),
    'Master Disiplin': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-clock" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="url(#grad-clock)" stroke="#10B981" strokeWidth="4" />
            <circle cx="50" cy="50" r="30" fill="#FFF" opacity="0.9" />
            <path d="M50 30 L50 50 L65 60" stroke="#059669" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="50" cy="50" r="4" fill="#059669" />
        </svg>
    ),
    'Pin Literasi': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-book" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="100%" stopColor="#7E22CE" />
                </linearGradient>
            </defs>
            <path d="M50 80 C50 80 25 70 15 75 L15 25 C25 20 50 30 50 30 C50 30 75 20 85 25 L85 75 C75 70 50 80 50 80 Z" fill="url(#grad-book)" />
            <path d="M50 30 L50 80" stroke="#FFF" strokeWidth="4" strokeLinecap="round" />
            <path d="M25 40 L40 45 M25 55 L40 60" stroke="#FFF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M75 40 L60 45 M75 55 L60 60" stroke="#FFF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        </svg>
    ),
    'Seniman Budaya': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-palette" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FB923C" />
                    <stop offset="100%" stopColor="#C2410C" />
                </linearGradient>
            </defs>
            <path d="M20 50 C20 30 40 20 60 20 C80 20 85 40 85 55 C85 70 70 80 50 80 C30 80 20 70 20 50 Z" fill="url(#grad-palette)" />
            <circle cx="35" cy="40" r="6" fill="#FFF" />
            <circle cx="50" cy="30" r="6" fill="#38BDF8" />
            <circle cx="65" cy="40" r="6" fill="#A3E635" />
            <circle cx="70" cy="60" r="6" fill="#F472B6" />
            <circle cx="45" cy="65" r="8" fill="#FDE047" opacity="0.8" />
        </svg>
    ),
    'Hati Emas': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-heart" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FB7185" />
                    <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>
            </defs>
            <path d="M50 85 C50 85 15 55 15 35 C15 20 30 15 40 25 C45 30 50 35 50 35 C50 35 55 30 60 25 C70 15 85 20 85 35 C85 55 50 85 50 85 Z" fill="url(#grad-heart)" />
            <path d="M30 35 C35 30 40 30 45 35" stroke="#FFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
        </svg>
    ),
    'Atlet Tangguh': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-shoe" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
            </defs>
            <path d="M85 70 L20 70 C15 70 15 65 20 60 L30 50 L40 50 C45 50 45 40 55 40 L65 40 C75 40 85 50 85 60 L85 70 Z" fill="url(#grad-shoe)" />
            <path d="M25 75 L80 75" stroke="#4C1D95" strokeWidth="6" strokeLinecap="round" />
            <path d="M50 40 L45 30 M60 40 L55 30" stroke="#FFF" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M10 65 L15 65 M5 55 L15 55 M10 45 L20 45" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
        </svg>
    ),
    'Pahlawan Sportivitas': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-medal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
                <linearGradient id="grad-ribbon" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#991B1B" />
                </linearGradient>
            </defs>
            <path d="M30 10 L45 40 L55 40 L70 10 Z" fill="url(#grad-ribbon)" />
            <circle cx="50" cy="65" r="25" fill="url(#grad-medal)" />
            <circle cx="50" cy="65" r="18" fill="#FFF" opacity="0.2" />
            <path d="M45 55 L55 65 M55 55 L45 65" stroke="#FFF" strokeWidth="4" strokeLinecap="round" />
            <path d="M42 62 C45 68 55 68 58 62" stroke="#FFF" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
    ),
    'Katalis Tim': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="grad-hands" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
            </defs>
            <path d="M40 70 L30 50 C25 40 35 30 40 40 L45 50 L50 25 C55 15 65 25 60 35 L55 55 C65 50 75 60 70 70 Z" fill="url(#grad-hands)" />
            <circle cx="50" cy="50" r="40" stroke="url(#grad-hands)" strokeWidth="4" strokeDasharray="10 10" fill="none" className="animate-[spin_10s_linear_infinite]" />
        </svg>
    ),
    'Default': (props) => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx="50" cy="50" r="40" fill="#CBD5E1" />
            <path d="M50 30 L50 50 M50 65 L50 70" stroke="#FFF" strokeWidth="8" strokeLinecap="round" />
        </svg>
    )
};

export default function BadgeIcon({ name, className = "w-12 h-12" }) {
    const IconComponent = icons[name] || icons['Default'];
    
    return (
        <div className={`relative group inline-block ${className}`}>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 z-0"></div>
            
            {/* The actual SVG icon */}
            <div className="relative z-10 w-full h-full transform transition-transform duration-300 group-hover:scale-110 drop-shadow-xl">
                <IconComponent className="w-full h-full drop-shadow-2xl" />
            </div>
        </div>
    );
}
