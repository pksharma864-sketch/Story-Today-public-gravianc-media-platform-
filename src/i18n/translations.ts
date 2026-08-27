import { Language, GrievanceStatus, GrievancePriority } from '../types';

export interface TranslationDict {
  appName: string;
  appTagline: string;
  news: string;
  grievances: string;
  allPosts: string;
  latest: string;
  trending: string;
  resolved: string;
  postNews: string;
  postGrievance: string;
  searchPlaceholder: string;
  filterByCity: string;
  allCities: string;
  allCategories: string;
  shareArticle: string;
  shareGrievance: string;
  shareVia: string;
  copyLink: string;
  linkCopied: string;
  readMore: string;
  views: string;
  endorsements: string;
  supportIssue: string;
  supported: string;
  referenceNo: string;
  location: string;
  reportedBy: string;
  publishedOn: string;
  status: string;
  priority: string;
  timeline: string;
  officialUpdates: string;
  comments: string;
  addComment: string;
  postComment: string;
  yourName: string;
  yourComment: string;
  adminMode: string;
  adminBadge: string;
  adminPortal: string;
  markResolved: string;
  updateStatus: string;
  deletePost: string;
  pinPost: string;
  unpinPost: string;
  breakingNews: string;
  noPostsYet: string;
  noPostsSub: string;
  createNewFirst: string;
  backToFeed: string;
  openInApp: string;
  openWebLink: string;
  // Statuses
  statusSubmitted: string;
  statusUnderReview: string;
  statusInProgress: string;
  statusResolved: string;
  // Priorities
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  priorityUrgent: string;
  // Form fields
  formTitle: string;
  formTitlePlaceholder: string;
  formContent: string;
  formContentPlaceholder: string;
  formCategory: string;
  formCity: string;
  formArea: string;
  formWard: string;
  formLandmark: string;
  formAuthorName: string;
  formAuthorRole: string;
  formImageUrl: string;
  formUploadPhoto: string;
  formSubmitNews: string;
  formSubmitGrievance: string;
  cancel: string;
  confirm: string;
  successCreated: string;
  enterAdminPasscode: string;
  adminUnlocked: string;
  adminOnlyNotice: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    appName: 'Story Today',
    appTagline: 'Citizen Grievances & Independent News Network',
    news: 'News',
    grievances: 'Grievances',
    allPosts: 'All Stories',
    latest: 'Latest',
    trending: 'Popular',
    resolved: 'Resolved',
    postNews: 'Publish News',
    postGrievance: 'Post Grievance',
    searchPlaceholder: 'Search news, complaints, area or ward...',
    filterByCity: 'Filter by Location',
    allCities: 'All Locations',
    allCategories: 'All Categories',
    shareArticle: 'Share Story',
    shareGrievance: 'Share Grievance',
    shareVia: 'Share with friends & authorities',
    copyLink: 'Copy Web Link',
    linkCopied: 'Link copied to clipboard!',
    readMore: 'Read Full Story',
    views: 'Views',
    endorsements: 'Supporters',
    supportIssue: 'I face this issue too',
    supported: 'Supported',
    referenceNo: 'Complaint Ref',
    location: 'Location',
    reportedBy: 'Reported By',
    publishedOn: 'Published',
    status: 'Grievance Status',
    priority: 'Urgency',
    timeline: 'Resolution Timeline',
    officialUpdates: 'Official Action & Updates',
    comments: 'Public Discussion & Witnesses',
    addComment: 'Add your input or update',
    postComment: 'Submit Comment',
    yourName: 'Your Name',
    yourComment: 'Write a comment or evidence update...',
    adminMode: 'Admin Mode',
    adminBadge: 'Admin Active',
    adminPortal: 'Admin Management Panel',
    markResolved: 'Mark as Resolved',
    updateStatus: 'Update Status & Remark',
    deletePost: 'Delete Story',
    pinPost: 'Pin to Top',
    unpinPost: 'Unpin',
    breakingNews: 'BREAKING',
    noPostsYet: 'No stories or grievances published yet',
    noPostsSub: 'This is a clean instance. Be the first to report a local issue or publish breaking news.',
    createNewFirst: 'Create Your First Post',
    backToFeed: 'Back to Stories',
    openInApp: 'View in App',
    openWebLink: 'Direct Browser Link',
    statusSubmitted: 'Submitted',
    statusUnderReview: 'Under Review',
    statusInProgress: 'Action In Progress',
    statusResolved: 'Resolved',
    priorityLow: 'Normal',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    formTitle: 'Headline / Grievance Subject',
    formTitlePlaceholder: 'e.g. Broken water pipeline causing water shortage in Ward 12',
    formContent: 'Detailed Description',
    formContentPlaceholder: 'Describe the complete news story or citizen issue, affected people, time period, and exact location...',
    formCategory: 'Category',
    formCity: 'City / District',
    formArea: 'Area / Colony',
    formWard: 'Ward No / Sector',
    formLandmark: 'Nearby Landmark',
    formAuthorName: 'Your Full Name',
    formAuthorRole: 'Designation / Role (Citizen / Resident / Reporter)',
    formImageUrl: 'Attach Image (or Photo URL)',
    formUploadPhoto: 'Upload Photo / Evidence',
    formSubmitNews: 'Publish News Story',
    formSubmitGrievance: 'Submit Grievance',
    cancel: 'Cancel',
    confirm: 'Confirm',
    successCreated: 'Published successfully!',
    enterAdminPasscode: 'Enter Admin Passcode',
    adminUnlocked: 'Admin Mode is now enabled for you',
    adminOnlyNotice: 'You have full admin authority to manage, update status, and moderate all content.',
  },
  hi: {
    appName: 'Story Today',
    appTagline: 'नागरिक जन शिकायत एवं स्वतंत्र समाचार नेटवर्क',
    news: 'समाचार (News)',
    grievances: 'जन शिकायतें (Grievances)',
    allPosts: 'सभी खबरें',
    latest: 'ताज़ा खबरें',
    trending: 'चर्चित',
    resolved: 'समाधानित',
    postNews: 'समाचार प्रकाशित करें',
    postGrievance: 'शिकायत दर्ज करें',
    searchPlaceholder: 'समाचार, शिकायत, क्षेत्र या वार्ड खोजें...',
    filterByCity: 'स्थान अनुसार देखें',
    allCities: 'सभी स्थान',
    allCategories: 'सभी श्रेणियां',
    shareArticle: 'समाचार साझा करें',
    shareGrievance: 'शिकायत साझा करें',
    shareVia: 'सोशल मीडिया और अधिकारियों को भेजें',
    copyLink: 'वेब लिंक कॉपी करें',
    linkCopied: 'लिंक क्लिपबोर्ड पर कॉपी हो गया!',
    readMore: 'पूरी खबर पढ़ें',
    views: 'देखा गया',
    endorsements: 'समर्थक नागरिक',
    supportIssue: 'मुझे भी यह समस्या है (समर्थन)',
    supported: 'समर्थन दिया',
    referenceNo: 'शिकायत क्रमांक',
    location: 'स्थान',
    reportedBy: 'द्वारा',
    publishedOn: 'दिनांक',
    status: 'शिकायत स्थिति',
    priority: 'प्राथमिकता',
    timeline: 'कार्रवाई प्रगति टाइमलाइन',
    officialUpdates: 'प्रशासनिक कार्रवाई एवं आधिकारिक अपडेट',
    comments: 'जन चर्चा एवं साक्ष्य',
    addComment: 'अपनी बात या नया अपडेट लिखें',
    postComment: 'टिप्पणी भेजें',
    yourName: 'आपका नाम',
    yourComment: 'यहाँ अपनी टिप्पणी या स्थिति लिखें...',
    adminMode: 'व्यवस्थापक मोड (Admin)',
    adminBadge: 'एडमिन सक्रिय',
    adminPortal: 'एडमिन प्रबंधन कक्ष',
    markResolved: 'समस्या समाधानित चिन्हित करें',
    updateStatus: 'स्थिति और टिप्पणी अपडेट करें',
    deletePost: 'पोस्ट हटाएं',
    pinPost: 'मुख्य पृष्ठ पर पिन करें',
    unpinPost: 'पिन हटाएं',
    breakingNews: 'ब्रेकिंग न्यूज़',
    noPostsYet: 'अभी कोई खबर या शिकायत प्रकाशित नहीं है',
    noPostsSub: 'यह पूरी तरह फ्रेश प्लेटफ़ॉर्म है। अपनी पहली नागरिक शिकायत या समाचार अभी पोस्ट करें।',
    createNewFirst: 'पहला समाचार / शिकायत पोस्ट करें',
    backToFeed: 'मुख्य पृष्ठ पर लौटें',
    openInApp: 'ऐप में देखें',
    openWebLink: 'वेबसाइट लिंक',
    statusSubmitted: 'दर्ज (Submitted)',
    statusUnderReview: 'समीक्षाधीन (Under Review)',
    statusInProgress: 'कार्रवाई जारी (In Progress)',
    statusResolved: 'समाधानित (Resolved)',
    priorityLow: 'सामान्य',
    priorityMedium: 'मध्यम',
    priorityHigh: 'उच्च',
    priorityUrgent: 'अति आवश्यक',
    formTitle: 'शीर्षक / शिकायत का मुख्य विषय',
    formTitlePlaceholder: 'उदा. वार्ड 12 में मुख्य पेयजल पाइपलाइन टूटने से जल संकट',
    formContent: 'विस्तृत विवरण',
    formContentPlaceholder: 'पूरी घटना, प्रभावित लोग, समय और स्थिति का पूरा विवरण लिखें...',
    formCategory: 'श्रेणी',
    formCity: 'शहर / जिला',
    formArea: 'इलाका / कॉलोनी',
    formWard: 'वार्ड नं / सेक्टर',
    formLandmark: 'निकटतम पहचान स्थल (Landmark)',
    formAuthorName: 'आपका पूरा नाम',
    formAuthorRole: 'पहचान (नागरिक / स्थानीय निवासी / पत्रकार)',
    formImageUrl: 'फोटो लिंक या साक्ष्य',
    formUploadPhoto: 'फोटो / साक्ष्य अपलोड करें',
    formSubmitNews: 'समाचार प्रकाशित करें',
    formSubmitGrievance: 'शिकायत दर्ज करें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    successCreated: 'सफलतापूर्वक प्रकाशित किया गया!',
    enterAdminPasscode: 'एडमिन पासवर्ड दर्ज करें',
    adminUnlocked: 'एडमिन मोड सक्रिय हो गया है',
    adminOnlyNotice: 'आपके पास सभी पोस्ट प्रबंधित करने, स्थिति बदलने और संपादित करने का पूर्ण अधिकार है।',
  },
};

