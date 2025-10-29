import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "es" | "pt" | "vi" | "ar" | "th";

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
    vi: "Chào mừng đến với SonicAPI",
    ar: "مرحباً بك في SonicAPI",
    th: "ยินดีต้อนรับสู่ SonicAPI"
  },
  welcomeBack: {
    en: "Welcome back",
    es: "Bienvenido de nuevo",
    pt: "Bem-vindo de volta",
    vi: "Chào mừng trở lại",
    ar: "مرحبا بعودتك",
    th: "ยินดีต้อนรับกลับมา"
  },
  keys: {
    en: "Keys",
    es: "Claves",
    pt: "Chaves",
    vi: "Khóa",
    ar: "المفاتيح",
    th: "คีย์"
  },
  devices: {
    en: "Devices",
    es: "Dispositivos",
    pt: "Dispositivos",
    vi: "Thiết bị",
    ar: "الأجهزة",
    th: "อุปกรณ์"
  },
  profile: {
    en: "Profile",
    es: "Perfil",
    pt: "Perfil",
    vi: "Hồ sơ",
    ar: "الملف الشخصي",
    th: "โปรไฟล์"
  },
  privateChat: {
    en: "Private Chat",
    es: "Chat Privado",
    pt: "Chat Privado",
    vi: "Trò chuyện riêng",
    ar: "الدردشة الخاصة",
    th: "แชทส่วนตัว"
  },
  support: {
    en: "Support",
    es: "Soporte",
    pt: "Suporte",
    vi: "Hỗ trợ",
    ar: "الدعم",
    th: "การสนับสนุน"
  },
  createKey: {
    en: "Create Key",
    es: "Crear Clave",
    pt: "Criar Chave",
    vi: "Tạo khóa",
    ar: "إنشاء مفتاح",
    th: "สร้างคีย์"
  },
  logout: {
    en: "Logout",
    es: "Cerrar Sesión",
    pt: "Sair",
    vi: "Đăng xuất",
    ar: "تسجيل الخروج",
    th: "ออกจากระบบ"
  },
  credits: {
    en: "Available Credits",
    es: "Créditos Disponibles",
    pt: "Créditos Disponíveis",
    vi: "Tín dụng khả dụng",
    ar: "الاعتمادات المتاحة",
    th: "เครดิตที่มีอยู่"
  },
  accountPendingApproval: {
    en: "Account Pending Approval",
    es: "Cuenta Pendiente de Aprobación",
    pt: "Conta Pendente de Aprovação",
    vi: "Tài khoản đang chờ phê duyệt",
    ar: "الحساب في انتظار الموافقة",
    th: "บัญชีรอการอนุมัติ"
  },
  accountPendingDescription: {
    en: "Your account is waiting for admin approval. You'll be able to access the dashboard once approved.",
    es: "Tu cuenta está esperando la aprobación del administrador. Podrás acceder al panel una vez aprobado.",
    pt: "Sua conta está aguardando aprovação do administrador. Você poderá acessar o painel após a aprovação.",
    vi: "Tài khoản của bạn đang chờ quản trị viên phê duyệt. Bạn sẽ có thể truy cập bảng điều khiển sau khi được phê duyệt.",
    ar: "حسابك في انتظار موافقة المسؤول. ستتمكن من الوصول إلى لوحة التحكم بمجرد الموافقة عليه.",
    th: "บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ คุณจะสามารถเข้าถึงแดชบอร์ดได้เมื่อได้รับการอนุมัติ"
  },
  signOut: {
    en: "Sign Out",
    es: "Cerrar Sesión",
    pt: "Sair",
    vi: "Đăng xuất",
    ar: "تسجيل الخروج",
    th: "ออกจากระบบ"
  },
  accountSuspended: {
    en: "Account Suspended",
    es: "Cuenta Suspendida",
    pt: "Conta Suspensa",
    vi: "Tài khoản bị đình chỉ",
    ar: "الحساب معلق",
    th: "บัญชีถูกระงับ"
  },
  accountSuspendedUntil: {
    en: "Your account has been temporarily suspended until",
    es: "Su cuenta ha sido suspendida temporalmente hasta",
    pt: "Sua conta foi temporariamente suspensa até",
    vi: "Tài khoản của bạn đã bị đình chỉ tạm thời cho đến",
    ar: "تم تعليق حسابك مؤقتًا حتى",
    th: "บัญชีของคุณถูกระงับชั่วคราวจนถึง"
  },
  yourKeys: {
    en: "Your Keys",
    es: "Tus Claves",
    pt: "Suas Chaves",
    vi: "Khóa của bạn",
    ar: "مفاتيحك",
    th: "คีย์ของคุณ"
  },
  manageKeysDescription: {
    en: "Manage and monitor your generated API keys",
    es: "Administrar y monitorear tus claves API generadas",
    pt: "Gerenciar e monitorar suas chaves de API geradas",
    vi: "Quản lý và giám sát các khóa API đã tạo của bạn",
    ar: "إدارة ومراقبة مفاتيح API التي تم إنشاؤها",
    th: "จัดการและตรวจสอบคีย์ API ที่สร้างของคุณ"
  },
  searchKeys: {
    en: "Search keys...",
    es: "Buscar claves...",
    pt: "Pesquisar chaves...",
    vi: "Tìm kiếm khóa...",
    ar: "البحث عن المفاتيح...",
    th: "ค้นหาคีย์..."
  },
  noKeysYet: {
    en: "No keys created yet. Create your first key to get started!",
    es: "Aún no se han creado claves. ¡Crea tu primera clave para comenzar!",
    pt: "Nenhuma chave criada ainda. Crie sua primeira chave para começar!",
    vi: "Chưa tạo khóa nào. Tạo khóa đầu tiên của bạn để bắt đầu!",
    ar: "لم يتم إنشاء مفاتيح بعد. أنشئ مفتاحك الأول للبدء!",
    th: "ยังไม่มีคีย์ที่สร้าง สร้างคีย์แรกของคุณเพื่อเริ่มต้น!"
  },
  status: {
    en: "Status",
    es: "Estado",
    pt: "Estado",
    vi: "Trạng thái",
    ar: "الحالة",
    th: "สถานะ"
  },
  active: {
    en: "Active",
    es: "Activo",
    pt: "Ativo",
    vi: "Hoạt động",
    ar: "نشط",
    th: "ใช้งานอยู่"
  },
  blocked: {
    en: "Blocked",
    es: "Bloqueado",
    pt: "Bloqueado",
    vi: "Bị chặn",
    ar: "محظور",
    th: "ถูกบล็อก"
  },
  deleted: {
    en: "Deleted",
    es: "Eliminado",
    pt: "Excluído",
    vi: "Đã xóa",
    ar: "محذوف",
    th: "ถูกลบ"
  },
  duration: {
    en: "Duration",
    es: "Duración",
    pt: "Duração",
    vi: "Thời hạn",
    ar: "المدة",
    th: "ระยะเวลา"
  },
  created: {
    en: "Created",
    es: "Creado",
    pt: "Criado",
    vi: "Đã tạo",
    ar: "تم الإنشاء",
    th: "สร้างแล้ว"
  },
  activations: {
    en: "Activations",
    es: "Activaciones",
    pt: "Ativações",
    vi: "Kích hoạt",
    ar: "التفعيلات",
    th: "การเปิดใช้งาน"
  },
  details: {
    en: "Details",
    es: "Detalles",
    pt: "Detalhes",
    vi: "Chi tiết",
    ar: "التفاصيل",
    th: "รายละเอียด"
  },
  reset: {
    en: "Reset",
    es: "Restablecer",
    pt: "Redefinir",
    vi: "Đặt lại",
    ar: "إعادة تعيين",
    th: "รีเซ็ต"
  },
  unblock: {
    en: "Unblock",
    es: "Desbloquear",
    pt: "Desbloquear",
    vi: "Bỏ chặn",
    ar: "إلغاء الحظر",
    th: "ปลดบล็อก"
  },
  block: {
    en: "Block",
    es: "Bloquear",
    pt: "Bloquear",
    vi: "Chặn",
    ar: "حظر",
    th: "บล็อก"
  },
  delete: {
    en: "Delete",
    es: "Eliminar",
    pt: "Excluir",
    vi: "Xóa",
    ar: "حذف",
    th: "ลบ"
  },
  createNewKey: {
    en: "Create New Key",
    es: "Crear Nueva Clave",
    pt: "Criar Nova Chave",
    vi: "Tạo khóa mới",
    ar: "إنشاء مفتاح جديد",
    th: "สร้างคีย์ใหม่"
  },
  selectDurationDescription: {
    en: "Select the duration for your new API key. Credits required vary by duration.",
    es: "Selecciona la duración de tu nueva clave API. Los créditos requeridos varían según la duración.",
    pt: "Selecione a duração da sua nova chave de API. Os créditos necessários variam de acordo com a duração.",
    vi: "Chọn thời hạn cho khóa API mới của bạn. Tín dụng cần thiết thay đổi theo thời hạn.",
    ar: "حدد مدة مفتاح API الجديد الخاص بك. تختلف الاعتمادات المطلوبة حسب المدة.",
    th: "เลือกระยะเวลาสำหรับคีย์ API ใหม่ของคุณ เครดิตที่จำเป็นแตกต่างกันตามระยะเวลา"
  },
  keyDuration: {
    en: "Key Duration",
    es: "Duración de la Clave",
    pt: "Duração da Chave",
    vi: "Thời hạn khóa",
    ar: "مدة المفتاح",
    th: "ระยะเวลาของคีย์"
  },
  oneDay: {
    en: "1 Day (1 Credit)",
    es: "1 Día (1 Crédito)",
    pt: "1 Dia (1 Crédito)",
    vi: "1 Ngày (1 Tín dụng)",
    ar: "يوم واحد (ائتمان واحد)",
    th: "1 วัน (1 เครดิต)"
  },
  oneWeek: {
    en: "1 Week (3 Credits)",
    es: "1 Semana (3 Créditos)",
    pt: "1 Semana (3 Créditos)",
    vi: "1 Tuần (3 Tín dụng)",
    ar: "أسبوع واحد (3 اعتمادات)",
    th: "1 สัปดาห์ (3 เครดิต)"
  },
  oneMonth: {
    en: "1 Month (5 Credits)",
    es: "1 Mes (5 Créditos)",
    pt: "1 Mês (5 Créditos)",
    vi: "1 Tháng (5 Tín dụng)",
    ar: "شهر واحد (5 اعتمادات)",
    th: "1 เดือน (5 เครดิต)"
  },
  cancel: {
    en: "Cancel",
    es: "Cancelar",
    pt: "Cancelar",
    vi: "Hủy",
    ar: "إلغاء",
    th: "ยกเลิก"
  },
  themeCustomization: {
    en: "Theme Customization",
    es: "Personalización del Tema",
    pt: "Personalização do Tema",
    vi: "Tùy chỉnh giao diện",
    ar: "تخصيص السمة",
    th: "ปรับแต่งธีม"
  },
  customizeColorsDescription: {
    en: "Customize your UI and website colors",
    es: "Personaliza los colores de tu interfaz y sitio web",
    pt: "Personalize as cores da sua interface e site",
    vi: "Tùy chỉnh màu sắc giao diện và trang web của bạn",
    ar: "قم بتخصيص ألوان واجهة المستخدم والموقع الإلكتروني الخاص بك",
    th: "ปรับแต่งสีของ UI และเว็บไซต์ของคุณ"
  },
  primaryColor: {
    en: "Primary Color",
    es: "Color Primario",
    pt: "Cor Primária",
    vi: "Màu chính",
    ar: "اللون الأساسي",
    th: "สีหลัก"
  },
  accentColor: {
    en: "Accent Color",
    es: "Color de Acento",
    pt: "Cor de Destaque",
    vi: "Màu điểm nhấn",
    ar: "لون التمييز",
    th: "สีเน้น"
  },
  backgroundColor: {
    en: "Background Color",
    es: "Color de Fondo",
    pt: "Cor de Fundo",
    vi: "Màu nền",
    ar: "لون الخلفية",
    th: "สีพื้นหลัง"
  },
  lightningColor: {
    en: "Lightning Color",
    es: "Color del Rayo",
    pt: "Cor do Relâmpago",
    vi: "Màu tia sét",
    ar: "لون البرق",
    th: "สีฟ้าผ่า"
  },
  segmentColor: {
    en: "Segment Color",
    es: "Color de Segmentos",
    pt: "Cor dos Segmentos",
    vi: "Màu phân đoạn",
    ar: "لون القطاع",
    th: "สีส่วน"
  },
  saveColors: {
    en: "Save Colors",
    es: "Guardar Colores",
    pt: "Salvar Cores",
    vi: "Lưu màu",
    ar: "حفظ الألوان",
    th: "บันทึกสี"
  },
  changeUsername: {
    en: "Change Username",
    es: "Cambiar Nombre de Usuario",
    pt: "Alterar Nome de Usuário",
    vi: "Đổi tên người dùng",
    ar: "تغيير اسم المستخدم",
    th: "เปลี่ยนชื่อผู้ใช้"
  },
  usernameChangeDescription: {
    en: "You can change your username once every 30 days",
    es: "Puedes cambiar tu nombre de usuario una vez cada 30 días",
    pt: "Você pode alterar seu nome de usuário uma vez a cada 30 dias",
    vi: "Bạn có thể thay đổi tên người dùng mỗi 30 ngày một lần",
    ar: "يمكنك تغيير اسم المستخدم مرة كل 30 يومًا",
    th: "คุณสามารถเปลี่ยนชื่อผู้ใช้ได้ทุก 30 วัน"
  },
  usernameChangeWait: {
    en: "You can change your username in",
    es: "Puedes cambiar tu nombre de usuario en",
    pt: "Você pode alterar seu nome de usuário em",
    vi: "Bạn có thể thay đổi tên người dùng sau",
    ar: "يمكنك تغيير اسم المستخدم في",
    th: "คุณสามารถเปลี่ยนชื่อผู้ใช้ได้ใน"
  },
  days: {
    en: "days",
    es: "días",
    pt: "dias",
    vi: "ngày",
    ar: "أيام",
    th: "วัน"
  },
  newUsername: {
    en: "New Username",
    es: "Nuevo Nombre de Usuario",
    pt: "Novo Nome de Usuário",
    vi: "Tên người dùng mới",
    ar: "اسم المستخدم الجديد",
    th: "ชื่อผู้ใช้ใหม่"
  },
  enterNewUsername: {
    en: "Enter new username",
    es: "Ingresa nuevo nombre de usuario",
    pt: "Digite o novo nome de usuário",
    vi: "Nhập tên người dùng mới",
    ar: "أدخل اسم المستخدم الجديد",
    th: "ป้อนชื่อผู้ใช้ใหม่"
  },
  updateUsername: {
    en: "Update Username",
    es: "Actualizar Nombre de Usuario",
    pt: "Atualizar Nome de Usuário",
    vi: "Cập nhật tên người dùng",
    ar: "تحديث اسم المستخدم",
    th: "อัปเดตชื่อผู้ใช้"
  },
  changePassword: {
    en: "Change Password",
    es: "Cambiar Contraseña",
    pt: "Alterar Senha",
    vi: "Đổi mật khẩu",
    ar: "تغيير كلمة المرور",
    th: "เปลี่ยนรหัสผ่าน"
  },
  passwordChangeDescription: {
    en: "Update your account password",
    es: "Actualiza la contraseña de tu cuenta",
    pt: "Atualize a senha da sua conta",
    vi: "Cập nhật mật khẩu tài khoản của bạn",
    ar: "قم بتحديث كلمة مرور حسابك",
    th: "อัปเดตรหัสผ่านบัญชีของคุณ"
  },
  newPassword: {
    en: "New Password",
    es: "Nueva Contraseña",
    pt: "Nova Senha",
    vi: "Mật khẩu mới",
    ar: "كلمة المرور الجديدة",
    th: "รหัสผ่านใหม่"
  },
  confirmPassword: {
    en: "Confirm Password",
    es: "Confirmar Contraseña",
    pt: "Confirmar Senha",
    vi: "Xác nhận mật khẩu",
    ar: "تأكيد كلمة المرور",
    th: "ยืนยันรหัสผ่าน"
  },
  updatePassword: {
    en: "Update Password",
    es: "Actualizar Contraseña",
    pt: "Atualizar Senha",
    vi: "Cập nhật mật khẩu",
    ar: "تحديث كلمة المرور",
    th: "อัปเดตรหัสผ่าน"
  },
  languagePreference: {
    en: "Language Preference",
    es: "Preferencia de Idioma",
    pt: "Preferência de Idioma",
    vi: "Tùy chọn ngôn ngữ",
    ar: "تفضيل اللغة",
    th: "การตั้งค่าภาษา"
  },
  selectLanguage: {
    en: "Select your preferred language",
    es: "Selecciona tu idioma preferido",
    pt: "Selecione seu idioma preferido",
    vi: "Chọn ngôn ngữ ưa thích của bạn",
    ar: "اختر لغتك المفضلة",
    th: "เลือกภาษาที่คุณต้องการ"
  },
  language: {
    en: "Language",
    es: "Idioma",
    pt: "Idioma",
    vi: "Ngôn ngữ",
    ar: "اللغة",
    th: "ภาษา"
  },
  myDevices: {
    en: "My Devices",
    es: "Mis Dispositivos",
    pt: "Meus Dispositivos",
    vi: "Thiết bị của tôi",
    ar: "أجهزتي",
    th: "อุปกรณ์ของฉัน"
  },
  profileInfo: {
    en: "Profile Information",
    es: "Información del Perfil",
    pt: "Informações do Perfil",
    vi: "Thông tin hồ sơ",
    ar: "معلومات الملف الشخصي",
    th: "ข้อมูลโปรไฟล์"
  },
  username: {
    en: "Username",
    es: "Nombre de Usuario",
    pt: "Nome de Usuário",
    vi: "Tên người dùng",
    ar: "اسم المستخدم",
    th: "ชื่อผู้ใช้"
  },
  wheelGifts: {
    en: "SonicMode Gifts 🎁",
    es: "Regalos SonicMode 🎁",
    pt: "Presentes SonicMode 🎁",
    vi: "Quà tặng SonicMode 🎁",
    ar: "هدايا SonicMode 🎁",
    th: "ของขวัญ SonicMode 🎁"
  },
  spinNow: {
    en: "Spin Now!",
    es: "¡Girar Ahora!",
    pt: "Girar Agora!",
    vi: "Quay Ngay!",
    ar: "أدر الآن!",
    th: "หมุนเลย!"
  },
  spinning: {
    en: "Spinning...",
    es: "Girando...",
    pt: "Girando...",
    vi: "Đang quay...",
    ar: "يدور...",
    th: "กำลังหมุน..."
  },
  nextSpinIn: {
    en: "Next spin in",
    es: "Próximo giro en",
    pt: "Próximo giro em",
    vi: "Quay tiếp theo sau",
    ar: "الدوران التالي في",
    th: "หมุนครั้งต่อไปใน"
  },
  youWon: {
    en: "You Won!",
    es: "¡Ganaste!",
    pt: "Você Ganhou!",
    vi: "Bạn Thắng!",
    ar: "لقد فزت!",
    th: "คุณชนะ!"
  },
  almost: {
    en: "Almost!",
    es: "¡Casi!",
    pt: "Quase!",
    vi: "Gần rồi!",
    ar: "تقريبا!",
    th: "เกือบแล้ว!"
  },
  credit: {
    en: "Credit",
    es: "Crédito",
    pt: "Crédito",
    vi: "Tín dụng",
    ar: "ائتمان",
    th: "เครดิต"
  },
  wheelRuletaGift: {
    en: "Wheel Gift of Credits",
    es: "Ruleta Gift de Créditos",
    pt: "Roleta Presente de Créditos",
    vi: "Vòng Quay Quà Tín dụng",
    ar: "عجلة هدايا الاعتمادات",
    th: "วงล้อของขวัญเครดิต"
  },
  openWheel: {
    en: "Open Wheel",
    es: "Abrir Ruleta",
    pt: "Abrir Roleta",
    vi: "Mở Vòng Quay",
    ar: "افتح العجلة",
    th: "เปิดวงล้อ"
  },
  sonicApi: {
    en: "Sonic Api",
    es: "Sonic Api",
    pt: "Sonic Api",
    vi: "Sonic Api",
    ar: "Sonic Api",
    th: "Sonic Api"
  },
  apiDescription: {
    en: "ApiSonic is created only to create and manage SonicMode branded mod menu keys to facilitate resellers.",
    es: "ApiSonic se creó solo para crear y administrar claves de menú de modificación de marca SonicMode para facilitar a los revendedores.",
    pt: "ApiSonic foi criado apenas para criar e gerenciar chaves de menu mod da marca SonicMode para facilitar revendedores.",
    vi: "ApiSonic được tạo ra chỉ để tạo và quản lý các khóa menu mod thương hiệu SonicMode để hỗ trợ người bán lại.",
    ar: "تم إنشاء ApiSonic فقط لإنشاء وإدارة مفاتيح قائمة التعديل ذات العلامة التجارية SonicMode لتسهيل الأمر على الموزعين.",
    th: "ApiSonic ถูกสร้างขึ้นเพื่อสร้างและจัดการคีย์เมนูม็อดแบรนด์ SonicMode เพื่ออำนวยความสะดวกให้กับผู้ค้าปลีก"
  },
  secureAccess: {
    en: "Secure Access",
    es: "Acceso Seguro",
    pt: "Acesso Seguro",
    vi: "Truy cập an toàn",
    ar: "وصول آمن",
    th: "การเข้าถึงที่ปลอดภัย"
  },
  secureAccessDescription: {
    en: "Authentication system with device verification and 2FA. Full control to manage and create keys yourself.",
    es: "Sistema de autenticación con verificación de dispositivos y 2FA. Control total para gestionar y crear las keys tú mismo.",
    pt: "Sistema de autenticação com verificação de dispositivo e 2FA. Controle total para gerenciar e criar chaves você mesmo.",
    vi: "Hệ thống xác thực với xác minh thiết bị và 2FA. Kiểm soát đầy đủ để quản lý và tạo khóa bằng chính bạn.",
    ar: "نظام مصادقة مع التحقق من الجهاز و 2FA. تحكم كامل لإدارة وإنشاء المفاتيح بنفسك.",
    th: "ระบบการรับรองความถูกต้องพร้อมการตรวจสอบอุปกรณ์และ 2FA ควบคุมเต็มรูปแบบเพื่อจัดการและสร้างคีย์ด้วยตัวเอง"
  },
  creditsSystem: {
    en: "Credits System",
    es: "Sistema de Créditos",
    pt: "Sistema de Créditos",
    vi: "Hệ thống tín dụng",
    ar: "نظام الاعتمادات",
    th: "ระบบเครดิต"
  },
  creditsSystemDescription: {
    en: "Manage credits per key with configurable limits. Weekly rewards and automatic recharge system.",
    es: "Gestiona créditos por clave con límites configurables. Recompensas semanales y sistema de recarga automática.",
    pt: "Gerencie créditos por chave com limites configuráveis. Recompensas semanais e sistema de recarga automática.",
    vi: "Quản lý tín dụng mỗi khóa với giới hạn có thể cấu hình. Phần thưởng hàng tuần và hệ thống nạp tiền tự động.",
    ar: "إدارة الاعتمادات لكل مفتاح مع حدود قابلة للتكوين. مكافآت أسبوعية ونظام إعادة شحن تلقائي.",
    th: "จัดการเครดิตต่อคีย์ด้วยขีดจำกัดที่กำหนดค่าได้ รางวัลรายสัปดาห์และระบบเติมเงินอัตโนมัติ"
  },
  getStarted: {
    en: "Get Started",
    es: "Comenzar",
    pt: "Começar",
    vi: "Bắt đầu",
    ar: "ابدأ",
    th: "เริ่มต้น"
  },
  signIn: {
    en: "Sign In",
    es: "Iniciar Sesión",
    pt: "Entrar",
    vi: "Đăng nhập",
    ar: "تسجيل الدخول",
    th: "ลงชื่อเข้าใช้"
  },
  installApp: {
    en: "Install App",
    es: "Instalar App",
    pt: "Instalar App",
    vi: "Cài đặt ứng dụng",
    ar: "تثبيت التطبيق",
    th: "ติดตั้งแอป"
  },
  madeBy: {
    en: "made by",
    es: "hecho por",
    pt: "feito por",
    vi: "được tạo bởi",
    ar: "صنع بواسطة",
    th: "สร้างโดย"
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
