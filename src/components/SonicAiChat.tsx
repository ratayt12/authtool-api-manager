import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Language = "en" | "es" | "pt" | "vi" | "th";

const translations = {
  en: {
    welcome: "Welcome, I'm your virtual assistant, my name is Sonic AI, and it's a pleasure to help you.",
    selectLanguage: "Select your language to chat:",
    enterKey: "Please send me the key and select the option you want:",
    banUdid: "Ban UDID",
    deviceInfo: "More device information",
    waitingAdmin: "Thank you! Your request has been sent. An administrator will respond shortly.",
    keyPlaceholder: "Enter your key...",
  },
  es: {
    welcome: "Bienvenido, soy tu asistente virtual, mi nombre es Sonic AI, y es un placer ayudarte.",
    selectLanguage: "Selecciona tu idioma para chatear:",
    enterKey: "Por favor envíame la clave y selecciona la opción que deseas:",
    banUdid: "Banear UDID",
    deviceInfo: "Más información del dispositivo",
    waitingAdmin: "¡Gracias! Tu solicitud ha sido enviada. Un administrador responderá pronto.",
    keyPlaceholder: "Ingresa tu clave...",
  },
  pt: {
    welcome: "Bem-vindo, sou seu assistente virtual, meu nome é Sonic AI, e é um prazer ajudá-lo.",
    selectLanguage: "Selecione seu idioma para conversar:",
    enterKey: "Por favor, envie-me a chave e selecione a opção que deseja:",
    banUdid: "Banir UDID",
    deviceInfo: "Mais informações do dispositivo",
    waitingAdmin: "Obrigado! Sua solicitação foi enviada. Um administrador responderá em breve.",
    keyPlaceholder: "Digite sua chave...",
  },
  vi: {
    welcome: "Chào mừng, tôi là trợ lý ảo của bạn, tên tôi là Sonic AI, và rất vui được giúp đỡ bạn.",
    selectLanguage: "Chọn ngôn ngữ của bạn để trò chuyện:",
    enterKey: "Vui lòng gửi cho tôi khóa và chọn tùy chọn bạn muốn:",
    banUdid: "Cấm UDID",
    deviceInfo: "Thêm thông tin thiết bị",
    waitingAdmin: "Cảm ơn! Yêu cầu của bạn đã được gửi. Quản trị viên sẽ trả lời sớm.",
    keyPlaceholder: "Nhập khóa của bạn...",
  },
  th: {
    welcome: "ยินดีต้อนรับ ฉันเป็นผู้ช่วยเสมือนของคุณ ชื่อของฉันคือ Sonic AI และยินดีที่จะช่วยเหลือคุณ",
    selectLanguage: "เลือกภาษาของคุณเพื่อแชท:",
    enterKey: "โปรดส่งคีย์ให้ฉันและเลือกตัวเลือกที่คุณต้องการ:",
    banUdid: "แบน UDID",
    deviceInfo: "ข้อมูลอุปกรณ์เพิ่มเติม",
    waitingAdmin: "ขอบคุณ! คำขอของคุณถูกส่งแล้ว ผู้ดูแลระบบจะตอบกลับในไม่ช้า",
    keyPlaceholder: "ใส่คีย์ของคุณ...",
  },
};

interface Message {
  id: string;
  message: string | null;
  image_url: string | null;
  video_url: string | null;
  sender_name: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

export const SonicAiChat = () => {
  const [step, setStep] = useState<"language" | "key" | "action" | "complete">("language");
  const [language, setLanguage] = useState<Language>("en");
  const [keyCode, setKeyCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const t = translations[language];

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel("private_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "private_messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("private_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data || []);
    
    // Check if conversation is complete
    const hasAdminResponse = data?.some(msg => msg.sender_name === "Admin" || msg.sender_name === "Sonic AI");
    if (hasAdminResponse && step === "complete") {
      // Stay in complete state if admin has responded
      return;
    }
  };

  const sendBotMessage = async (message: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("private_messages").insert({
      user_id: user.id,
      message,
      sender_name: "Sonic AI",
    });
  };

  const handleLanguageSelect = async (lang: Language) => {
    setLanguage(lang);
    setStep("key");
    await sendBotMessage(translations[lang].enterKey);
  };

  const handleKeySubmit = () => {
    if (!keyCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a key",
        variant: "destructive",
      });
      return;
    }
    setStep("action");
  };

  const handleActionSelect = async (action: "ban_udid" | "device_info") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const actionText = action === "ban_udid" ? t.banUdid : t.deviceInfo;

    // Create the request
    await supabase.from("user_requests").insert({
      user_id: user.id,
      username: user.email || "Unknown",
      request_type: action,
      key_code: keyCode,
      details: { language, action: actionText },
    });

    // Send confirmation message
    await sendBotMessage(t.waitingAdmin);
    setStep("complete");

    toast({
      title: "Success",
      description: "Your request has been sent to administrators",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-background border-border">
      <div className="bg-primary/10 p-4 flex items-center gap-3 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Sonic AI</h3>
          <p className="text-xs text-muted-foreground">Virtual Assistant</p>
        </div>
      </div>

      <ScrollArea className="h-[500px] p-4">
        <div className="space-y-4">
          {/* Welcome message */}
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
              <p className="text-sm text-foreground">{t.welcome}</p>
            </div>
          </div>

          {/* Language selection */}
          {step === "language" && (
            <>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
                  <p className="text-sm text-foreground">{t.selectLanguage}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-10">
                <Button onClick={() => handleLanguageSelect("en")} variant="outline">English</Button>
                <Button onClick={() => handleLanguageSelect("es")} variant="outline">Español</Button>
                <Button onClick={() => handleLanguageSelect("pt")} variant="outline">Português</Button>
                <Button onClick={() => handleLanguageSelect("vi")} variant="outline">Tiếng Việt</Button>
                <Button onClick={() => handleLanguageSelect("th")} variant="outline">ไทย</Button>
              </div>
            </>
          )}

          {/* Key input */}
          {step === "key" && (
            <div className="ml-10 space-y-2">
              <Input
                placeholder={t.keyPlaceholder}
                value={keyCode}
                onChange={(e) => setKeyCode(e.target.value)}
                className="bg-background"
              />
              <Button onClick={handleKeySubmit} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          )}

          {/* Action selection */}
          {step === "action" && (
            <div className="flex flex-col gap-2 ml-10">
              <Button onClick={() => handleActionSelect("ban_udid")} variant="outline">
                {t.banUdid}
              </Button>
              <Button onClick={() => handleActionSelect("device_info")} variant="outline">
                {t.deviceInfo}
              </Button>
            </div>
          )}

          {/* Admin responses */}
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
                {msg.message && <p className="text-sm text-foreground">{msg.message}</p>}
                {msg.image_url && (
                  <img src={msg.image_url} alt="Response" className="mt-2 rounded max-w-full" />
                )}
                {msg.video_url && (
                  <video src={msg.video_url} controls className="mt-2 rounded max-w-full" />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
