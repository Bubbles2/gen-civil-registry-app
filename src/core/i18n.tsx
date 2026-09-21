import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import {resources} from "./allTranslation";

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: "fr-FR",
    keySeparator: ".", // we do use keys in form messages.welcome
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
