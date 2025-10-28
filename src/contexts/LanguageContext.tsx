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
  accountPendingApproval: {
    en: "Account Pending Approval",
    es: "Cuenta Pendiente de Aprobación",
    pt: "Conta Pendente de Aprovação",
    vi: "Tài khoản đang chờ phê duyệt"
  },
  accountPendingDescription: {
    en: "Your account is waiting for admin approval. You'll be able to access the dashboard once approved.",
    es: "Tu cuenta está esperando la aprobación del administrador. Podrás acceder al panel una vez aprobado.",
    pt: "Sua conta está aguardando aprovação do administrador. Você poderá acessar o painel após a aprovação.",
    vi: "Tài khoản của bạn đang chờ quản trị viên phê duyệt. Bạn sẽ có thể truy cập bảng điều khiển sau khi được phê duyệt."
  },
  signOut: {
    en: "Sign Out",
    es: "Cerrar Sesión",
    pt: "Sair",
    vi: "Đăng xuất"
  },
  accountSuspended: {
    en: "Account Suspended",
    es: "Cuenta Suspendida",
    pt: "Conta Suspensa",
    vi: "Tài khoản bị đình chỉ"
  },
  accountSuspendedUntil: {
    en: "Your account has been temporarily suspended until",
    es: "Su cuenta ha sido suspendida temporalmente hasta",
    pt: "Sua conta foi temporariamente suspensa até",
    vi: "Tài khoản của bạn đã bị đình chỉ tạm thời cho đến"
  },
  yourKeys: {
    en: "Your Keys",
    es: "Tus Claves",
    pt: "Suas Chaves",
    vi: "Khóa của bạn"
  },
  manageKeysDescription: {
    en: "Manage and monitor your generated API keys",
    es: "Administrar y monitorear tus claves API generadas",
    pt: "Gerenciar e monitorar suas chaves de API geradas",
    vi: "Quản lý và giám sát các khóa API đã tạo của bạn"
  },
  searchKeys: {
    en: "Search keys...",
    es: "Buscar claves...",
    pt: "Pesquisar chaves...",
    vi: "Tìm kiếm khóa..."
  },
  noKeysYet: {
    en: "No keys created yet. Create your first key to get started!",
    es: "Aún no se han creado claves. ¡Crea tu primera clave para comenzar!",
    pt: "Nenhuma chave criada ainda. Crie sua primeira chave para começar!",
    vi: "Chưa tạo khóa nào. Tạo khóa đầu tiên của bạn để bắt đầu!"
  },
  status: {
    en: "Status",
    es: "Estado",
    pt: "Estado",
    vi: "Trạng thái"
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
  duration: {
    en: "Duration",
    es: "Duración",
    pt: "Duração",
    vi: "Thời hạn"
  },
  created: {
    en: "Created",
    es: "Creado",
    pt: "Criado",
    vi: "Đã tạo"
  },
  activations: {
    en: "Activations",
    es: "Activaciones",
    pt: "Ativações",
    vi: "Kích hoạt"
  },
  details: {
    en: "Details",
    es: "Detalles",
    pt: "Detalhes",
    vi: "Chi tiết"
  },
  reset: {
    en: "Reset",
    es: "Restablecer",
    pt: "Redefinir",
    vi: "Đặt lại"
  },
  unblock: {
    en: "Unblock",
    es: "Desbloquear",
    pt: "Desbloquear",
    vi: "Bỏ chặn"
  },
  block: {
    en: "Block",
    es: "Bloquear",
    pt: "Bloquear",
    vi: "Chặn"
  },
  delete: {
    en: "Delete",
    es: "Eliminar",
    pt: "Excluir",
    vi: "Xóa"
  },
  createNewKey: {
    en: "Create New Key",
    es: "Crear Nueva Clave",
    pt: "Criar Nova Chave",
    vi: "Tạo khóa mới"
  },
  selectDurationDescription: {
    en: "Select the duration for your new API key. Credits required vary by duration.",
    es: "Selecciona la duración de tu nueva clave API. Los créditos requeridos varían según la duración.",
    pt: "Selecione a duração da sua nova chave de API. Os créditos necessários variam de acordo com a duração.",
    vi: "Chọn thời hạn cho khóa API mới của bạn. Tín dụng cần thiết thay đổi theo thời hạn."
  },
  keyDuration: {
    en: "Key Duration",
    es: "Duración de la Clave",
    pt: "Duração da Chave",
    vi: "Thời hạn khóa"
  },
  oneDay: {
    en: "1 Day (1 Credit)",
    es: "1 Día (1 Crédito)",
    pt: "1 Dia (1 Crédito)",
    vi: "1 Ngày (1 Tín dụng)"
  },
  oneWeek: {
    en: "1 Week (3 Credits)",
    es: "1 Semana (3 Créditos)",
    pt: "1 Semana (3 Créditos)",
    vi: "1 Tuần (3 Tín dụng)"
  },
  oneMonth: {
    en: "1 Month (5 Credits)",
    es: "1 Mes (5 Créditos)",
    pt: "1 Mês (5 Créditos)",
    vi: "1 Tháng (5 Tín dụng)"
  },
  cancel: {
    en: "Cancel",
    es: "Cancelar",
    pt: "Cancelar",
    vi: "Hủy"
  },
  themeCustomization: {
    en: "Theme Customization",
    es: "Personalización del Tema",
    pt: "Personalização do Tema",
    vi: "Tùy chỉnh giao diện"
  },
  customizeColorsDescription: {
    en: "Customize your UI and website colors",
    es: "Personaliza los colores de tu interfaz y sitio web",
    pt: "Personalize as cores da sua interface e site",
    vi: "Tùy chỉnh màu sắc giao diện và trang web của bạn"
  },
  primaryColor: {
    en: "Primary Color",
    es: "Color Primario",
    pt: "Cor Primária",
    vi: "Màu chính"
  },
  accentColor: {
    en: "Accent Color",
    es: "Color de Acento",
    pt: "Cor de Destaque",
    vi: "Màu điểm nhấn"
  },
  backgroundColor: {
    en: "Background Color",
    es: "Color de Fondo",
    pt: "Cor de Fundo",
    vi: "Màu nền"
  },
  lightningColor: {
    en: "Lightning Color",
    es: "Color del Rayo",
    pt: "Cor do Relâmpago",
    vi: "Màu tia sét"
  },
  saveColors: {
    en: "Save Colors",
    es: "Guardar Colores",
    pt: "Salvar Cores",
    vi: "Lưu màu"
  },
  changeUsername: {
    en: "Change Username",
    es: "Cambiar Nombre de Usuario",
    pt: "Alterar Nome de Usuário",
    vi: "Đổi tên người dùng"
  },
  usernameChangeDescription: {
    en: "You can change your username once every 30 days",
    es: "Puedes cambiar tu nombre de usuario una vez cada 30 días",
    pt: "Você pode alterar seu nome de usuário uma vez a cada 30 dias",
    vi: "Bạn có thể thay đổi tên người dùng mỗi 30 ngày một lần"
  },
  usernameChangeWait: {
    en: "You can change your username in",
    es: "Puedes cambiar tu nombre de usuario en",
    pt: "Você pode alterar seu nome de usuário em",
    vi: "Bạn có thể thay đổi tên người dùng sau"
  },
  days: {
    en: "days",
    es: "días",
    pt: "dias",
    vi: "ngày"
  },
  newUsername: {
    en: "New Username",
    es: "Nuevo Nombre de Usuario",
    pt: "Novo Nome de Usuário",
    vi: "Tên người dùng mới"
  },
  enterNewUsername: {
    en: "Enter new username",
    es: "Ingresa nuevo nombre de usuario",
    pt: "Digite o novo nome de usuário",
    vi: "Nhập tên người dùng mới"
  },
  updateUsername: {
    en: "Update Username",
    es: "Actualizar Nombre de Usuario",
    pt: "Atualizar Nome de Usuário",
    vi: "Cập nhật tên người dùng"
  },
  changePassword: {
    en: "Change Password",
    es: "Cambiar Contraseña",
    pt: "Alterar Senha",
    vi: "Đổi mật khẩu"
  },
  passwordChangeDescription: {
    en: "Update your account password",
    es: "Actualiza la contraseña de tu cuenta",
    pt: "Atualize a senha da sua conta",
    vi: "Cập nhật mật khẩu tài khoản của bạn"
  },
  newPassword: {
    en: "New Password",
    es: "Nueva Contraseña",
    pt: "Nova Senha",
    vi: "Mật khẩu mới"
  },
  confirmPassword: {
    en: "Confirm Password",
    es: "Confirmar Contraseña",
    pt: "Confirmar Senha",
    vi: "Xác nhận mật khẩu"
  },
  updatePassword: {
    en: "Update Password",
    es: "Actualizar Contraseña",
    pt: "Atualizar Senha",
    vi: "Cập nhật mật khẩu"
  },
  languagePreference: {
    en: "Language Preference",
    es: "Preferencia de Idioma",
    pt: "Preferência de Idioma",
    vi: "Tùy chọn ngôn ngữ"
  },
  selectLanguage: {
    en: "Select your preferred language",
    es: "Selecciona tu idioma preferido",
    pt: "Selecione seu idioma preferido",
    vi: "Chọn ngôn ngữ ưa thích của bạn"
  },
  language: {
    en: "Language",
    es: "Idioma",
    pt: "Idioma",
    vi: "Ngôn ngữ"
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
