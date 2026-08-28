import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  ReporterIdCard,
  UserAccount,
  Language,
  ReporterDesignation,
} from '../types';
import { applyForIdCard, fetchUserIdCard } from '../lib/api';
import { StoryTodayLogo } from './StoryTodayLogo';
import {
  X,
  Download,
  Printer,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Camera,
  Upload,
  User,
  Phone,
  MapPin,
  FileText,
  BadgeCheck,
  Sparkles,
  QrCode,
  RotateCw,
  Eye,
  Info,
  Award,
  Check,
} from 'lucide-react';

// Official Story Today Seal Stamp Component
export const StoryTodaySeal: React.FC<{
  size?: number;
  className?: string;
  variant?: 'emerald' | 'crimson' | 'gold';
}> = ({ size = 96, className = '', variant = 'emerald' }) => {
  const colorMap = {
    emerald: {
      primary: '#004D40',
      secondary: '#059669',
      accent: '#D97706',
      bg: '#ECFDF5',
      border: '#004D40',
    },
    crimson: {
      primary: '#991B1B',
      secondary: '#DC2626',
      accent: '#B45309',
      bg: '#FEF2F2',
      border: '#991B1B',
    },
    gold: {
      primary: '#92400E',
      secondary: '#D97706',
      accent: '#F59E0B',
      bg: '#FFFBEB',
      border: '#B45309',
    },
  };

  const colors = colorMap[variant] || colorMap.emerald;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      title="Story Today Official Editorial Seal"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full filter drop-shadow-xs transition-transform duration-300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Serrated Starburst / Beaded Rim */}
        <circle
          cx="100"
          cy="100"
          r="95"
          stroke={colors.primary}
          strokeWidth="2"
          strokeDasharray="4 2.5"
        />
        <circle cx="100" cy="100" r="91" stroke={colors.primary} strokeWidth="3" />
        <circle cx="100" cy="100" r="86" stroke={colors.secondary} strokeWidth="1.2" />

        {/* Inner Ring */}
        <circle cx="100" cy="100" r="62" stroke={colors.primary} strokeWidth="2.5" />
        <circle cx="100" cy="100" r="58" stroke={colors.secondary} strokeWidth="1" strokeDasharray="2 2" />

        {/* Circular Text Paths */}
        <defs>
          <path id="sealTopArc" d="M 23, 100 A 77, 77 0 1, 1 177, 100" />
          <path id="sealBottomArc" d="M 177, 100 A 77, 77 0 0, 1 23, 100" />
        </defs>

        <text
          fill={colors.primary}
          style={{
            fontSize: '11px',
            fontWeight: 900,
            fontFamily: 'serif',
            letterSpacing: '2.5px',
          }}
        >
          <textPath href="#sealTopArc" startOffset="50%" textAnchor="middle">
            ★ STORY TODAY PRESS ★
          </textPath>
        </text>

        <text
          fill={colors.secondary}
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            fontFamily: 'sans-serif',
            letterSpacing: '1.8px',
          }}
        >
          <textPath href="#sealBottomArc" startOffset="50%" textAnchor="middle">
            EDITORIAL BUREAU • NEW DELHI
          </textPath>
        </text>

        {/* Center Emblem Background */}
        <circle cx="100" cy="100" r="55" fill={colors.bg} fillOpacity="0.85" />

        {/* Pen Nib & Star Emblem */}
        <g transform="translate(100, 75) scale(0.9)">
          <path
            d="M 0, -18 L 12, -2 L 7, 14 L -7, 14 L -12, -2 Z"
            fill={colors.primary}
          />
          <path
            d="M 0, -18 L 0, 8"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="0" cy="8" r="1.8" fill="#FFFFFF" />
          <circle cx="-16" cy="2" r="2.5" fill={colors.accent} />
          <circle cx="16" cy="2" r="2.5" fill={colors.accent} />
        </g>

        {/* Center Official Text */}
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fill={colors.primary}
          style={{
            fontSize: '12px',
            fontWeight: 900,
            fontFamily: 'sans-serif',
            letterSpacing: '1.5px',
          }}
        >
          OFFICIAL
        </text>
        <text
          x="100"
          y="122"
          textAnchor="middle"
          fill={colors.accent}
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            fontFamily: 'sans-serif',
            letterSpacing: '2px',
          }}
        >
          ★ SEAL ★
        </text>
        <text
          x="100"
          y="134"
          textAnchor="middle"
          fill={colors.secondary}
          style={{
            fontSize: '8px',
            fontWeight: 800,
            fontFamily: 'monospace',
            letterSpacing: '1px',
          }}
        >
          VERIFIED PRESS
        </text>
      </svg>
    </div>
  );
};

interface ReporterIdCardModalProps {
  lang: Language;
  currentUser: UserAccount;
  onClose: () => void;
  onUserUpdate?: (updatedUser: UserAccount) => void;
  previewCard?: ReporterIdCard; // If admin is previewing a specific card
  isAdminPreview?: boolean;
}

const DESIGNATION_OPTIONS: ReporterDesignation[] = [
  'News Reporter',
  'Staff Reporter',
  'Correspondent',
  'Senior Correspondent',
  'Blogger',
  'Bureau Chief',
  'Citizen Journalist',
  'Photojournalist',
];

