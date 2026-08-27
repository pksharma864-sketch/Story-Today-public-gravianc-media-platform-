import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';

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

  // Handle Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(lang === 'hi' ? 'कृपया केवल छवि (Image) फ़ाइल चुनें।' : 'Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(lang === 'hi' ? 'फ़ाइल का आकार 5MB से कम होना चाहिए।' : 'Image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoUrl(result);
      setErrorMessage(null);
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
        userId: currentUser.id,
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
    } catch (err) {
      setErrorMessage('Network error while applying for ID Card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // High-Resolution Card Download Engine using HTML5 Canvas
  const handleDownloadCard = async () => {
    if (!idCard || idCard.status !== 'approved') return;
    setIsDownloading(true);

    try {
      // Create offscreen canvas for high-DPI rendering (800x1200 high-res card pair)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cardWidth = 700;
      const cardHeight = 1050;
      const margin = 40;

      // Dual layout: Front & Back side-by-side
      canvas.width = cardWidth * 2 + margin * 3;
      canvas.height = cardHeight + margin * 2;

      // Fill Canvas Background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Helper function to draw rounded rectangle
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

      // Load user photo
      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject();
          img.src = src;
        });
      };

      // -------------------------------------------------------------
      // 1. DRAW FRONT CARD (x: margin, y: margin)
      // -------------------------------------------------------------
      const fx = margin;
      const fy = margin;

      // Front Card Base
      drawRoundRect(fx, fy, cardWidth, cardHeight, 28, '#FFFFFF', '#004D40', 4);

      // Header Bar - Deep Emerald & Gold
      ctx.save();
      ctx.beginPath();
      ctx.rect(fx, fy, cardWidth, 190);
      ctx.fillStyle = '#004D40';
      ctx.fill();
      ctx.restore();

      // Header Gold Accent Strip
      ctx.fillStyle = '#D97706';
      ctx.fillRect(fx, fy + 190, cardWidth, 10);

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.fillText('STORY TODAY', fx + cardWidth / 2, fy + 58);

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#A7F3D0';
      ctx.letterSpacing = '3px';
      ctx.fillText('PRESS & MEDIA CREDENTIAL', fx + cardWidth / 2, fy + 92);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#E0F2F1';
      ctx.fillText('राष्ट्रीय व प्रांतीय स्वतंत्र पत्रकारिता मंच', fx + cardWidth / 2, fy + 120);

      // "NON-SALARIED POSITION" Banner in Header
      drawRoundRect(fx + 100, fy + 140, cardWidth - 200, 36, 18, '#DC2626');
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('★ THIS IS A NON-SALARIED POSITION ★', fx + cardWidth / 2, fy + 164);

      // Photo Placement
      const photoX = fx + cardWidth / 2 - 110;
      const photoY = fy + 230;
      const photoSize = 220;

      // Photo Outer Border & Shadow
      drawRoundRect(photoX - 8, photoY - 8, photoSize + 16, photoSize + 16, 20, '#F3F4F6', '#D97706', 4);

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
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(idCard.fullName.toUpperCase(), fx + cardWidth / 2, fy + 500);

      // Designation Pill
      drawRoundRect(fx + 140, fy + 525, cardWidth - 280, 44, 22, '#ECFDF5', '#059669', 2);
      ctx.fillStyle = '#065F46';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`● ${idCard.designation.toUpperCase()} ●`, fx + cardWidth / 2, fy + 554);

      // Details Table Container
      const tableY = fy + 595;
      drawRoundRect(fx + 35, tableY, cardWidth - 70, 310, 16, '#F9FAFB', '#E5E7EB', 1.5);

      ctx.textAlign = 'left';
      const drawField = (label: string, value: string, curY: number) => {
        ctx.fillStyle = '#6B7280';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(label.toUpperCase(), fx + 60, curY);

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 18px sans-serif';
        // Wrap value if needed
        const maxValW = cardWidth - 260;
        if (ctx.measureText(value).width > maxValW) {
          ctx.font = 'bold 15px sans-serif';
        }
        ctx.fillText(value, fx + 230, curY);

        // Divider
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx + 60, curY + 12);
        ctx.lineTo(fx + cardWidth - 60, curY + 12);
        ctx.stroke();
      };

      drawField('Card No:', idCard.cardNumber || 'ST-PRESS-2026-ACTIVE', tableY + 45);
      drawField('Mobile:', idCard.mobileNumber, tableY + 95);
      drawField('ID Proof:', `${idCard.idProofType.toUpperCase()}: ${idCard.idProofNumber}`, tableY + 145);
      drawField('Address:', idCard.address.length > 35 ? idCard.address.slice(0, 35) + '...' : idCard.address, tableY + 195);
      drawField('Issued On:', idCard.approvedAt ? new Date(idCard.approvedAt).toLocaleDateString('en-IN') : '2026', tableY + 245);
      drawField('Valid Till:', idCard.validUntil ? new Date(idCard.validUntil).toLocaleDateString('en-IN') : '2028', tableY + 290);

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
      ctx.fillText('Government & Civil Dispatch Observer', fx + 40, footerY + 70);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#FDE68A';
      ctx.font = 'italic bold 18px cursive, serif';
      ctx.fillText('Chief Editor', fx + cardWidth - 40, footerY + 48);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Authorized Signatory & Seal', fx + cardWidth - 40, footerY + 72);

      // -------------------------------------------------------------
      // 2. DRAW BACK CARD (x: fx + cardWidth + margin, y: margin)
      // -------------------------------------------------------------
      const bx = fx + cardWidth + margin;
      const by = margin;

      // Back Card Base
      drawRoundRect(bx, by, cardWidth, cardHeight, 28, '#FFFFFF', '#004D40', 4);

      // Top Banner
      drawRoundRect(bx, by, cardWidth, 110, 28, '#004D40');
      ctx.fillStyle = '#004D40';
      ctx.fillRect(bx, by + 50, cardWidth, 60);

      ctx.fillStyle = '#D97706';
      ctx.fillRect(bx, by + 110, cardWidth, 6);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px serif';
      ctx.textAlign = 'center';
      ctx.fillText('STORY TODAY — PRESS RECOGNITION', bx + cardWidth / 2, by + 65);

      // Crucial Disclaimer Box (Required by guidelines)
      const discY = by + 145;
      drawRoundRect(bx + 35, discY, cardWidth - 70, 220, 16, '#FEF2F2', '#DC2626', 2.5);

      ctx.fillStyle = '#991B1B';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ MANDATORY LEGAL DISCLAIMER & TERMS', bx + cardWidth / 2, discY + 40);

      ctx.fillStyle = '#7F1D1D';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('THIS IS A NON-SALARIED POSITION / यह एक अवैतनिक पद है', bx + cardWidth / 2, discY + 75);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';

      // English disclaimer
      const discEng =
        '"The holder is fully responsible for any misuse of this Identity Card. Story Today is not responsible for any misuse."';
      ctx.font = 'italic bold 14px sans-serif';
      ctx.fillStyle = '#991B1B';
      ctx.fillText(discEng, bx + 55, discY + 115);

      // Hindi disclaimer
      const discHi =
        'इस पहचान पत्र के किसी भी प्रकार के दुरुपयोग के लिए धारक स्वयं पूर्ण रूप से उत्तरदायी होगा। स्टोरी टुडे इसके लिए जिम्मेदार नहीं है।';
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#4B5563';
      ctx.fillText(discHi, bx + 55, discY + 155);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Holders must uphold the highest standards of journalistic ethics and civic truth.', bx + 55, discY + 190);

      // Guidelines & Rules Container
      const rulesY = by + 395;
      drawRoundRect(bx + 35, rulesY, cardWidth - 70, 390, 16, '#F9FAFB', '#E5E7EB', 1.5);

      ctx.fillStyle = '#111827';
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
      ctx.fillStyle = '#374151';
      rules.forEach((rule, idx) => {
        ctx.fillText(rule, bx + 60, rulesY + 90 + idx * 36);
      });

      // Verification Barcode / Security Seal simulation
      const qrY = rulesY + 285;
      drawRoundRect(bx + 60, qrY, 180, 80, 8, '#FFFFFF', '#004D40', 1.5);
      ctx.fillStyle = '#004D40';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VERIFY DIGITAL ID', bx + 150, qrY + 30);
      ctx.font = '10px monospace';
      ctx.fillText(idCard.cardNumber || 'ST-PRESS-2026', bx + 150, qrY + 52);

      // Official Stamp Circle
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx + cardWidth - 140, qrY + 40, 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('STORY TODAY', bx + cardWidth - 140, qrY + 34);
      ctx.fillText('EDITORIAL SEAL', bx + cardWidth - 140, qrY + 48);

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

      // Convert Canvas to PNG and Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      const cleanName = idCard.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `StoryToday_Press_ID_Card_${cleanName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error rendering ID card canvas:', err);
      alert('Error generating high-resolution card. Please try again.');
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
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400">
              <BadgeCheck className="w-6 h-6" />
            </div>
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
                  ? 'स्टोरी टुडे का आधिकारिक पत्रकार परिचय पत्र'
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
                          ? 'आपका आवेदन मुख्य संपादक / व्यवस्थापक (Admin) के पास समीक्षा हेतु जमा है। स्वीकृति मिलते ही डाउनलोड विकल्प उपलब्ध हो जाएगा।'
                          : 'Your application has been submitted to the Editorial Admin. Once approved, you can download your official ID Card.'}
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
                        id="btn-download-id-card-png"
                        onClick={handleDownloadCard}
                        disabled={isDownloading}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{lang === 'hi' ? 'पहचान पत्र डाउनलोड करें' : 'Download ID Card (PNG)'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'एडमिन स्वीकृति के बाद डाउनलोड करें' : 'Download enabled after Admin Approval'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* =========================================================================
               * THE IDENTITY CARD RENDERER (Clean, Authentic Press Card)
               * ========================================================================= */}
              <div className="flex justify-center py-2">
                {activeSide === 'front' ? (
                  /* FRONT CARD VIEW */
                  <div
                    ref={cardFrontRef}
                    id="id-card-front-preview"
                    className="w-full max-w-[380px] bg-white rounded-2xl border-2 border-[#004D40] shadow-xl overflow-hidden text-[#111827] flex flex-col relative animate-in fade-in duration-200"
                  >
                    {/* Top Header */}
                    <div className="bg-[#004D40] text-white p-3.5 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-serif font-bold text-xl tracking-tight text-white">
                          STORY TODAY
                        </span>
                      </div>
                      <p className="text-[10px] font-bold tracking-[0.25em] text-[#A7F3D0] uppercase mt-0.5">
                        PRESS & MEDIA CREDENTIAL
                      </p>
                      <p className="text-[9px] text-[#E0F2F1] mt-0.5">
                        राष्ट्रीय एवं प्रांतीय स्वतंत्र पत्रकारिता मंच
                      </p>

                      {/* Prominent Non-Salaried Pill */}
                      <div className="mt-2 inline-block bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-red-400 shadow-xs">
                        ★ THIS IS A NON-SALARIED POSITION ★
                      </div>
                    </div>

                    {/* Gold Accent Separator */}
                    <div className="h-1 bg-amber-500 w-full" />

                    {/* Photo & Name Section */}
                    <div className="p-4 flex flex-col items-center text-center bg-gradient-to-b from-gray-50/80 to-white">
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

                      <span className="mt-1 inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>{designation || 'News Reporter'}</span>
                      </span>
                    </div>

                    {/* Details Table */}
                    <div className="px-4 pb-3 space-y-1.5 text-xs">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 space-y-1.5 text-[11px]">
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
                          <span className="font-medium text-gray-800 text-right line-clamp-2 max-w-[190px]">
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
                    </div>

                    {/* Bottom Security Footer */}
                    <div className="mt-auto bg-[#004D40] text-white p-3 flex items-center justify-between text-[10px] border-t border-amber-500">
                      <div>
                        <p className="font-bold tracking-wider text-emerald-200">VERIFIED PRESS HOLDER</p>
                        <p className="text-[9px] text-gray-300">Civic Dispatch & Media Bureau</p>
                      </div>

                      <div className="text-right">
                        <p className="font-serif italic font-bold text-amber-300 text-xs">Chief Editor</p>
                        <p className="text-[9px] text-gray-300">Authorized Seal</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* BACK CARD VIEW */
                  <div
                    ref={cardBackRef}
                    id="id-card-back-preview"
                    className="w-full max-w-[380px] bg-white rounded-2xl border-2 border-[#004D40] shadow-xl overflow-hidden text-[#111827] flex flex-col relative animate-in fade-in duration-200"
                  >
                    {/* Top Header */}
                    <div className="bg-[#004D40] text-white p-3 text-center">
                      <h4 className="font-serif font-bold text-sm tracking-wide text-white">
                        STORY TODAY — PRESS RECOGNITION
                      </h4>
                      <p className="text-[10px] text-emerald-200">Editorial Guidelines & Legal Rules</p>
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

                      {/* QR & Seal Verification Strip */}
                      <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg border border-gray-200 text-[10px]">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-7 h-7 text-[#004D40]" />
                          <div>
                            <p className="font-mono font-bold text-[#004D40]">{idCard?.cardNumber || 'ST-PRESS-2026'}</p>
                            <p className="text-[9px] text-gray-500">Scan to Verify Credential</p>
                          </div>
                        </div>

                        <div className="w-10 h-10 rounded-full border-2 border-emerald-700 flex items-center justify-center text-center p-0.5">
                          <span className="text-[7px] font-bold text-emerald-800 leading-tight">STORY TODAY SEAL</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="mt-auto bg-[#004D40] text-white p-2.5 text-center text-[10px]">
                      <p className="font-bold text-white">Story Today — Central Editorial Desk</p>
                      <p className="text-[9px] text-emerald-200">Independent Journalism & Civic Dispatch</p>
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
