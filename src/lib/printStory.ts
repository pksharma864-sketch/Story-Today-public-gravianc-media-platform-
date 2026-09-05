import { PostItem, Language } from '../types';

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatBodyContent(content: string): string {
  if (!content) return '';
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }
  return content
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export function generatePrintableStoryHtml(post: PostItem, lang: Language = 'hi'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://story-today.in';
  const isGrievance = post.type === 'grievance';
  const pathPrefix = isGrievance ? 'grievance' : 'article';
  const articleUrl = `${origin}/${pathPrefix}/${post.id}`;

  const titleText = lang === 'hi' && post.titleHi ? post.titleHi : post.title;
  const contentText = lang === 'hi' && post.contentHi ? post.contentHi : post.content;

  const dateFormatted = new Date(post.createdAt).toLocaleDateString(
    lang === 'hi' ? 'hi-IN' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const locationParts = [
    post.location?.area,
    post.location?.landmark,
    post.location?.ward ? `वार्ड / Ward ${post.location.ward}` : '',
    post.location?.city,
    post.location?.country,
  ]
    .filter(Boolean)
    .join(', ');

  // Status mapping for grievances
  const statusLabels: Record<string, { hi: string; en: string; color: string }> = {
    submitted: { hi: 'लंबित / जमा', en: 'Submitted', color: '#B45309' },
    under_review: { hi: 'जांच के अधीन', en: 'Under Review', color: '#1D4ED8' },
    in_progress: { hi: 'कार्य प्रगति पर', en: 'In Progress', color: '#7C3AED' },
    resolved: { hi: 'निस्तारित / हल', en: 'Resolved', color: '#047857' },
  };

  const currentStatus = post.status ? statusLabels[post.status] || { hi: post.status, en: post.status, color: '#374151' } : null;

  // Custom logo from localStorage or default
  let logoSrc = `${origin}/logo.svg`;
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('story_today_custom_logo');
    if (custom && custom.trim()) {
      logoSrc = custom;
    }
  }

  // Cover image handling
  let imageMarkup = '';
  if (post.imageUrl) {
    let imgUrl = post.imageUrl.trim();
    if (imgUrl.startsWith('data:image/')) {
      imgUrl = `${origin}/api/posts/${post.id}/image.jpg`;
    } else if (imgUrl.startsWith('/')) {
      imgUrl = `${origin}${imgUrl}`;
    }
    imageMarkup = `
      <div class="cover-image-container">
        <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(titleText)}" class="cover-image" onerror="this.parentElement.style.display='none'" />
      </div>
    `;
  }

  // Official Response section
  let officialResponseMarkup = '';
  if (post.officialResponse && post.officialResponse.message) {
    const respDate = new Date(post.officialResponse.timestamp).toLocaleDateString(
      lang === 'hi' ? 'hi-IN' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
    officialResponseMarkup = `
      <div class="official-response-box">
        <div class="official-response-header">
          <span class="official-badge">शासकीय / विभागीय उत्तर • OFFICIAL RESPONSE</span>
          <span class="official-date">${escapeHtml(respDate)}</span>
        </div>
        <div class="official-dept-row">
          <strong>विभाग / Department:</strong> ${escapeHtml(post.officialResponse.department || 'संबंधित विभाग')}
          ${post.officialResponse.officerName ? `&nbsp;•&nbsp;<strong>अधिकारी:</strong> ${escapeHtml(post.officialResponse.officerName)}` : ''}
        </div>
        <div class="official-message">
          "${escapeHtml(post.officialResponse.message)}"
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(titleText)} | Story Today</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      color: #111827;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* Interactive Action Bar (Hidden in Print) */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #004D40;
      color: #ffffff;
      padding: 12px 20px;
      box-shadow: 0 4px 12px rgba(0, 77, 64, 0.15);
      border-bottom: 2px solid #002D25;
    }

    .action-bar-inner {
      max-width: 840px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .action-info {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-print {
      background: #FFC107;
      color: #111827;
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .btn-print:hover {
      background: #FFA000;
      transform: translateY(-1px);
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
      padding: 8px 14px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-close:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    /* Main Printable Sheet */
    .print-container {
      max-width: 820px;
      margin: 24px auto 40px;
      background: #ffffff;
      padding: 40px 48px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e5e7eb;
    }

    /* Masthead Header */
    .masthead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 18px;
      border-bottom: 2px solid #004D40;
      margin-bottom: 20px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
    }

    .brand-text h1 {
      font-size: 24px;
      font-weight: 800;
      color: #004D40;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .brand-tagline {
      font-size: 11px;
      font-weight: 600;
      color: #4b5563;
      margin-top: 3px;
    }

    .brand-domain {
      font-size: 11px;
      font-weight: 700;
      color: #B45309;
    }

    .meta-box {
      text-align: right;
    }

    .official-seal {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #004D40;
      background: #E0F2F1;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #B2DFDB;
      margin-bottom: 4px;
    }

    .print-timestamp {
      font-size: 10px;
      color: #6b7280;
    }

    /* Story Category & Grievance Badges */
    .badge-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #e5e7eb;
    }

    .badge-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .type-pill {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .type-pill-grievance {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FECACA;
    }

    .type-pill-news {
      background: #E0E7FF;
      color: #3730A3;
      border: 1px solid #C7D2FE;
    }

    .status-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .ref-no {
      font-family: monospace;
      font-size: 11px;
      color: #4b5563;
      background: #f3f4f6;
      padding: 3px 6px;
      border-radius: 4px;
    }

    .location-text {
      font-size: 12px;
      color: #4b5563;
      font-weight: 600;
    }

    /* Article Title */
    .story-title {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      color: #111827;
      line-height: 1.3;
      margin-bottom: 14px;
    }

    /* Byline / Reporter */
    .byline-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #4b5563;
      padding-bottom: 16px;
      margin-bottom: 18px;
      border-bottom: 1px solid #e5e7eb;
    }

    .reporter-info {
      font-weight: 700;
      color: #111827;
    }

    .reporter-badge {
      font-size: 10px;
      font-weight: 700;
      background: #E0F2F1;
      color: #004D40;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }

    .publish-date {
      color: #6b7280;
    }

    /* Cover Image */
    .cover-image-container {
      margin-bottom: 22px;
      text-align: center;
    }

    .cover-image {
      max-width: 100%;
      max-height: 380px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    /* Article Content */
    .story-body {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 15px;
      line-height: 1.75;
      color: #1f2937;
      margin-bottom: 28px;
    }

    .story-body p {
      margin-bottom: 16px;
    }

    /* Official Response Box */
    .official-response-box {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-left: 4px solid #16A34A;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }

    .official-response-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .official-badge {
      font-size: 11px;
      font-weight: 800;
      color: #166534;
      letter-spacing: 0.5px;
    }

    .official-date {
      font-size: 11px;
      color: #15803D;
    }

    .official-dept-row {
      font-size: 12px;
      color: #14532D;
      margin-bottom: 6px;
    }

    .official-message {
      font-style: italic;
      font-size: 13px;
      color: #166534;
      line-height: 1.6;
    }

    /* Verification Footer */
    .print-footer {
      border-top: 2px solid #e5e7eb;
      padding-top: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #6b7280;
    }

    .footer-left strong {
      color: #004D40;
    }

    .footer-url {
      color: #004D40;
      text-decoration: none;
      word-break: break-all;
    }

    /* Print Specific Styles */
    @page {
      size: A4;
      margin: 15mm 12mm 15mm 12mm;
    }

    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .action-bar, .no-print {
        display: none !important;
      }

      .print-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }

      .story-title {
        color: #000000 !important;
      }

      .story-body {
        color: #111827 !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
      }

      .cover-image {
        max-height: 320px !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top Action Bar for interactive preview/print (Hidden in print/PDF output) -->
  <div class="action-bar no-print">
    <div class="action-bar-inner">
      <div class="action-info">
        <span>🖨️ Story Today • Print / PDF Archive</span>
      </div>
      <div class="action-buttons">
        <button onclick="window.print()" class="btn-print" id="btn-print-trigger">
          🖨️ ${lang === 'hi' ? 'प्रिंट करें / Save as PDF' : 'Print / Save as PDF'}
        </button>
        <button onclick="window.close()" class="btn-close" id="btn-close-trigger">
          ✕ ${lang === 'hi' ? 'बंद करें' : 'Close'}
        </button>
      </div>
    </div>
  </div>

  <!-- Main Printable Document -->
  <div class="print-container">
    <!-- Header Masthead -->
    <header class="masthead">
      <div class="brand-section">
        <img src="${escapeHtml(logoSrc)}" alt="Story Today Logo" class="logo-img" onerror="this.style.display='none'" />
        <div class="brand-text">
          <h1>Story Today</h1>
          <p class="brand-tagline">${lang === 'hi' ? 'राष्ट्रीय नागरिक जनशिकायत एवं स्वतंत्र पत्रकारिता नेटवर्क' : 'National Citizen Grievance & Independent News Network'}</p>
          <p class="brand-domain">story-today.in</p>
        </div>
      </div>
      <div class="meta-box">
        <div class="official-seal">${lang === 'hi' ? 'सत्यापित अभिलेख' : 'VERIFIED ARCHIVE'}</div>
        <div class="print-timestamp">${escapeHtml(dateFormatted)}</div>
      </div>
    </header>

    <!-- Category & Status Badge Row -->
    <div class="badge-bar">
      <div class="badge-left">
        <span class="type-pill ${isGrievance ? 'type-pill-grievance' : 'type-pill-news'}">
          ${isGrievance ? (lang === 'hi' ? 'जन शिकायत' : 'Citizen Grievance') : (lang === 'hi' ? 'समाचार' : 'News Report')}
        </span>
        ${post.category ? `<span class="type-pill" style="background:#F3F4F6;color:#374151;">${escapeHtml(post.category)}</span>` : ''}
        ${isGrievance && currentStatus ? `
          <span class="status-pill" style="background:${currentStatus.color}15;color:${currentStatus.color};border:1px solid ${currentStatus.color}40;">
            ${lang === 'hi' ? currentStatus.hi : currentStatus.en}
          </span>
        ` : ''}
        ${post.referenceNumber ? `<span class="ref-no">Ref: ${escapeHtml(post.referenceNumber)}</span>` : ''}
      </div>
      ${locationParts ? `<div class="location-text">📍 ${escapeHtml(locationParts)}</div>` : ''}
    </div>

    <!-- Article Headline -->
    <h2 class="story-title">${escapeHtml(titleText)}</h2>

    <!-- Byline Row -->
    <div class="byline-row">
      <div>
        <span class="reporter-info">${escapeHtml(post.authorName || 'Citizen Reporter')}</span>
        <span class="reporter-badge">${escapeHtml(post.authorRole || (isGrievance ? 'Citizen' : 'Journalist'))}</span>
      </div>
      <div class="publish-date">${escapeHtml(dateFormatted)}</div>
    </div>

    <!-- Cover Image (if available) -->
    ${imageMarkup}

    <!-- Official Response (for grievances) -->
    ${officialResponseMarkup}

    <!-- Main Content -->
    <div class="story-body">
      ${formatBodyContent(contentText)}
    </div>

    <!-- Footer Verification -->
    <footer class="print-footer">
      <div class="footer-left">
        <strong>Story Today</strong> • ${lang === 'hi' ? 'नागरिक सशक्तिकरण एवं निष्पक्ष समाचार' : 'Citizen Empowerment & Objective Journalism'}
      </div>
      <div class="footer-right">
        <a href="${escapeHtml(articleUrl)}" class="footer-url" target="_blank">${escapeHtml(articleUrl)}</a>
      </div>
    </footer>
  </div>

  <script>
    // Automatically open the system print dialog when document is loaded
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Auto print trigger:', e);
        }
      }, 300);
    });
  </script>
</body>
</html>`;
}

/**
 * Universal print handler that triggers the system print / PDF dialog
 * for the given story post.
 */
export function printStory(post: PostItem, lang: Language = 'hi'): void {
  if (typeof window === 'undefined') return;

  const html = generatePrintableStoryHtml(post, lang);

  // Strategy 1: Open a new popup window and invoke print()
  // This works reliably in both top-level tabs and sandboxed iframes (which allow popups).
  let printWin: Window | null = null;
  try {
    printWin = window.open('', '_blank');
  } catch (err) {
    console.warn('window.open was blocked or threw error:', err);
    printWin = null;
  }

  if (printWin && !printWin.closed) {
    try {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();

      // Ensure focus and print trigger
      setTimeout(() => {
        try {
          printWin?.focus();
          printWin?.print();
        } catch (e) {
          console.warn('Error invoking print on popup window:', e);
        }
      }, 350);
      return;
    } catch (e) {
      console.warn('Failed writing to popup window:', e);
    }
  }

  // Strategy 2: Invisible iframe write & print (fallback when popup blocker prevents window.open)
  try {
    const existing = document.getElementById('story-print-frame');
    if (existing) {
      existing.remove();
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'story-print-frame';
    iframe.setAttribute(
      'style',
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
    );
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          // If iframe printing is blocked by sandbox, fallback to window.print()
          window.print();
        } finally {
          setTimeout(() => {
            try {
              iframe.remove();
            } catch {}
          }, 3000);
        }
      }, 300);
      return;
    }
  } catch (err) {
    console.warn('Iframe print strategy error:', err);
  }

  // Strategy 3: Direct window.print() fallback
  try {
    window.print();
  } catch (err) {
    console.error('Direct window.print() failed:', err);
  }
}