export const ReporterIdCardModal: React.FC<ReporterIdCardModalProps> = ({
  lang,
  currentUser,
  onClose,
  onUserUpdate,
  previewCard,
  isAdminPreview = false,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [idCard, setIdCard] = useState<ReporterIdCard | null>(previewCard || currentUser.idCard || null);
  const [isLoading, setIsLoading] = useState<boolean>(!previewCard);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [mode, setMode] = useState<'view' | 'apply'>(() => {
    if (previewCard) return 'view';
    if (!currentUser.idCard || currentUser.idCard.status === 'not_applied') return 'apply';
    return 'view';
  });

  // Application Form State
  const [fullName, setFullName] = useState<string>(
    previewCard?.fullName || currentUser.idCard?.fullName || currentUser.name || ''
  );
  const [designation, setDesignation] = useState<string>(
    previewCard?.designation || currentUser.idCard?.designation || 'News Reporter'
  );
  const [address, setAddress] = useState<string>(
    previewCard?.address || currentUser.idCard?.address || ''
  );
  const [mobileNumber, setMobileNumber] = useState<string>(
    previewCard?.mobileNumber || currentUser.idCard?.mobileNumber || currentUser.phone || ''
  );
  const [idProofType, setIdProofType] = useState<'aadhaar' | 'passport' | 'voter_id' | 'other'>(
    (previewCard?.idProofType as any) || (currentUser.idCard?.idProofType as any) || 'aadhaar'
  );
  const [idProofNumber, setIdProofNumber] = useState<string>(
    previewCard?.idProofNumber || currentUser.idCard?.idProofNumber || ''
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    previewCard?.photoUrl || currentUser.idCard?.photoUrl || currentUser.avatar || ''
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardFrontRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);

  // Fetch latest ID card status on mount if not admin preview
  useEffect(() => {
    if (previewCard) {
      setIdCard(previewCard);
      setIsLoading(false);
      return;
    }

    async function loadCard() {
      setIsLoading(true);
      try {
        const card = await fetchUserIdCard(currentUser.id);
        if (card) {
          setIdCard(card);
          setFullName(card.fullName);
          setDesignation(card.designation);
          setAddress(card.address);
          setMobileNumber(card.mobileNumber);
          setIdProofType(card.idProofType as any || 'aadhaar');
          setIdProofNumber(card.idProofNumber);
          if (card.photoUrl) setPhotoUrl(card.photoUrl);
          if (card.status === 'approved' || card.status === 'pending') {
            setMode('view');
          }
        }
      } catch (err) {
        console.error('Error fetching ID card:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCard();
  }, [currentUser.id, previewCard]);

  // Handle Photo upload with client-side optimization
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(lang === 'hi' ? 'कृपया केवल छवि (Image) फ़ाइल चुनें।' : 'Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      
      // Auto-compress & scale image using an offscreen canvas
      const img = new Image();
      img.onload = () => {
        const maxDim = 600;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setPhotoUrl(compressedDataUrl);
        } else {
          setPhotoUrl(rawDataUrl);
        }
        setErrorMessage(null);
      };
      img.onerror = () => {
        setPhotoUrl(rawDataUrl);
        setErrorMessage(null);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Application Submit
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage(lang === 'hi' ? 'कृपया पूरा नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }
    if (!address.trim()) {
      setErrorMessage(lang === 'hi' ? 'कृपया पूरा पता दर्ज करें।' : 'Please enter your full address.');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMessage(lang === 'hi' ? 'कृपया मोबाइल नंबर दर्ज करें।' : 'Please enter your mobile number.');
      return;
    }
    if (!idProofNumber.trim()) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया मान्य पहचान प्रमाण (आधार/पासपोर्ट) संख्या दर्ज करें।'
          : 'Please enter your ID proof (Aadhaar/Passport) number.'
      );
      return;
    }
    if (!photoUrl.trim()) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया पहचान पत्र हेतु अपनी पासपोर्ट साइज़ फ़ोटो अपलोड करें।'
          : 'Please upload your passport-sized photograph for the ID card.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await applyForIdCard({
        userId: currentUser.id || currentUser.username || 'user_reporter',
        fullName: fullName.trim(),
        designation: designation.trim(),
        address: address.trim(),
        mobileNumber: mobileNumber.trim(),
        idProofType,
        idProofNumber: idProofNumber.trim(),
        photoUrl: photoUrl.trim(),
      });

      if (result.success && result.idCard) {
        setIdCard(result.idCard);
        setMode('view');
        setSuccessMessage(
          lang === 'hi'
            ? 'पहचान पत्र का आवेदन सफलतापूर्वक जमा हो गया है! व्यवस्थापक (Admin) की स्वीकृति के बाद आप इसे डाउनलोड कर सकेंगे।'
            : 'Identity Card application submitted successfully! You can download it once approved by the Admin.'
        );
        if (onUserUpdate) {
          onUserUpdate({
            ...currentUser,
            avatar: photoUrl || currentUser.avatar,
            idCard: result.idCard,
          });
        }
      } else {
        setErrorMessage(result.error || 'Failed to submit application.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while applying for ID Card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // High-Resolution Card Download Engine using HTML5 Canvas & jsPDF (Official PDF Format)
  const handleDownloadCard = async () => {
    if (!idCard || idCard.status !== 'approved') return;
    setIsDownloading(true);

    try {
      // Create offscreen canvas for high-DPI rendering (300 DPI print quality)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cardWidth = 720;
      const cardHeight = 1080;
      const margin = 40;

      // Dual layout: Front & Back side-by-side on canvas
      canvas.width = cardWidth * 2 + margin * 3;
      canvas.height = cardHeight + margin * 2;

      // Fill Clean Neutral Background for PDF
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Helper function to draw rounded rectangle with optional fill and border
      const drawRoundRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number,
        fillColor: string,
        strokeColor?: string,
        lineWidth?: number
      ) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        if (strokeColor && lineWidth) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      // Helper to draw security guilloche background pattern
      const drawSecurityPattern = (x: number, y: number, w: number, h: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.strokeStyle = 'rgba(0, 77, 64, 0.04)';
        ctx.lineWidth = 1;
        for (let i = -w; i < w + h; i += 24) {
          ctx.beginPath();
          ctx.moveTo(x + i, y);
          ctx.lineTo(x + i + h, y + h);
          ctx.stroke();
        }
        for (let i = 0; i < w + h * 2; i += 24) {
          ctx.beginPath();
          ctx.moveTo(x + i, y + h);
          ctx.lineTo(x + i - h, y);
          ctx.stroke();
        }
        ctx.restore();
      };

      // Helper to draw the official Story Today seal stamp in canvas
      const drawOfficialSeal = (cx: number, cy: number, radius: number) => {
        ctx.save();
        // Outer dashed security circle
        ctx.strokeStyle = '#004D40';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid circles
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 24, 0, Math.PI * 2);
        ctx.stroke();

        // Background core
        ctx.fillStyle = '#ECFDF5';
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 25, 0, Math.PI * 2);
        ctx.fill();

        // Center emblem text
        ctx.fillStyle = '#004D40';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('OFFICIAL', cx, cy - 14);

        ctx.fillStyle = '#D97706';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('★ SEAL ★', cx, cy);

        ctx.fillStyle = '#059669';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('PRESS BUREAU', cx, cy + 12);
        ctx.fillText('NEW DELHI', cx, cy + 22);

        // Circular perimeter text
        ctx.fillStyle = '#004D40';
        ctx.font = 'bold 9px serif';
        const topText = 'STORY TODAY • PRESS CREDENTIAL';
        const angleStep = Math.PI / (topText.length + 1);
        for (let i = 0; i < topText.length; i++) {
          const char = topText[i];
          const angle = -Math.PI * 0.85 + (i + 1) * angleStep;
          const tx = cx + (radius - 14) * Math.cos(angle);
          const ty = cy + (radius - 14) * Math.sin(angle);
          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(angle + Math.PI / 2);
          ctx.fillText(char, 0, 0);
          ctx.restore();
        }
        ctx.restore();
      };

      // Helper to draw official Story Today Logo Emblem in canvas
      const drawLogoEmblem = (lx: number, ly: number, size: number) => {
        ctx.save();
        // Base rounded shield
        drawRoundRect(lx, ly, size, size, 12, '#004D40', '#80CBC4', 1.5);
        // Newspaper sheet
        drawRoundRect(lx + size * 0.2, ly + size * 0.16, size * 0.6, size * 0.68, 6, '#FFFFFF');
        // Top red masthead bar
        drawRoundRect(lx + size * 0.26, ly + size * 0.22, size * 0.48, size * 0.12, 3, '#E11D48');
        // Headline bar
        drawRoundRect(lx + size * 0.26, ly + size * 0.4, size * 0.3, size * 0.06, 2, '#004D40');
        // News lines
        drawRoundRect(lx + size * 0.26, ly + size * 0.52, size * 0.48, size * 0.04, 1, '#1E293B');
        drawRoundRect(lx + size * 0.26, ly + size * 0.6, size * 0.48, size * 0.04, 1, '#475569');
        drawRoundRect(lx + size * 0.26, ly + size * 0.68, size * 0.32, size * 0.04, 1, '#64748B');
        // Beacon dot
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(lx + size * 0.68, ly + size * 0.43, size * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      // Load image helper
      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          if (!src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = src;
        });
      };

      // Pre-load the official Story Today Logo Image (Custom uploaded or official vector SVG)
      let logoImg: HTMLImageElement | null = null;
      try {
        const storedLogo = localStorage.getItem('story_today_custom_logo');
        if (storedLogo && storedLogo.trim() !== '') {
          try {
            logoImg = await loadImg(storedLogo);
          } catch {
            logoImg = null;
          }
        }
        if (!logoImg) {
          const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" width="216" height="216">
            <defs>
              <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3" />
              </filter>
            </defs>
            <rect x="3" y="3" width="48" height="48" rx="13" fill="#004D40" filter="url(#logoShadow)" />
            <rect x="4" y="4" width="46" height="46" rx="12" stroke="#80CBC4" stroke-width="1.5" stroke-opacity="0.7" fill="none" />
            <rect x="11.5" y="10.5" width="31" height="33" rx="3.5" fill="#002D25" />
            <rect x="13.5" y="11.5" width="27" height="31" rx="3" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="0.75" />
            <rect x="16.5" y="14.5" width="21" height="5.5" rx="1.5" fill="#E11D48" />
            <rect x="16.5" y="22.5" width="13" height="3" rx="0.8" fill="#004D40" />
            <rect x="16.5" y="27.5" width="21" height="2" rx="0.6" fill="#1E293B" />
            <rect x="16.5" y="31" width="21" height="2" rx="0.6" fill="#334155" />
            <rect x="16.5" y="34.5" width="15" height="2" rx="0.6" fill="#64748B" />
            <rect x="16.5" y="38" width="11" height="1.8" rx="0.5" fill="#94A3B8" />
            <circle cx="34.5" cy="23.5" r="4" fill="#004D40" />
            <circle cx="34.5" cy="23.5" r="2.2" fill="#E0F2F1" />
            <circle cx="34.5" cy="23.5" r="1.1" fill="#E11D48" />
            <circle cx="48" cy="6" r="4.5" fill="#E11D48" stroke="#FFFFFF" stroke-width="1.5" />
          </svg>`;
          const encodedSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
          logoImg = await loadImg(encodedSvg);
        }
      } catch (err) {
        console.warn('Could not load vector logo image, using canvas emblem fallback', err);
      }

      // -------------------------------------------------------------
      // 1. DRAW FRONT CARD (x: margin, y: margin)
      // -------------------------------------------------------------
      const fx = margin;
      const fy = margin;

      // Card Base with Double Border
      drawRoundRect(fx, fy, cardWidth, cardHeight, 28, '#FFFFFF', '#004D40', 4);
      drawSecurityPattern(fx + 6, fy + 200, cardWidth - 12, cardHeight - 310);

      // Header Bar - Deep Emerald
      ctx.save();
      ctx.beginPath();
      ctx.rect(fx, fy, cardWidth, 205);
      ctx.fillStyle = '#004D40';
      ctx.fill();
      ctx.restore();

      // Top Corner Decorative Gold Corner Brackets
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 3;

      // Header Story Today Logo + Typography
      if (logoImg) {
        ctx.drawImage(logoImg, fx + 42, fy + 25, 74, 74);
      } else {
        drawLogoEmblem(fx + 42, fy + 25, 74);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 35px serif, "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('STORY TODAY', fx + 132, fy + 64);

      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText('PRESS & MEDIA CREDENTIAL', fx + 132, fy + 89);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#E0F2F1';
      ctx.fillText('राष्ट्रीय एवं प्रांतीय स्वतंत्र पत्रकारिता मंच', fx + 132, fy + 111);

      // Gold Accent Strip
      ctx.fillStyle = '#D97706';
      ctx.fillRect(fx, fy + 205, cardWidth, 8);

      // "NON-SALARIED POSITION" Banner in Header
      drawRoundRect(fx + 60, fy + 145, cardWidth - 120, 38, 19, '#DC2626', '#F87171', 1.5);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ THIS IS A NON-SALARIED POSITION / यह एक अवैतनिक पद है ★', fx + cardWidth / 2, fy + 170);

      // Photo Placement
      const photoX = fx + cardWidth / 2 - 110;
      const photoY = fy + 240;
      const photoSize = 220;

      // Photo Outer Border & Shadow
      drawRoundRect(photoX - 8, photoY - 8, photoSize + 16, photoSize + 16, 20, '#F8FAFC', '#D97706', 4);

      try {
        if (idCard.photoUrl) {
          const userPhoto = await loadImg(idCard.photoUrl);
          ctx.save();
          ctx.beginPath();
          ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(userPhoto, photoX, photoY, photoSize, photoSize);
          ctx.restore();
        } else {
          drawRoundRect(photoX, photoY, photoSize, photoSize, 16, '#004D40');
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 70px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(idCard.fullName.charAt(0).toUpperCase(), photoX + photoSize / 2, photoY + 135);
        }
      } catch {
        drawRoundRect(photoX, photoY, photoSize, photoSize, 16, '#004D40');
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 70px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(idCard.fullName.charAt(0).toUpperCase(), photoX + photoSize / 2, photoY + 135);
      }

      // Reporter Full Name
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(idCard.fullName.toUpperCase(), fx + cardWidth / 2, fy + 510);

      // Designation Pill
      drawRoundRect(fx + 120, fy + 535, cardWidth - 240, 44, 22, '#ECFDF5', '#059669', 2);
      ctx.fillStyle = '#065F46';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`● ${idCard.designation.toUpperCase()} ●`, fx + cardWidth / 2, fy + 564);

      // Details Table Container
      const tableY = fy + 605;
      drawRoundRect(fx + 35, tableY, cardWidth - 70, 310, 16, '#F8FAFC', '#E2E8F0', 1.5);

      ctx.textAlign = 'left';
      const drawField = (label: string, value: string, curY: number) => {
        ctx.fillStyle = '#64748B';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(label.toUpperCase(), fx + 60, curY);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 18px sans-serif';
        const maxValW = cardWidth - 260;
        if (ctx.measureText(value).width > maxValW) {
          ctx.font = 'bold 15px sans-serif';
        }
        ctx.fillText(value, fx + 230, curY);

        // Divider
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx + 60, curY + 12);
        ctx.lineTo(fx + cardWidth - 60, curY + 12);
        ctx.stroke();
      };

      drawField('Card No:', idCard.cardNumber || 'ST-PRESS-2026-ACTIVE', tableY + 45);
      drawField('Mobile:', idCard.mobileNumber, tableY + 95);
      drawField('ID Proof:', `${idCard.idProofType.toUpperCase()}: ${idCard.idProofNumber}`, tableY + 145);
      drawField('Address:', idCard.address.length > 36 ? idCard.address.slice(0, 36) + '...' : idCard.address, tableY + 195);
      drawField('Issued On:', idCard.approvedAt ? new Date(idCard.approvedAt).toLocaleDateString('en-IN') : '2026', tableY + 245);
      drawField('Valid Till:', idCard.validUntil ? new Date(idCard.validUntil).toLocaleDateString('en-IN') : '2028', tableY + 290);

      // Official Stamp on Front Card (Bottom Right corner)
      drawOfficialSeal(fx + cardWidth - 110, tableY + 225, 52);

      // Card Footer with Security Strip & Signatures
      const footerY = fy + cardHeight - 110;
      ctx.fillStyle = '#004D40';
      ctx.fillRect(fx, footerY, cardWidth, 110);

      ctx.fillStyle = '#D97706';
      ctx.fillRect(fx, footerY, cardWidth, 4);

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('VERIFIED PRESS HOLDER', fx + 40, footerY + 45);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText('Democratic Citizen Journalism Bureau', fx + 40, footerY + 70);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#FDE68A';
      ctx.font = 'italic bold 19px cursive, serif';
      ctx.fillText('Chief Editor', fx + cardWidth - 40, footerY + 48);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Authorized Signatory & Editorial Desk', fx + cardWidth - 40, footerY + 72);

      // -------------------------------------------------------------
      // 2. DRAW BACK CARD (x: fx + cardWidth + margin, y: margin)
      // -------------------------------------------------------------
      const bx = fx + cardWidth + margin;
      const by = margin;

      // Back Card Base
      drawRoundRect(bx, by, cardWidth, cardHeight, 28, '#FFFFFF', '#004D40', 4);
      drawSecurityPattern(bx + 6, by + 140, cardWidth - 12, cardHeight - 250);

      // Top Banner with Logo
      drawRoundRect(bx, by, cardWidth, 125, 28, '#004D40');
      ctx.fillStyle = '#004D40';
      ctx.fillRect(bx, by + 50, cardWidth, 75);

      ctx.fillStyle = '#D97706';
      ctx.fillRect(bx, by + 125, cardWidth, 6);

      if (logoImg) {
        ctx.drawImage(logoImg, bx + 36, by + 26, 68, 68);
      } else {
        drawLogoEmblem(bx + 36, by + 26, 68);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px serif, "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('STORY TODAY — PRESS RECOGNITION', bx + 120, by + 65);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText('Editorial Guidelines & Legal Declarations', bx + 120, by + 92);

      // Crucial Disclaimer Box (Required by guidelines)
      const discY = by + 155;
      drawRoundRect(bx + 35, discY, cardWidth - 70, 230, 16, '#FEF2F2', '#DC2626', 2.5);

      ctx.fillStyle = '#991B1B';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ MANDATORY LEGAL DISCLAIMER & TERMS', bx + cardWidth / 2, discY + 38);

      ctx.fillStyle = '#7F1D1D';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('THIS IS A NON-SALARIED POSITION / यह एक अवैतनिक पद है', bx + cardWidth / 2, discY + 70);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';

      // English disclaimer
      const discEng =
        '"The holder is fully responsible for any misuse of this Identity Card. Story Today is not responsible for any misuse."';
      ctx.font = 'italic bold 13.5px sans-serif';
      ctx.fillStyle = '#991B1B';
      ctx.fillText(discEng, bx + 55, discY + 110);

      // Hindi disclaimer
      const discHi =
        'इस पहचान पत्र के किसी भी प्रकार के दुरुपयोग के लिए धारक स्वयं पूर्ण रूप से उत्तरदायी होगा। स्टोरी टुडे इसके लिए जिम्मेदार नहीं है।';
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#4B5563';
      ctx.fillText(discHi, bx + 55, discY + 150);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Holders must uphold the highest standards of journalistic integrity and truth.', bx + 55, discY + 190);

      // Guidelines & Rules Container
      const rulesY = by + 410;
      drawRoundRect(bx + 35, rulesY, cardWidth - 70, 380, 16, '#F8FAFC', '#E2E8F0', 1.5);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TERMS OF PRESS ISSUANCE / दिशा-निर्देश', bx + 60, rulesY + 45);

      const rules = [
        '1. This credential certifies the holder as a freelance/voluntary reporter for Story Today.',
        '2. The holder is authorized to cover public events, civic grievances, and community news.',
        '3. This card does not confer any government authority, police powers, or immunity.',
        '4. Card must be surrendered immediately upon cessation of freelance affiliation.',
        '5. If lost or found, please return to Story Today Central Editorial Desk.',
      ];

      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#334155';
      rules.forEach((rule, idx) => {
        ctx.fillText(rule, bx + 60, rulesY + 88 + idx * 36);
      });

      // Verification Barcode / QR Simulation & Official Stamp
      const qrY = rulesY + 275;
      drawRoundRect(bx + 60, qrY, 200, 85, 10, '#FFFFFF', '#004D40', 1.5);
      ctx.fillStyle = '#004D40';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DIGITAL PRESS ID', bx + 160, qrY + 32);
      ctx.font = '11px monospace';
      ctx.fillText(idCard.cardNumber || 'ST-PRESS-2026', bx + 160, qrY + 54);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Scan to Verify Credential', bx + 160, qrY + 72);

      // Official Stamp on Back Card
      drawOfficialSeal(bx + cardWidth - 140, qrY + 42, 54);

      // Back Footer
      const bFooterY = by + cardHeight - 120;
      drawRoundRect(bx + 35, bFooterY, cardWidth - 70, 90, 14, '#004D40');
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STORY TODAY EDITORIAL BUREAU', bx + cardWidth / 2, bFooterY + 35);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText('Citizen Journalism & Democratic Civic Accountability Platform', bx + cardWidth / 2, bFooterY + 60);

      // -------------------------------------------------------------
      // 3. GENERATE HIGH-QUALITY PDF (A4 Landscape Print Format)
      // -------------------------------------------------------------
      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // A4 Landscape: 297mm x 210mm
      const pageWidth = 297;
      const pageHeight = 210;

      // Header banner in PDF document
      pdf.setFillColor(0, 77, 64);
      pdf.rect(0, 0, pageWidth, 16, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text('STORY TODAY — OFFICIAL ACCREDITED PRESS IDENTITY CARD', 14, 11);

      pdf.setFontSize(8);
      pdf.setTextColor(167, 243, 208);
      pdf.text('Official Printable Press Credential (Front & Back) • High-Resolution Print Ready', pageWidth - 14, 11, {
        align: 'right',
      });

      // Embed the dual-card graphic
      // Aspect ratio of canvas: (canvas.width / canvas.height)
      const targetW = 270;
      const targetH = (canvas.height * targetW) / canvas.width;
      const posX = (pageWidth - targetW) / 2;
      const posY = 22;

      pdf.addImage(imgData, 'JPEG', posX, posY, targetW, targetH);

      // Printable Cut & Laminate Guide Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        'Instructions: Print on 300 GSM photo-paper/cardstock, cut along card borders, fold or laminate for official media badge.',
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );

      const cleanName = idCard.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`StoryToday_Press_ID_Card_${cleanName}.pdf`);
    } catch (err) {
      console.error('Error rendering ID card PDF:', err);
      alert('Error generating PDF card. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Browser Print Trigger
  const handlePrint = () => {
    window.print();
  };

  const isApproved = idCard?.status === 'approved';
  const isPending = idCard?.status === 'pending';
  const isRejected = idCard?.status === 'rejected';

  return (
    <div
      id="reporter-id-card-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="reporter-id-card-modal"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Bar */}
        <div className="bg-[#004D40] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <StoryTodayLogo size="sm" />
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif flex items-center gap-2">
                <span>{lang === 'hi' ? 'पत्रकार पहचान पत्र (Press ID Card)' : 'Reporter Press Identity Card'}</span>
                {isApproved && (
                  <span className="text-[10px] uppercase font-sans tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                    {lang === 'hi' ? 'स्वीकृत व सक्रिय' : 'Approved & Active'}
                  </span>
                )}
                {isPending && (
                  <span className="text-[10px] uppercase font-sans tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                    {lang === 'hi' ? 'प्रतीक्षारत' : 'Pending Review'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#A7F3D0] mt-0.5">
                {lang === 'hi'
                  ? 'स्टोरी टुडे का आधिकारिक डिजिटल पत्रकार परिचय पत्र'
                  : 'Official Press & Media Credential for Story Today Journalists'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAdminPreview && currentUser.role === 'reporter' && idCard && (
              <button
                onClick={() => setMode(mode === 'view' ? 'apply' : 'view')}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                {mode === 'view'
                  ? lang === 'hi'
                    ? 'विवरण बदलें'
                    : 'Edit Application'
                  : lang === 'hi'
                  ? 'कार्ड देखें'
                  : 'View Card'}
              </button>
            )}
            <button
              id="btn-close-id-card-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-[#FAFAFA]">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-gray-500">
                {lang === 'hi' ? 'पहचान पत्र लोड हो रहा है...' : 'Loading Identity Card...'}
              </p>
            </div>
          ) : mode === 'apply' ? (
            /* =========================================================================
             * APPLICATION FORM MODE
             * ========================================================================= */
            <form onSubmit={handleApply} className="max-w-2xl mx-auto space-y-5 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#004D40]" />
                  <span>{lang === 'hi' ? 'पत्रकार पहचान पत्र हेतु आवेदन' : 'Apply for Reporter Press Identity Card'}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'hi'
                    ? 'कृपया अपने वास्तविक विवरण दर्ज करें। व्यवस्थापक द्वारा सत्यापन के बाद आपका पहचान पत्र जारी किया जाएगा।'
                    : 'Please provide your accurate details. The ID card will be issued after editorial review and verification.'}
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-white border-2 border-[#004D40] shadow-xs flex items-center justify-center">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="ID Photo"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-2 text-gray-400">
                        <Camera className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                        <span className="text-[10px] font-bold block">{lang === 'hi' ? 'फ़ोटो अपलोड करें' : 'Passport Photo'}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full py-1 px-2 bg-[#004D40] text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-[#00382E] transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{photoUrl ? (lang === 'hi' ? 'फ़ोटो बदलें' : 'Change') : lang === 'hi' ? 'फ़ोटो चुनें' : 'Upload'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 space-y-1 text-xs text-gray-600">
                  <h4 className="font-bold text-gray-900">{lang === 'hi' ? 'पहचान पत्र फ़ोटो निर्देश:' : 'ID Photo Instructions:'}</h4>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-gray-500">
                    <li>{lang === 'hi' ? 'स्पष्ट, सामने से ली गई पासपोर्ट आकार की फ़ोटो।' : 'Clear, front-facing passport style photograph.'}</li>
                    <li>{lang === 'hi' ? 'सफेद या हल्का पृष्ठभूमि (Light background)।' : 'White or plain neutral background.'}</li>
                    <li>{lang === 'hi' ? 'अधिकतम फ़ाइल आकार 5MB (JPG/PNG)।' : 'Maximum file size: 5MB (JPG/PNG).'}</li>
                  </ul>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    {lang === 'hi' ? 'पूरा नाम (Full Name) *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar Sharma"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#004D40] focus:ring-1 focus:ring-[#004D40]"
                    required
                  />
                </div>

                {/* Designation */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    {lang === 'hi' ? 'पद / पदनाम (Designation) *' : 'Designation *'}
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#004D40] bg-white"
                  >
                    {DESIGNATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    {lang === 'hi' ? 'मोबाइल नंबर (Mobile Number) *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#004D40]"
                    required
                  />
                </div>

                {/* ID Proof Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    {lang === 'hi' ? 'पहचान प्रमाण प्रकार (ID Proof Type) *' : 'ID Proof Type *'}
                  </label>
                  <select
                    value={idProofType}
                    onChange={(e) => setIdProofType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#004D40] bg-white"
                  >
                    <option value="aadhaar">Aadhaar Card (आधार कार्ड)</option>
                    <option value="passport">Passport (पासपोर्ट)</option>
                    <option value="voter_id">Voter ID Card (मतदाता पहचान पत्र)</option>
                    <option value="other">Press Council / Other Valid ID</option>
                  </select>
                </div>

                {/* ID Proof Number */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700">
                    {lang === 'hi'
                      ? 'पहचान प्रमाण संख्या (Aadhaar / Passport / ID Number) *'
                      : 'ID Proof Number (Aadhaar / Passport / Card No.) *'}
                  </label>
                  <input
                    type="text"
                    value={idProofNumber}
                    onChange={(e) => setIdProofNumber(e.target.value)}
                    placeholder={
                      idProofType === 'aadhaar'
                        ? 'XXXX XXXX 1234'
                        : idProofType === 'passport'
                        ? 'Z1234567'
                        : 'ID Number'
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#004D40]"
                    required
                  />
                </div>

                {/* Full Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700">
                    {lang === 'hi' ? 'पूरा आवासीय / ब्यूरो पता (Complete Address) *' : 'Residential / Bureau Address *'}
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Office No, Street, Landmark, City, State, PIN Code"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#004D40]"
                    required
                  />
                </div>
              </div>

              {/* Required Non-Salaried & Misuse Legal Disclaimers */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2 text-amber-900">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">
                      {lang === 'hi'
                        ? 'महत्वपूर्ण घोषणा (Non-Salaried Position):'
                        : 'Mandatory Declaration (Non-Salaried Position):'}
                    </p>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      {lang === 'hi'
                        ? 'यह एक अवैतनिक पद है (This is a Non-Salaried position)। यह परिचय पत्र केवल स्वतंत्र पत्रकारिता योगदान हेतु जारी किया जाता है।'
                        : 'This is a Non-Salaried position. This Identity Card is issued strictly for independent news reporting and civic dispatch.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-amber-200/60">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">
                      {lang === 'hi' ? 'दुरुपयोग संबंधी उत्तरदायित्व (Legal Disclaimer):' : 'Misuse Responsibility:'}
                    </p>
                    <p className="text-[11px] text-amber-900 mt-0.5 italic">
                      "The holder is fully responsible for any misuse of this Identity Card. Story Today is not responsible for any misuse."
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (idCard) setMode('view');
                    else onClose();
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  id="btn-submit-id-card-app"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{lang === 'hi' ? 'आवेदन जमा हो रहा है...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'पहचान पत्र हेतु आवेदन करें' : 'Submit ID Card Application'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* =========================================================================
             * CARD VIEW / PREVIEW & DOWNLOAD MODE
             * ========================================================================= */
            <div className="space-y-6">
              {/* Status Header Banner */}
              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {isPending && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-950 text-sm">
                        {lang === 'hi' ? 'पहचान पत्र अनुमोदन प्रतीक्षारत है' : 'ID Card Application Under Review'}
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {lang === 'hi'
                          ? 'आपका आवेदन मुख्य संपादक / व्यवस्थापक (Admin) के पास समीक्षा हेतु जमा है। स्वीकृति मिलते ही PDF डाउनलोड विकल्प उपलब्ध हो जाएगा।'
                          : 'Your application has been submitted to the Editorial Admin. Once approved, you can download your official PDF ID Card.'}
                      </p>
                    </div>
                  </div>

                  {!isAdminPreview && (
                    <button
                      onClick={() => setMode('apply')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 transition-colors cursor-pointer"
                    >
                      {lang === 'hi' ? 'विवरण सुधारें' : 'Edit Details'}
                    </button>
                  )}
                </div>
              )}

              {isRejected && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-red-950 text-sm">
                        {lang === 'hi' ? 'आवेदन अस्वीकृत (Rejected)' : 'Application Rejected by Admin'}
                      </h4>
                      <p className="text-xs text-red-800 mt-0.5">
                        <strong>{lang === 'hi' ? 'कारण:' : 'Reason:'}</strong>{' '}
                        {idCard?.rejectionReason || 'Identity proof could not be verified.'}
                      </p>
                    </div>
                  </div>

                  {!isAdminPreview && (
                    <button
                      onClick={() => setMode('apply')}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-xs shrink-0 transition-colors cursor-pointer"
                    >
                      {lang === 'hi' ? 'पुनः आवेदन करें' : 'Re-Apply'}
                    </button>
                  )}
                </div>
              )}

              {/* View Side Selector (Front / Back / Both) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveSide('front')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSide === 'front'
                        ? 'bg-white text-[#004D40] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {lang === 'hi' ? 'मुख पृष्ठ (Front Side)' : 'Front Side'}
                  </button>
                  <button
                    onClick={() => setActiveSide('back')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSide === 'back'
                        ? 'bg-white text-[#004D40] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {lang === 'hi' ? 'पृष्ठ भाग (Back Side)' : 'Back Side'}
                  </button>
                </div>

                {/* Download & Print Controls (Only enabled when Approved) */}
                <div className="flex items-center gap-2">
                  {isApproved ? (
                    <>
                      <button
                        id="btn-print-id-card"
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        title="Print Identity Card"
                      >
                        <Printer className="w-3.5 h-3.5 text-gray-600" />
                        <span>{lang === 'hi' ? 'प्रिंट करें' : 'Print'}</span>
                      </button>

                      <button
                        id="btn-download-id-card-pdf"
                        onClick={handleDownloadCard}
                        disabled={isDownloading}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50 border border-emerald-600/40"
                      >
                        {isDownloading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{lang === 'hi' ? 'पहचान पत्र डाउनलोड करें (PDF)' : 'Download ID Card (PDF)'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'एडमिन स्वीकृति के बाद PDF डाउनलोड करें' : 'PDF Download enabled after Admin Approval'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* =========================================================================
               * THE IDENTITY CARD RENDERER (Clean, Authentic Press Card with Official Logo & Seal)
               * ========================================================================= */}
              <div className="flex justify-center py-2">
                {activeSide === 'front' ? (
                  /* FRONT CARD VIEW */
                  <div
                    ref={cardFrontRef}
                    id="id-card-front-preview"
                    className="w-full max-w-[390px] bg-white rounded-2xl border-2 border-[#004D40] shadow-2xl overflow-hidden text-[#111827] flex flex-col relative animate-in fade-in duration-200"
                  >
                    {/* Top Header with Story Today Official Logo */}
                    <div className="bg-gradient-to-r from-[#004D40] via-[#00382E] to-[#004D40] text-white p-3.5 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
                      
                      {/* Logo + Masthead Header */}
                      <div className="flex items-center justify-center gap-2.5">
                        <StoryTodayLogo size="sm" />
                        <div className="text-left">
                          <div className="font-serif font-black text-lg tracking-tight text-white leading-none">
                            STORY TODAY
                          </div>
                          <p className="text-[9px] font-extrabold tracking-[0.2em] text-[#A7F3D0] uppercase mt-1">
                            PRESS & MEDIA CREDENTIAL
                          </p>
                        </div>
                      </div>

                      <p className="text-[9px] text-[#E0F2F1] mt-1.5">
                        राष्ट्रीय एवं प्रांतीय स्वतंत्र पत्रकारिता मंच
                      </p>

                      {/* Prominent Non-Salaried Pill */}
                      <div className="mt-2 inline-block bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-red-400 shadow-xs">
                        ★ THIS IS A NON-SALARIED POSITION ★
                      </div>
                    </div>

                    {/* Gold Accent Separator Strip */}
                    <div className="h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 w-full" />

                    {/* Photo & Name Section */}
                    <div className="p-4 flex flex-col items-center text-center bg-gradient-to-b from-gray-50/90 via-white to-white relative">
                      {/* Subtle Watermark in background */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
                        <span className="font-serif font-black text-5xl tracking-widest text-[#004D40] rotate-[-25deg]">
                          STORY TODAY
                        </span>
                      </div>

                      <div className="relative">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white border-2 border-amber-500 shadow-md flex items-center justify-center p-0.5">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt="Reporter Photo"
                              className="w-full h-full object-cover rounded-xl"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#004D40] text-white flex items-center justify-center text-2xl font-bold rounded-xl">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-1 shadow-sm border border-white">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mt-3 uppercase tracking-tight">
                        {fullName || currentUser.name}
                      </h3>

                      <span className="mt-1 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span>{designation || 'News Reporter'}</span>
                      </span>
                    </div>

                    {/* Details Table & Official Seal */}
                    <div className="px-4 pb-3 space-y-1.5 text-xs relative">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 space-y-1.5 text-[11px] relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-gray-200/60 pb-1">
                          <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                            Card ID:
                          </span>
                          <span className="font-mono font-bold text-[#004D40]">
                            {idCard?.cardNumber || 'ST-PRESS-2026-PENDING'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-gray-200/60 pb-1">
                          <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                            Mobile:
                          </span>
                          <span className="font-bold text-gray-800">
                            {mobileNumber || '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-gray-200/60 pb-1">
                          <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                            ID Proof:
                          </span>
                          <span className="font-bold text-gray-800 uppercase">
                            {idProofType}: {idProofNumber || '—'}
                          </span>
                        </div>

                        <div className="flex items-start justify-between border-b border-gray-200/60 pb-1">
                          <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px] shrink-0">
                            Address:
                          </span>
                          <span className="font-medium text-gray-800 text-right line-clamp-2 max-w-[200px]">
                            {address || '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                          <span>
                            Issued:{' '}
                            <strong className="text-gray-700">
                              {idCard?.approvedAt ? new Date(idCard.approvedAt).toLocaleDateString('en-IN') : '2026'}
                            </strong>
                          </span>
                          <span>
                            Valid Till:{' '}
                            <strong className="text-emerald-700">
                              {idCard?.validUntil ? new Date(idCard.validUntil).toLocaleDateString('en-IN') : '2028'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Official Story Today Seal Stamp Overlay */}
                      <div className="flex justify-end pt-1 pr-1">
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-emerald-800 uppercase block leading-tight">
                              STORY TODAY
                            </span>
                            <span className="text-[8px] text-gray-500 block">Editorial Bureau</span>
                          </div>
                          <StoryTodaySeal size={48} variant="emerald" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Security Footer */}
                    <div className="mt-auto bg-[#004D40] text-white p-3 flex items-center justify-between text-[10px] border-t border-amber-500">
                      <div>
                        <p className="font-bold tracking-wider text-emerald-200">VERIFIED PRESS HOLDER</p>
                        <p className="text-[9px] text-gray-300">Civic Dispatch & Media Bureau</p>
                      </div>

                      <div className="text-right">
                        <p className="font-serif italic font-bold text-amber-300 text-xs">Chief Editor</p>
                        <p className="text-[9px] text-gray-300">Authorized Signatory</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* BACK CARD VIEW */
                  <div
                    ref={cardBackRef}
                    id="id-card-back-preview"
                    className="w-full max-w-[390px] bg-white rounded-2xl border-2 border-[#004D40] shadow-2xl overflow-hidden text-[#111827] flex flex-col relative animate-in fade-in duration-200"
                  >
                    {/* Top Header with Logo */}
                    <div className="bg-[#004D40] text-white p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <StoryTodayLogo size="sm" />
                        <div className="text-left">
                          <h4 className="font-serif font-bold text-sm tracking-wide text-white leading-tight">
                            STORY TODAY — PRESS RECOGNITION
                          </h4>
                          <p className="text-[9px] text-emerald-200">Editorial Guidelines & Legal Rules</p>
                        </div>
                      </div>
                    </div>

                    <div className="h-1 bg-amber-500 w-full" />

                    {/* Prominent Legal Disclaimer Box */}
                    <div className="p-3.5 space-y-2.5">
                      <div className="p-3 bg-red-50 border-2 border-red-400 rounded-xl text-red-950 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs uppercase tracking-wide">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Legal Disclaimer & Notice</span>
                        </div>

                        <p className="text-[10.5px] font-bold text-red-900">
                          ★ THIS IS A NON-SALARIED POSITION / यह एक अवैतनिक पद है
                        </p>

                        <p className="text-[10px] leading-relaxed text-red-950 font-medium italic">
                          "The holder is fully responsible for any misuse of this Identity Card. Story Today is not responsible for any misuse."
                        </p>

                        <p className="text-[9.5px] leading-relaxed text-gray-700 pt-1 border-t border-red-200">
                          इस पहचान पत्र के किसी भी प्रकार के दुरुपयोग के लिए कार्डधारक स्वयं जिम्मेदार होगा। स्टोरी टुडे किसी भी दुरुपयोग के लिए उत्तरदायी नहीं है।
                        </p>
                      </div>

                      {/* Editorial Rules */}
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 text-[10px] text-gray-600">
                        <p className="font-bold text-gray-900 uppercase tracking-wider text-[10px] mb-1">
                          Terms & Conditions:
                        </p>
                        <p>1. Cardholder is authorized to collect verified local civic news & grievances.</p>
                        <p>2. This card does not grant government or law-enforcement authority.</p>
                        <p>3. If found, please return to Story Today Editorial Bureau.</p>
                      </div>

                      {/* QR & Official Stamp Verification Strip */}
                      <div className="flex items-center justify-between p-2.5 bg-gray-100 rounded-xl border border-gray-200 text-[10px]">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-8 h-8 text-[#004D40]" />
                          <div>
                            <p className="font-mono font-bold text-[#004D40]">{idCard?.cardNumber || 'ST-PRESS-2026'}</p>
                            <p className="text-[9px] text-gray-500">Scan to Verify Digital Credential</p>
                          </div>
                        </div>

                        <StoryTodaySeal size={52} variant="emerald" />
                      </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="mt-auto bg-[#004D40] text-white p-2.5 text-center text-[10px]">
                      <p className="font-bold text-white">Story Today — Central Editorial Desk</p>
                      <p className="text-[9px] text-emerald-200">Citizen Journalism & Democratic Civic Accountability Platform</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            {isApproved ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'hi' ? 'सत्यापित डिजिटल प्रेस परिचय पत्र' : 'Official Verified Press Pass'}</span>
              </span>
            ) : isPending ? (
              <span className="text-amber-700 font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{lang === 'hi' ? 'व्यवस्थापक अनुमोदन की प्रतीक्षा में' : 'Awaiting Editorial Approval'}</span>
              </span>
            ) : (
              <span>{lang === 'hi' ? 'स्टोरी टुडे पत्रकार परिचय पत्र' : 'Story Today Journalist Credential'}</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
