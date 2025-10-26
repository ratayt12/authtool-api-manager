import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "es" | "pt" | "vi";

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  welcome: {
    en: "Welcome to SonicAPI",
    es: "Bienvenido a SonicAPI",
    pt: "Bem-vindo ao SonicAPI",
    vi: "Chào mừng đến với SonicAPI"
  },
  welcomeBack: {
    en: "Welcome back",
    es: "Bienvenido de nuevo",
    pt: "Bem-vindo de volta",
    vi: "Chào mừng trở lại"
  },
  keys: {
    en: "Keys",
    es: "Claves",
    pt: "Chaves",
    vi: "Khóa"
  },
  devices: {
    en: "Devices",
    es: "Dispositivos",
    pt: "Dispositivos",
    vi: "Thiết bị"
  },
  profile: {
    en: "Profile",
    es: "Perfil",
    pt: "Perfil",
    vi: "Hồ sơ"
  },
  privateChat: {
    en: "Private Chat",
    es: "Chat Privado",
    pt: "Chat Privado",
    vi: "Trò chuyện riêng"
  },
  support: {
    en: "Support",
    es: "Soporte",
    pt: "Suporte",
    vi: "Hỗ trợ"
  },
  createKey: {
    en: "Create Key",
    es: "Crear Clave",
    pt: "Criar Chave",
    vi: "Tạo khóa"
  },
  twoFASetup: {
    en: "2FA Setup",
    es: "Configurar 2FA",
    pt: "Configurar 2FA",
    vi: "Thiết lập 2FA"
  },
  logout: {
    en: "Logout",
    es: "Cerrar Sesión",
    pt: "Sair",
    vi: "Đăng xuất"
  },
  credits: {
    en: "Available Credits",
    es: "Créditos Disponibles",
    pt: "Créditos Disponíveis",
    vi: "Tín dụng khả dụng"
  },
  searchKeys: {
    en: "Search keys...",
    es: "Buscar claves...",
    pt: "Pesquisar chaves...",
    vi: "Tìm kiếm khóa..."
  },
  status: {
    en: "Status",
    es: "Estado",
    pt: "Estado",
    vi: "Trạng thái"
  },
  pending: {
    en: "Pending",
    es: "Pendiente",
    pt: "Pendente",
    vi: "Đang chờ"
  },
  active: {
    en: "Active",
    es: "Activo",
    pt: "Ativo",
    vi: "Hoạt động"
  },
  blocked: {
    en: "Blocked",
    es: "Bloqueado",
    pt: "Bloqueado",
    vi: "Bị chặn"
  },
  deleted: {
    en: "Deleted",
    es: "Eliminado",
    pt: "Excluído",
    vi: "Đã xóa"
  },
  myDevices: {
    en: "My Devices",
    es: "Mis Dispositivos",
    pt: "Meus Dispositivos",
    vi: "Thiết bị của tôi"
  },
  profileInfo: {
    en: "Profile Information",
    es: "Información del Perfil",
    pt: "Informações do Perfil",
    vi: "Thông tin hồ sơ"
  },
  username: {
    en: "Username",
    es: "Nombre de Usuario",
    pt: "Nome de Usuário",
    vi: "Tên người dùng"
  },
  language: {
    en: "Language",
    es: "Idioma",
    pt: "Idioma",
    vi: "Ngôn ngữ"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