export const categoriesMap: Record<string, { en: string; hi: string; icon: string }> = {
  // Grievances
  water_supply: { en: 'Water Supply', hi: 'पेयजल समस्या', icon: 'Droplets' },
  roads_traffic: { en: 'Roads & Potholes', hi: 'सड़क व गड्ढे', icon: 'Car' },
  electricity: { en: 'Electricity & Power', hi: 'बिजली व स्ट्रीट लाइट', icon: 'Zap' },
  sanitation_waste: { en: 'Garbage & Sanitation', hi: 'कचरा व सफाई', icon: 'Trash2' },
  drainage_sewage: { en: 'Drainage & Sewage', hi: 'नाली व सीवरेज', icon: 'Waves' },
  street_lights: { en: 'Street Lighting', hi: 'मार्ग प्रकाश', icon: 'Sun' },
  public_safety: { en: 'Public Safety & Law', hi: 'सुरक्षा व कानून', icon: 'ShieldAlert' },
  health_hospital: { en: 'Health & Hospital', hi: 'स्वास्थ्य व अस्पताल', icon: 'Activity' },
  corruption: { en: 'Civic Grievance / Corruption', hi: 'प्रशासनिक / भ्रष्टाचार', icon: 'AlertCircle' },
  // News & Publications
  general: { en: 'General News', hi: 'सामान्य समाचार', icon: 'Newspaper' },
  press_release: { en: 'Press Release', hi: 'प्रेस विज्ञप्ति (Press Release)', icon: 'FileText' },
  press_release_health: { en: 'Press Release (Health)', hi: 'प्रेस विज्ञप्ति - स्वास्थ्य (Press Release Health)', icon: 'Activity' },
  education_career: { en: 'Education & Career', hi: 'शिक्षा एवं करियर (Education & Career)', icon: 'GraduationCap' },
  geo_politics: { en: 'Geo-Politics', hi: 'भू-राजनीति (Geo-Politics)', icon: 'Globe' },
  mental_health: { en: 'Mental Health', hi: 'मानसिक स्वास्थ्य (Mental Health)', icon: 'Heart' },
  politics: { en: 'Politics', hi: 'राजनीति (Politics)', icon: 'Building2' },
  social: { en: 'Social', hi: 'सामाजिक (Social)', icon: 'Users' },
  art_culture: { en: 'Art & Culture', hi: 'कला एवं संस्कृति (Art & Culture)', icon: 'Palette' },
  product_review: { en: 'Product Review', hi: 'उत्पाद समीक्षा (Product Review)', icon: 'Star' },
  science_invention: { en: 'Science & Invention', hi: 'विज्ञान एवं आविष्कार (Science & Invention)', icon: 'Microscope' },
  technology: { en: 'Technology', hi: 'तकनीकी (Technology)', icon: 'Cpu' },
  sports: { en: 'Sports', hi: 'खेलकूद (Sports)', icon: 'Trophy' },
  agriculture: { en: 'Agriculture', hi: 'कृषि एवं किसानी (Agriculture)', icon: 'Sprout' },
  market_economics: { en: 'Market & Economics', hi: 'बाजार एवं अर्थशास्त्र (Market & Economics)', icon: 'TrendingUp' },
  civic: { en: 'City & Civic Affairs', hi: 'नगर व नागरिक मामले', icon: 'Landmark' },
  development: { en: 'Infrastructure & Projects', hi: 'विकास कार्य व योजनाएं', icon: 'HardHat' },
  education: { en: 'Education & Youth', hi: 'शिक्षा व युवा', icon: 'GraduationCap' },
  environment: { en: 'Environment & Climate', hi: 'पर्यावरण व मौसम', icon: 'Trees' },
  business: { en: 'Local Business & Market', hi: 'व्यापार व बाजार', icon: 'ShoppingBag' },
  other: { en: 'Other Issues', hi: 'अन्य', icon: 'Tag' },
};

export function getStatusText(status: GrievanceStatus | undefined, lang: Language): string {
  if (!status) return '';
  switch (status) {
    case 'submitted':
      return translations[lang].statusSubmitted;
    case 'under_review':
      return translations[lang].statusUnderReview;
    case 'in_progress':
      return translations[lang].statusInProgress;
    case 'resolved':
      return translations[lang].statusResolved;
  }
}

export function getPriorityText(priority: GrievancePriority | undefined, lang: Language): string {
  if (!priority) return '';
  switch (priority) {
    case 'low':
      return translations[lang].priorityLow;
    case 'medium':
      return translations[lang].priorityMedium;
    case 'high':
      return translations[lang].priorityHigh;
    case 'urgent':
      return translations[lang].priorityUrgent;
  }
}
