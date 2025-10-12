import { SORT_ORDER, OPEN_MODE } from "@/const"
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from "@/const"

const lang = {
  name: "हिन्दी",
  shorName: "hi",
  languageName: "Hindi",
  errorPage: {
    error: "भेजने के दौरान एक त्रुटि हुई।",
    afterShortTime: "कृपया कुछ देर बाद पुनः प्रयास करें।",
  },
  commandShare: {
    title: "कमांड शेयर करें",
    formTitle: "कमांड शेयर फॉर्म",
  },
  tagPicker: {
    notFound: "नहीं मिला",
    create: "क्या आप इसे बनाना चाहेंगे?",
  },
  inputForm: {
    title: {
      label: "शीर्षक",
      description: "कमांड के शीर्षक के रूप में दिखाया जाएगा।",
      placeholder: "कमांड का शीर्षक",
      message: {
        min3: "शीर्षक कम से कम 3 अक्षर का होना चाहिए।",
        max100: "शीर्षक अधिकतम 100 अक्षर का हो सकता है।",
      },
    },
    searchUrl: {
      label: "खोज URL",
      description: "`%s` को चयनित पाठ से बदल दिया जाएगा।",
      placeholder: "खोज URL",
      faviconAlt: "खोज URL का फेविकॉन",
      message: {
        url: "URL प्रारूप अमान्य है।",
        unique: "यह पहले से ही पंजीकृत है।",
      },
    },
    description: {
      label: "कमांड विवरण",
      description: "कमांड के विवरण के रूप में दिखाया जाएगा।",
      placeholder: "कमांड विवरण",
      message: {
        max200: "विवरण अधिकतम 200 अक्षर का हो सकता है।",
      },
    },
    tags: {
      label: "टैग",
      description: "कमांड के वर्गीकरण के रूप में दिखाया जाएगा।",
      message: {
        max5: "टैग अधिकतम 20 अक्षर का हो सकता है।",
        max20: "आप अधिकतम 5 टैग जोड़ सकते हैं।",
      },
    },
    iconUrl: {
      label: "आइकन URL",
      description: "मेनू के आइकन के रूप में दिखाया जाएगा।",
      placeholder: "आइकन URL",
      message: {
        url: "URL प्रारूप अमान्य है।",
      },
    },
    openMode: {
      label: "खोलने का मोड",
      description: "परिणाम दिखाने का तरीका।",
      options: {
        [OPEN_MODE.POPUP]: "पॉपअप",
        [OPEN_MODE.WINDOW]: "विंडो",
        [OPEN_MODE.TAB]: "टैब",
        [OPEN_MODE.BACKGROUND_TAB]: "बैकग्राउंड टैब",
        [OPEN_MODE.PAGE_ACTION]: "पेज एक्शन",
      },
    },
    openModeSecondary: {
      label: "Ctrl + क्लिक",
      description: "Ctrl + क्लिक करने पर परिणाम दिखाने का तरीका।",
    },
    spaceEncoding: {
      label: "स्पेस एन्कोडिंग",
      description: "चयनित पाठ में स्पेस को बदलता है।",
      options: {
        plus: "प्लस (+)",
        percent: "प्रतिशत (%20)",
      },
    },
    formDescription: "कमांड शेयर करने का अनुरोध।",
    formOptions: "विकल्प",
    confirm: "दर्ज की गई जानकारी की जांच करें",
    pageAction: {
      label: "पेज एक्शन",
      description: "निष्पादित होने वाला कार्य",
    },
    PageActionOption: {
      startUrl: {
        label: "प्रारंभ पृष्ठ URL",
        description: "पृष्ठ क्रिया शुरू होने वाले पृष्ठ का URL।",
        faviconAlt: "प्रारंभ पृष्ठ URL का फेविकॉन",
      },
      openMode: {
        label: "विंडो प्रदर्शन विधि",
        description: "विंडो कैसे प्रदर्शित की जाती है।",
      },
    },
  },
  confirmForm: {
    formDescription: "क्या निम्नलिखित जानकारी सही है?",
    caution:
      "※ भेजी गई जानकारी इस साइट पर प्रकाशित की जाएगी।\nकृपया व्यक्तिगत या गोपनीय जानकारी साझा करने से बचें।",
    back: "संशोधित करें",
    submit: "शेयर करें",
  },
  SendingForm: {
    sending: "भेज रहा है...",
  },
  completeForm: {
    formDescription: "भेजना पूरा हो गया है।",
    thanks:
      "अपनी कमांड शेयर करने के लिए धन्यवाद!\nडेवलपर द्वारा साइट पर इसे एकीकृत करने में 2-3 दिन लग सकते हैं।\nकृपया प्रकाशित होने तक प्रतीक्षा करें।",
    aboudDelete:
      "भेजने के बाद हटाने का अनुरोध करने के लिए, कृपया नीचे दिए गए लिंक का उपयोग करें।",
    supportHub: "सपोर्ट हब पर जाएं",
  },
  errorForm: {
    formDescription: "भेजने के दौरान एक त्रुटि हुई...",
    message:
      "कृपया कुछ देर बाद पुनः प्रयास करें या नीचे दिए गए लिंक के माध्यम से डेवलपर से संपर्क करें।",
    supportHub: "सपोर्ट हब पर जाएं",
  },
  notFound: {
    title: "पेज नहीं मिला",
    message:
      "आप जिस पेज तक पहुंचने का प्रयास कर रहे हैं वह मौजूद नहीं है।\nकृपया URL की जांच करें।",
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: "खोज URL",
    [SORT_ORDER.title]: "शीर्षक",
    [SORT_ORDER.download]: "डाउनलोड",
    [SORT_ORDER.star]: "स्टार",
    [SORT_ORDER.addedAt]: "जोड़ा गया दिनांक",
    new: "नवीनतम",
    old: "पुराना",
  },
  about: {
    terms: "उपयोग की शर्तें",
    privacy: "गोपनीयता नीति",
    cookie: "कुकी नीति",
  },
  cookieConsent: {
    title: "कुकीज़ के बारे में",
    message:
      "यह साइट आपके अनुभव को बेहतर बनाने के लिए कुकीज़ का उपयोग करती है। अधिक जानकारी के लिए हमारी कुकी नीति देखें।",
    accept: "स्वीकार करें",
    decline: "अस्वीकार करें",
  },
  uninstallForm: {
    title: "अनइंस्टॉल पूरा हुआ।",
    description:
      "अब तक Selection Command का उपयोग करने के लिए धन्यवाद। हमें आपको जाते हुए देखकर दुख हो रहा है, लेकिन हम आभारी होंगे यदि आप एक्सटेंशन को बेहतर बनाने में हमारी मदद करने के लिए नीचे दिए गए सर्वेक्षण का जवाब दे सकें।",
    reinstall:
      "यदि आपने गलती से इसे अनइंस्टॉल किया है, तो आप नीचे दिए गए लिंक के माध्यम से इसे पुनः इंस्टॉल कर सकते हैं।",
    wantedToUseTitle:
      "आप कौन सी सुविधाओं का उपयोग करना चाहते थे? (एकाधिक विकल्प)",
    wantedToUsePlaceholder: "कृपया हमें बताएं कि आप क्या करना चाहते थे",
    reasonTitle: "कृपया अनइंस्टॉल करने का कारण बताएं। (एकाधिक विकल्प संभव)",
    otherReasonPlaceholder: "कृपया कारण निर्दिष्ट करें",
    detailsTitle: "यदि संभव हो, तो कृपया अधिक विवरण दें।",
    detailsPlaceholder:
      "अनइंस्टॉल करने के कारण का विवरण,\nआप क्या करना चाहते थे या किन कठिनाइयों का सामना किया,\nजिन साइटों पर यह काम नहीं कर रहा था, आदि",
    submit: "भेजें",
    submitting: "भेज रहा है...",
    success: {
      title: "सर्वेक्षण सफलतापूर्वक भेजा गया।",
      message:
        "आपके जवाब के लिए धन्यवाद। हम आपकी प्रतिक्रिया की सराहना करते हैं।\nयदि आप इस फॉर्म के बाहर सीधे संपर्क करना चाहते हैं, तो कृपया takeda.yujiro@gmail.com पर एक स्पष्ट विषय के साथ ईमेल करें।",
    },
    error: "भेजना विफल रहा। कृपया कुछ देर बाद पुनः प्रयास करें।",
    wantedToUse: {
      search_selected_text: "चयनित पाठ खोजें",
      ai_chatbot: "AI चैटबॉट (जैसे ChatGPT)",
      link_preview: "लिंक पूर्वावलोकन",
      [OTHER_OPTION]: "अन्य",
    },
    reasons: {
      difficult_to_use: "मुझे इसका उपयोग करना नहीं आया",
      not_user_friendly: "उपयोगकर्ता के अनुकूल नहीं",
      not_working: "अपेक्षा के अनुसार काम नहीं किया",
      missing_features: "आवश्यक सुविधाएँ नहीं थीं",
      too_many_permissions: "बहुत अधिक अनुमतियाँ आवश्यक थीं",
      found_better: "बेहतर विकल्प मिला",
      no_longer_needed: "अब आवश्यकता नहीं",
      language_not_supported: "भाषा समर्थित नहीं है",
      search_engine_is_not_available: "वांछित सर्च इंजन उपलब्ध नहीं",
      i_dont_know_how_to_add_commands: "कमांड जोड़ना नहीं आता",
      settings_are_complicated: "सेटिंग्स बहुत जटिल हैं",
      [UNINSTALL_OTHER_OPTION]: "अन्य",
    },
  },
}
export default lang
