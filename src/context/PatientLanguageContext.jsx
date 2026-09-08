import { CASE_TRANSLATIONS } from '../data/caseTranslations'
import { createContext, useContext, useMemo, useState } from 'react'

export const PATIENT_LANGUAGES = [
  { code: 'hi-IN', label: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'en-IN', label: 'English', speechCode: 'en-IN' },
  { code: 'hinglish', label: 'Hinglish', speechCode: 'en-IN' },
  { code: 'bn-IN', label: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'mr-IN', label: 'मराठी', speechCode: 'mr-IN' },
  { code: 'te-IN', label: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'ta-IN', label: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'gu-IN', label: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'ml-IN', label: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
  { code: 'or-IN', label: 'ଓଡ଼ିଆ', speechCode: 'or-IN' },
  { code: 'as-IN', label: 'অসমীয়া', speechCode: 'as-IN' },
]

export const STORAGE_KEY = 'ayush-patient-language'
const DEFAULT_LANGUAGE = 'hi-IN'

const en = {
  language: 'Language',
  selectLanguage: 'Select language',
  patientPortal: 'Patient Portal',
  patientAccount: 'Patient Account',
  logout: 'Logout',
  smartHealthcarePortal: 'Smart Healthcare Portal',
  welcomeBack: 'Welcome back',
  startNewCase: 'Start New Case',
  totalCases: 'Total Cases',
  medicalDocuments: 'Medical Documents',
  latestCase: 'Latest Case',
  noCaseYet: 'No case yet',
  quickActions: 'Quick Actions',
  manageHealthRecords: 'Manage your health records',
  beginCaseTaking: 'Begin case taking',
  manageDocuments: 'Manage documents',
  previousCases: 'Previous Cases',
  viewCaseHistory: 'View case history',
  activity: 'Activity',
  recentCase: 'Recent Case',
  viewAll: 'View all',
  noCaseSubmittedYet: 'No case submitted yet',
  patientCase: 'Patient Case',
  medicalCase: 'Medical case',
  recently: 'Recently',
  email: 'Email',
  accountType: 'Account Type',
  patient: 'Patient',
  caseRecords: 'Case Records',
  submitted: 'submitted',
  reviewed: 'Reviewed',
  rejected: 'Rejected',
  importantClinicalNotice: 'Important Clinical Notice',
  closeNotification: 'Close notification',
  heroDescription: 'Take control of your health journey. Complete your digital patient history, upload medical records and keep track of your previous consultations.',
  newCaseDescription: 'Complete your medical history, symptoms and AYUSH assessment through a guided digital workflow.',
  documentsDescription: 'Upload prescriptions, laboratory reports, discharge summaries and previous medical records.',
  previousCasesDescription: 'Review your submitted cases, their current status and previous health information.',
  startFirstCaseDescription: 'Start your first digital patient case to see it here.',
  clinicalNoticeDescription: 'This platform helps collect and organize patient information. It does not replace professional medical advice, diagnosis or treatment. Your information should be reviewed by a qualified healthcare professional.',
  notifications: 'Notifications',
  abhaProfile: 'ABHA Profile',
  reviewCase: 'Review Case',
  medicalHistory: 'Medical History',
  saveContinue: 'Save & Continue',
  previous: 'Previous',
  next: 'Next',
  submitCase: 'Submit Case',
  refresh: 'Refresh',
  loading: 'Loading...',
  noCaseSubmittedYet: 'No case submitted yet',
  noNotifications: 'No notifications found',
  all: 'All',
  unread: 'Unread',
  markAllRead: 'Mark all as read',
  markRead: 'Mark as read',
  backToDashboard: 'Back to Dashboard',
  saveProfile: 'Save Profile',
  saving: 'Saving...',
  yourProfile: 'Your Profile',
  name: 'Name',
  address: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
  abhaNumber: 'ABHA Number',
  abhaNumberHint: '14-digit ABHA number',
  verified: 'Verified',
  notVerified: 'Not Verified',
}

const hi = {
  ...en,
  language: 'भाषा',
  selectLanguage: 'भाषा चुनें',
  patientPortal: 'मरीज़ पोर्टल',
  patientAccount: 'मरीज़ खाता',
  logout: 'लॉग आउट',
  smartHealthcarePortal: 'स्मार्ट हेल्थकेयर पोर्टल',
  welcomeBack: 'वापसी पर स्वागत है',
  startNewCase: 'नया केस शुरू करें',
  totalCases: 'कुल केस',
  medicalDocuments: 'मेडिकल दस्तावेज़',
  latestCase: 'नवीनतम केस',
  noCaseYet: 'अभी कोई केस नहीं',
  quickActions: 'त्वरित कार्य',
  manageHealthRecords: 'अपने स्वास्थ्य रिकॉर्ड प्रबंधित करें',
  beginCaseTaking: 'केस दर्ज करना शुरू करें',
  manageDocuments: 'दस्तावेज़ प्रबंधित करें',
  previousCases: 'पिछले केस',
  viewCaseHistory: 'केस इतिहास देखें',
  activity: 'गतिविधि',
  recentCase: 'हाल का केस',
  viewAll: 'सभी देखें',
  noCaseSubmittedYet: 'अभी कोई केस जमा नहीं हुआ',
  patientCase: 'मरीज़ केस',
  medicalCase: 'मेडिकल केस',
  recently: 'हाल ही में',
  email: 'ईमेल',
  accountType: 'खाते का प्रकार',
  patient: 'मरीज़',
  caseRecords: 'केस रिकॉर्ड',
  submitted: 'जमा किए गए',
  reviewed: 'समीक्षित',
  rejected: 'अस्वीकृत',
  importantClinicalNotice: 'महत्वपूर्ण चिकित्सीय सूचना',
  closeNotification: 'सूचना बंद करें',
  heroDescription: 'अपने स्वास्थ्य की जानकारी पर नियंत्रण रखें। अपनी डिजिटल मरीज जानकारी पूरी करें, मेडिकल रिकॉर्ड अपलोड करें और पिछली परामर्श जानकारी देखें।',
  newCaseDescription: 'निर्देशित डिजिटल प्रक्रिया के माध्यम से अपना मेडिकल इतिहास, लक्षण और AYUSH आकलन पूरा करें।',
  documentsDescription: 'प्रिस्क्रिप्शन, लैब रिपोर्ट, डिस्चार्ज सारांश और पुराने मेडिकल रिकॉर्ड अपलोड करें।',
  previousCasesDescription: 'अपने जमा किए गए केस, उनकी वर्तमान स्थिति और पिछली स्वास्थ्य जानकारी देखें।',
  startFirstCaseDescription: 'अपना पहला डिजिटल मरीज केस शुरू करें और उसे यहां देखें।',
  clinicalNoticeDescription: 'यह प्लेटफ़ॉर्म मरीज की जानकारी एकत्र और व्यवस्थित करने में मदद करता है। यह पेशेवर चिकित्सीय सलाह, निदान या उपचार का विकल्प नहीं है। आपकी जानकारी योग्य स्वास्थ्य पेशेवर द्वारा देखी जानी चाहिए।',
  notifications: 'सूचनाएँ',
  abhaProfile: 'ABHA प्रोफ़ाइल',
  reviewCase: 'केस की समीक्षा करें',
  medicalHistory: 'चिकित्सीय इतिहास',
  saveContinue: 'सेव करें और आगे बढ़ें',
  previous: 'पिछला',
  next: 'अगला',
  submitCase: 'केस सबमिट करें',
  refresh: 'रिफ्रेश करें',
  loading: 'लोड हो रहा है...',
  noCaseSubmittedYet: 'अभी कोई केस जमा नहीं हुआ',
  noNotifications: 'कोई सूचना नहीं मिली',
  all: 'सभी',
  unread: 'अपठित',
  markAllRead: 'सभी को पढ़ा हुआ करें',
  markRead: 'पढ़ा हुआ करें',
  backToDashboard: 'डैशबोर्ड पर वापस जाएँ',
  saveProfile: 'प्रोफ़ाइल सेव करें',
  saving: 'सेव हो रहा है...',
  yourProfile: 'आपकी प्रोफ़ाइल',
  name: 'नाम',
  address: 'पता',
  city: 'शहर',
  state: 'राज्य',
  pincode: 'पिनकोड',
  abhaNumber: 'ABHA नंबर',
  abhaNumberHint: '14 अंकों का ABHA नंबर',
  verified: 'सत्यापित',
  notVerified: 'सत्यापित नहीं',
}

const hinglish = {
  ...en,
  language: 'Language',
  selectLanguage: 'Language select karein',
  patientPortal: 'Patient Portal',
  patientAccount: 'Patient Account',
  logout: 'Logout',
  smartHealthcarePortal: 'Smart Healthcare Portal',
  welcomeBack: 'Welcome back',
  startNewCase: 'Naya Case Start Karein',
  totalCases: 'Total Cases',
  medicalDocuments: 'Medical Documents',
  latestCase: 'Latest Case',
  noCaseYet: 'Abhi koi case nahi',
  quickActions: 'Quick Actions',
  manageHealthRecords: 'Apne health records manage karein',
  beginCaseTaking: 'Case taking shuru karein',
  manageDocuments: 'Documents manage karein',
  previousCases: 'Previous Cases',
  viewCaseHistory: 'Case history dekhein',
  activity: 'Activity',
  recentCase: 'Recent Case',
  viewAll: 'Sab dekhein',
  noCaseSubmittedYet: 'Abhi koi case submit nahi hua',
  patientCase: 'Patient Case',
  medicalCase: 'Medical case',
  recently: 'Recently',
  email: 'Email',
  accountType: 'Account Type',
  patient: 'Patient',
  caseRecords: 'Case Records',
  submitted: 'submitted',
  reviewed: 'Reviewed',
  rejected: 'Rejected',
  importantClinicalNotice: 'Important Clinical Notice',
  closeNotification: 'Notification band karein',
  heroDescription: 'Apni health journey ko manage karein. Digital patient history complete karein, medical records upload karein aur previous consultations track karein.',
  newCaseDescription: 'Guided digital workflow ke through medical history, symptoms aur AYUSH assessment complete karein.',
  documentsDescription: 'Prescriptions, laboratory reports, discharge summaries aur previous medical records upload karein.',
  previousCasesDescription: 'Apne submitted cases, unka current status aur previous health information dekhein.',
  startFirstCaseDescription: 'Apna pehla digital patient case start karein aur yahan dekhein.',
  clinicalNoticeDescription: 'Ye platform patient information collect aur organize karne me help karta hai. Ye professional medical advice, diagnosis ya treatment ka replacement nahi hai. Information ko qualified healthcare professional review kare.',
  notifications: 'Notifications',
  abhaProfile: 'ABHA Profile',
  reviewCase: 'Case Review karein',
  medicalHistory: 'Medical History',
  saveContinue: 'Save karke aage badhein',
  previous: 'Pichhla',
  next: 'Agla',
  submitCase: 'Case Submit karein',
  refresh: 'Refresh karein',
  loading: 'Load ho raha hai...',
  noCaseSubmittedYet: 'Abhi koi case submit nahi hua',
  noNotifications: 'Koi notification nahi mili',
  all: 'Sabhi',
  unread: 'Unread',
  markAllRead: 'Sabko read karein',
  markRead: 'Read karein',
  backToDashboard: 'Dashboard par wapas jayein',
  saveProfile: 'Profile Save karein',
  saving: 'Save ho raha hai...',
  yourProfile: 'Aapki Profile',
  name: 'Name',
  address: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
  abhaNumber: 'ABHA Number',
  abhaNumberHint: '14 digit ABHA number',
  verified: 'Verified',
  notVerified: 'Not Verified',
}

const regional = {
  'bn-IN': {
    ...en, language: 'ভাষা', selectLanguage: 'ভাষা নির্বাচন করুন', patientPortal: 'রোগী পোর্টাল',
    patientAccount: 'রোগীর অ্যাকাউন্ট', logout: 'লগআউট', smartHealthcarePortal: 'স্মার্ট হেলথকেয়ার পোর্টাল',
    welcomeBack: 'আবার স্বাগতম', startNewCase: 'নতুন কেস শুরু করুন', totalCases: 'মোট কেস',
    medicalDocuments: 'চিকিৎসা নথি', latestCase: 'সর্বশেষ কেস', noCaseYet: 'এখনও কোনো কেস নেই',
    quickActions: 'দ্রুত কাজ', manageHealthRecords: 'স্বাস্থ্য রেকর্ড পরিচালনা করুন', beginCaseTaking: 'কেস নেওয়া শুরু করুন',
    manageDocuments: 'নথি পরিচালনা করুন', previousCases: 'আগের কেস', viewCaseHistory: 'কেসের ইতিহাস দেখুন',
    activity: 'কার্যকলাপ', recentCase: 'সাম্প্রতিক কেস', viewAll: 'সব দেখুন', noCaseSubmittedYet: 'এখনও কোনো কেস জমা হয়নি',
    patientCase: 'রোগীর কেস', medicalCase: 'চিকিৎসা কেস', recently: 'সম্প্রতি', email: 'ইমেল', accountType: 'অ্যাকাউন্টের ধরন',
    patient: 'রোগী', caseRecords: 'কেস রেকর্ড', submitted: 'জমা হয়েছে', importantClinicalNotice: 'গুরুত্বপূর্ণ চিকিৎসা বিজ্ঞপ্তি',
    closeNotification: 'বিজ্ঞপ্তি বন্ধ করুন',
    heroDescription: 'আপনার স্বাস্থ্যযাত্রা পরিচালনা করুন। ডিজিটাল রোগীর ইতিহাস সম্পূর্ণ করুন, চিকিৎসা নথি আপলোড করুন এবং আগের পরামর্শগুলি দেখুন।',
    newCaseDescription: 'নির্দেশিত ডিজিটাল প্রক্রিয়ায় আপনার চিকিৎসা ইতিহাস, উপসর্গ এবং AYUSH মূল্যায়ন সম্পূর্ণ করুন।',
    documentsDescription: 'প্রেসক্রিপশন, ল্যাব রিপোর্ট, ডিসচার্জ সারাংশ এবং আগের চিকিৎসা নথি আপলোড করুন।',
    previousCasesDescription: 'জমা দেওয়া কেস, বর্তমান অবস্থা এবং আগের স্বাস্থ্য তথ্য দেখুন।',
    startFirstCaseDescription: 'আপনার প্রথম ডিজিটাল রোগী কেস শুরু করুন এবং এখানে দেখুন।',
    clinicalNoticeDescription: 'এই প্ল্যাটফর্ম রোগীর তথ্য সংগ্রহ ও সংগঠিত করতে সাহায্য করে। এটি পেশাদার চিকিৎসা পরামর্শ, রোগ নির্ণয় বা চিকিৎসার বিকল্প নয়।',
  },
  'mr-IN': {
    ...hi, language: 'भाषा', selectLanguage: 'भाषा निवडा', patientPortal: 'रुग्ण पोर्टल', patientAccount: 'रुग्ण खाते',
    logout: 'लॉग आउट', smartHealthcarePortal: 'स्मार्ट हेल्थकेअर पोर्टल', welcomeBack: 'पुन्हा स्वागत आहे',
    startNewCase: 'नवीन केस सुरू करा', totalCases: 'एकूण केस', medicalDocuments: 'वैद्यकीय कागदपत्रे',
    latestCase: 'नवीनतम केस', noCaseYet: 'अजून केस नाही', quickActions: 'जलद कृती',
    manageHealthRecords: 'तुमचे आरोग्य रेकॉर्ड व्यवस्थापित करा', beginCaseTaking: 'केस नोंदणी सुरू करा',
    manageDocuments: 'कागदपत्रे व्यवस्थापित करा', previousCases: 'मागील केस', viewCaseHistory: 'केसचा इतिहास पहा',
    activity: 'क्रियाकलाप', recentCase: 'अलीकडील केस', viewAll: 'सर्व पहा', noCaseSubmittedYet: 'अजून केस सबमिट केलेला नाही',
    patientCase: 'रुग्ण केस', medicalCase: 'वैद्यकीय केस', recently: 'अलीकडे', email: 'ईमेल', accountType: 'खात्याचा प्रकार',
    patient: 'रुग्ण', caseRecords: 'केस रेकॉर्ड', submitted: 'सबमिट केले', importantClinicalNotice: 'महत्त्वाची वैद्यकीय सूचना',
    closeNotification: 'सूचना बंद करा',
    heroDescription: 'तुमच्या आरोग्य प्रवासावर नियंत्रण ठेवा. डिजिटल रुग्ण इतिहास पूर्ण करा, वैद्यकीय नोंदी अपलोड करा आणि मागील सल्लामसलती पहा.',
    newCaseDescription: 'मार्गदर्शित डिजिटल प्रक्रियेद्वारे वैद्यकीय इतिहास, लक्षणे आणि AYUSH मूल्यांकन पूर्ण करा.',
    documentsDescription: 'प्रिस्क्रिप्शन, प्रयोगशाळा अहवाल, डिस्चार्ज सारांश आणि मागील वैद्यकीय नोंदी अपलोड करा.',
    previousCasesDescription: 'तुमचे सबमिट केलेले केस, त्यांची स्थिती आणि मागील आरोग्य माहिती पहा.',
    startFirstCaseDescription: 'तुमचा पहिला डिजिटल रुग्ण केस सुरू करा आणि तो येथे पहा.',
    clinicalNoticeDescription: 'हे प्लॅटफॉर्म रुग्णाची माहिती गोळा आणि व्यवस्थित करण्यात मदत करते. हे व्यावसायिक वैद्यकीय सल्ला, निदान किंवा उपचारांचा पर्याय नाही.',
  },
  'te-IN': { ...hi, language: 'భాష', selectLanguage: 'భాషను ఎంచుకోండి', patientPortal: 'రోగి పోర్టల్', patientAccount: 'రోగి ఖాతా', logout: 'లాగ్ అవుట్', startNewCase: 'కొత్త కేసు ప్రారంభించండి', totalCases: 'మొత్తం కేసులు', medicalDocuments: 'వైద్య పత్రాలు', latestCase: 'తాజా కేసు', noCaseYet: 'ఇంకా కేసు లేదు', quickActions: 'త్వరిత చర్యలు', manageHealthRecords: 'మీ ఆరోగ్య రికార్డులను నిర్వహించండి', previousCases: 'మునుపటి కేసులు', viewCaseHistory: 'కేసు చరిత్రను చూడండి', patient: 'రోగి', email: 'ఇమెయిల్', accountType: 'ఖాతా రకం', importantClinicalNotice: 'ముఖ్యమైన వైద్య సమాచారం', welcomeBack: 'మళ్లీ స్వాగతం', medicalCase: 'వైద్య కేసు', recently: 'ఇటీవల' },
  'ta-IN': { ...hi, language: 'மொழி', selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்', patientPortal: 'நோயாளர் போர்டல்', patientAccount: 'நோயாளர் கணக்கு', logout: 'வெளியேறு', startNewCase: 'புதிய வழக்கைத் தொடங்கவும்', totalCases: 'மொத்த வழக்குகள்', medicalDocuments: 'மருத்துவ ஆவணங்கள்', latestCase: 'சமீபத்திய வழக்கு', noCaseYet: 'இன்னும் வழக்கு இல்லை', quickActions: 'விரைவு செயல்கள்', manageHealthRecords: 'உங்கள் சுகாதார பதிவுகளை நிர்வகிக்கவும்', previousCases: 'முந்தைய வழக்குகள்', viewCaseHistory: 'வழக்கு வரலாற்றைக் காண்க', patient: 'நோயாளர்', email: 'மின்னஞ்சல்', accountType: 'கணக்கு வகை', importantClinicalNotice: 'முக்கிய மருத்துவ அறிவிப்பு', welcomeBack: 'மீண்டும் வரவேற்கிறோம்', medicalCase: 'மருத்துவ வழக்கு', recently: 'சமீபத்தில்' },
  'gu-IN': { ...hi, language: 'ભાષા', selectLanguage: 'ભાષા પસંદ કરો', patientPortal: 'દર્દી પોર્ટલ', patientAccount: 'દર્દી ખાતું', logout: 'લૉગ આઉટ', startNewCase: 'નવો કેસ શરૂ કરો', totalCases: 'કુલ કેસ', medicalDocuments: 'તબીબી દસ્તાવેજો', latestCase: 'નવીનતમ કેસ', noCaseYet: 'હજુ કોઈ કેસ નથી', quickActions: 'ઝડપી ક્રિયાઓ', manageHealthRecords: 'તમારા આરોગ્ય રેકોર્ડ મેનેજ કરો', previousCases: 'પાછલા કેસ', viewCaseHistory: 'કેસ ઇતિહાસ જુઓ', patient: 'દર્દી', email: 'ઇમેઇલ', accountType: 'ખાતાનો પ્રકાર', importantClinicalNotice: 'મહત્વપૂર્ણ તબીબી સૂચના', welcomeBack: 'ફરી સ્વાગત છે', medicalCase: 'તબીબી કેસ', recently: 'તાજેતરમાં' },
  'kn-IN': { ...hi, language: 'ಭಾಷೆ', selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', patientPortal: 'ರೋಗಿ ಪೋರ್ಟಲ್', patientAccount: 'ರೋಗಿ ಖಾತೆ', logout: 'ಲಾಗ್ ಔಟ್', startNewCase: 'ಹೊಸ ಪ್ರಕರಣ ಪ್ರಾರಂಭಿಸಿ', totalCases: 'ಒಟ್ಟು ಪ್ರಕರಣಗಳು', medicalDocuments: 'ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು', latestCase: 'ಇತ್ತೀಚಿನ ಪ್ರಕರಣ', noCaseYet: 'ಇನ್ನೂ ಪ್ರಕರಣವಿಲ್ಲ', quickActions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು', manageHealthRecords: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ', previousCases: 'ಹಿಂದಿನ ಪ್ರಕರಣಗಳು', viewCaseHistory: 'ಪ್ರಕರಣದ ಇತಿಹಾಸ ವೀಕ್ಷಿಸಿ', patient: 'ರೋಗಿ', email: 'ಇಮೇಲ್', accountType: 'ಖಾತೆಯ ಪ್ರಕಾರ', importantClinicalNotice: 'ಪ್ರಮುಖ ವೈದ್ಯಕೀಯ ಸೂಚನೆ', welcomeBack: 'ಮತ್ತೆ ಸ್ವಾಗತ', medicalCase: 'ವೈದ್ಯಕೀಯ ಪ್ರಕರಣ', recently: 'ಇತ್ತೀಚೆಗೆ' },
  'ml-IN': { ...hi, language: 'ഭാഷ', selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക', patientPortal: 'രോഗി പോർട്ടൽ', patientAccount: 'രോഗിയുടെ അക്കൗണ്ട്', logout: 'ലോഗ് ഔട്ട്', startNewCase: 'പുതിയ കേസ് ആരംഭിക്കുക', totalCases: 'ആകെ കേസുകൾ', medicalDocuments: 'മെഡിക്കൽ രേഖകൾ', latestCase: 'ഏറ്റവും പുതിയ കേസ്', noCaseYet: 'ഇതുവരെ കേസില്ല', quickActions: 'ദ്രുത പ്രവർത്തനങ്ങൾ', manageHealthRecords: 'നിങ്ങളുടെ ആരോഗ്യ രേഖകൾ നിയന്ത്രിക്കുക', previousCases: 'മുൻ കേസുകൾ', viewCaseHistory: 'കേസ് ചരിത്രം കാണുക', patient: 'രോഗി', email: 'ഇമെയിൽ', accountType: 'അക്കൗണ്ട് തരം', importantClinicalNotice: 'പ്രധാന മെഡിക്കൽ അറിയിപ്പ്', welcomeBack: 'വീണ്ടും സ്വാഗതം', medicalCase: 'മെഡിക്കൽ കേസ്', recently: 'അടുത്തിടെ' },
  'pa-IN': { ...hi, language: 'ਭਾਸ਼ਾ', selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ', patientPortal: 'ਮਰੀਜ਼ ਪੋਰਟਲ', patientAccount: 'ਮਰੀਜ਼ ਖਾਤਾ', logout: 'ਲੌਗ ਆਉਟ', startNewCase: 'ਨਵਾਂ ਕੇਸ ਸ਼ੁਰੂ ਕਰੋ', totalCases: 'ਕੁੱਲ ਕੇਸ', medicalDocuments: 'ਮੈਡੀਕਲ ਦਸਤਾਵੇਜ਼', latestCase: 'ਨਵਾਂ ਕੇਸ', noCaseYet: 'ਹਾਲੇ ਕੋਈ ਕੇਸ ਨਹੀਂ', quickActions: 'ਤੁਰੰਤ ਕਾਰਵਾਈਆਂ', manageHealthRecords: 'ਆਪਣੇ ਸਿਹਤ ਰਿਕਾਰਡ ਸੰਭਾਲੋ', previousCases: 'ਪਿਛਲੇ ਕੇਸ', viewCaseHistory: 'ਕੇਸ ਇਤਿਹਾਸ ਵੇਖੋ', patient: 'ਮਰੀਜ਼', email: 'ਈਮੇਲ', accountType: 'ਖਾਤੇ ਦੀ ਕਿਸਮ', importantClinicalNotice: 'ਮਹੱਤਵਪੂਰਨ ਮੈਡੀਕਲ ਸੂਚਨਾ', welcomeBack: 'ਜੀ ਆਇਆਂ ਨੂੰ', medicalCase: 'ਮੈਡੀਕਲ ਕੇਸ', recently: 'ਹਾਲ ਹੀ ਵਿੱਚ' },
  'or-IN': { ...hi, language: 'ଭାଷା', selectLanguage: 'ଭାଷା ବାଛନ୍ତୁ', patientPortal: 'ରୋଗୀ ପୋର୍ଟାଲ୍', patientAccount: 'ରୋଗୀ ଖାତା', logout: 'ଲଗ୍ ଆଉଟ୍', startNewCase: 'ନୂଆ କେସ୍ ଆରମ୍ଭ କରନ୍ତୁ', totalCases: 'ମୋଟ କେସ୍', medicalDocuments: 'ଚିକିତ୍ସା ଦଲିଲ', latestCase: 'ସର୍ବଶେଷ କେସ୍', noCaseYet: 'ଏପର୍ଯ୍ୟନ୍ତ କେସ୍ ନାହିଁ', quickActions: 'ଦ୍ରୁତ କାର୍ଯ୍ୟ', manageHealthRecords: 'ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ରେକର୍ଡ ପରିଚାଳନା କରନ୍ତୁ', previousCases: 'ପୂର୍ବ କେସ୍', viewCaseHistory: 'କେସ୍ ଇତିହାସ ଦେଖନ୍ତୁ', patient: 'ରୋଗୀ', email: 'ଇମେଲ୍', accountType: 'ଖାତା ପ୍ରକାର', importantClinicalNotice: 'ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଚିକିତ୍ସା ସୂଚନା', welcomeBack: 'ପୁଣି ସ୍ୱାଗତ', medicalCase: 'ଚିକିତ୍ସା କେସ୍', recently: 'ସମ୍ପ୍ରତି' },
  'as-IN': { ...hi, language: 'ভাষা', selectLanguage: 'ভাষা বাছনি কৰক', patientPortal: 'ৰোগী প’ৰ্টেল', patientAccount: 'ৰোগীৰ একাউণ্ট', logout: 'লগ আউট', startNewCase: 'নতুন কেছ আৰম্ভ কৰক', totalCases: 'মুঠ কেছ', medicalDocuments: 'চিকিৎসা নথি', latestCase: 'শেহতীয়া কেছ', noCaseYet: 'এতিয়ালৈ কোনো কেছ নাই', quickActions: 'দ্ৰুত কাৰ্য', manageHealthRecords: 'আপোনাৰ স্বাস্থ্য ৰেকৰ্ড পৰিচালনা কৰক', previousCases: 'পূৰ্বৰ কেছ', viewCaseHistory: 'কেছৰ ইতিহাস চাওক', patient: 'ৰোগী', email: 'ইমেইল', accountType: 'একাউণ্টৰ ধৰণ', importantClinicalNotice: 'গুৰুত্বপূৰ্ণ চিকিৎসা জাননী', welcomeBack: 'পুনৰ স্বাগতম', medicalCase: 'চিকিৎসা কেছ', recently: 'শেহতীয়াকৈ' },
}

const dictionaries = {
  'en-IN': en,
  'hi-IN': hi,
  hinglish,
  ...regional,
}

export function getPatientLanguage(code) {
  return PATIENT_LANGUAGES.find((item) => item.code === code) || PATIENT_LANGUAGES[0]
}

const PatientLanguageContext = createContext(null)

export function PatientLanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE
    } catch {
      return DEFAULT_LANGUAGE
    }
  })

  const setLanguage = (nextLanguage) => {
    const valid = getPatientLanguage(nextLanguage)
    setLanguageState(valid.code)
    try {
      localStorage.setItem(STORAGE_KEY, valid.code)
    } catch {
      // Ignore storage failures.
    }
    window.dispatchEvent(
      new CustomEvent('ayush-language-change', {
        detail: { language: valid.code },
      })
    )
  }

  const dictionary = dictionaries[language] || en

  const value = useMemo(() => ({
    language,
    setLanguage,
    languages: PATIENT_LANGUAGES,
    languageMeta: getPatientLanguage(language),
    t: (key) => dictionary[key] ?? CASE_TRANSLATIONS?.[language]?.[key] ?? en[key] ?? key,
  }), [language])

  return (
    <PatientLanguageContext.Provider value={value}>
      {children}
    </PatientLanguageContext.Provider>
  )
}

export function usePatientLanguage() {
  const context = useContext(PatientLanguageContext)

  if (!context) {
    throw new Error(
      'usePatientLanguage must be used inside PatientLanguageProvider'
    )
  }

  return context
}
