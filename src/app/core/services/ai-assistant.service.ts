import { Injectable, signal } from '@angular/core';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  quickActions?: { label: string; actionKey: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private messagesSignal = signal<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `Merhaba! Ben **Task Force AI Analiz Asistanı**.\n\nYüklenen müşteri verileri analiz edildi. Toplam **4 potansiyel fırsat** tespit edildi.\n\n• **En Yüksek Potansiyel:** Lisans Optimizasyonu (Tahmini Yıllık Tasarruf: **€35.000**)\n• **İkinci Fırsat:** SAP BTP Process Automation (Tahmini Yıllık Zaman Kazancı: **1.200 saat**, Business Value: **€40.000**)\n\nAşağıdaki hazır sorulardan birini seçebilir veya kendi sorunuzu iletebilirsiniz:`,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      quickActions: [
        { label: 'En yüksek değerli fırsat hangisi?', actionKey: 'highest_val' },
        { label: 'Hangi departmanda en fazla manuel işlem var?', actionKey: 'manual_dept' },
        { label: 'En yüksek lisans maliyeti hangi grupta?', actionKey: 'highest_cost_group' },
        { label: 'Quick Win fırsatları göster.', actionKey: 'quick_wins' }
      ]
    }
  ]);

  readonly messages = this.messagesSignal.asReadonly();

  askQuestion(question: string, actionKey?: string): void {
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: time
    };
    this.messagesSignal.update(list => [...list, userMsg]);

    // Generate AI response after brief delay simulation
    setTimeout(() => {
      let aiText = '';
      const key = actionKey || this.inferActionKey(question);

      switch (key) {
        case 'highest_val':
          aiText = `**En Yüksek Değerli Fırsat:**\n\n**"Süreç Optimizasyonu - Merkezi Tedarik & Depo Yönetimi"**\n- **Business Value:** €50.000 / Yıl\n- **Tahmini Tasarruf:** €45.000 / Yıl\n- **ROI:** %150\n- **Kategori:** Süreç Optimizasyon\n- **Uygulama Süresi:** 3 Ay (High Effort, High Value)`;
          break;

        case 'manual_dept':
          aiText = `**En Fazla Manuel İşlem Yapan Departman:**\n\n**Finance (FI/CO)** ve **Procurement (MM)** departmanları.\n- **Finance Manuel Çalışma:** Yıllık **1.200 saat** (Fatura eşleştirme & onaylar)\n- **Procurement Manuel Çalışma:** Yıllık **950 saat** (Sipariş doğrulama & tedarikçi yazışmaları)\n\n*Öneri:* SAP BTP Process Automation uygulaması ile bu departmanlarda **%85 otomasyon** sağlanabilir.`;
          break;

        case 'highest_cost_group':
          aiText = `**En Yüksek Lisans Maliyet Grubu:**\n\n**FI ve SD Modülü Professional Lisans Grubu**\n- Toplam 120 kullanıcının **15 tanesi** aylık <100 işlem yapıyor.\n- Bu grubun yıllık maliyeti **€75.000** civarındadır.\n- Professional -> Limited değişikliği ile yıllık **€35.000 net tasarruf** sağlanabilir.`;
          break;

        case 'quick_wins':
          aiText = `**Quick Win (Hızlı Kazanç) Fırsatları:**\n\n1. **Düşük Kullanımlı Professional Lisans Optimizasyonu**\n   - Düşük Efor, Yüksek Değer\n   - Tasarruf: **€35.000 / Yıl** | Güven Skoru: **%92**\n\n2. **AI Assistant & SAP Joule Akıllı Raporlama Entegrasyonu**\n   - Düşük Efor, Orta Değer\n   - Zaman Kazancı: **900 Saat / Yıl** | ROI: **%210**`;
          break;

        default:
          aiText = `Yüklenen **ABC Holding** SAP verilerine göre:\n\nSorunuzla ilgili veriler incelendi. Toplam **1.250 SAP kullanıcısı**, **€450.000 yıllık lisans maliyeti** ve **130 düşük kullanımlı lisans** tespit edilmiştir.\n\nDetaylı analiz için **Fırsatlar** ve **Business Case** sekmelerini kullanabilirsiniz.`;
          break;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: 'En yüksek değerli fırsat', actionKey: 'highest_val' },
          { label: 'Quick Wins', actionKey: 'quick_wins' }
        ]
      };

      this.messagesSignal.update(list => [...list, aiMsg]);
    }, 400);
  }

  private inferActionKey(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('yüksek değer') || lower.includes('en yüksek')) return 'highest_val';
    if (lower.includes('manuel') || lower.includes('departman')) return 'manual_dept';
    if (lower.includes('lisans maliyet') || lower.includes('maliyet')) return 'highest_cost_group';
    if (lower.includes('quick win') || lower.includes('hızlı kazanç')) return 'quick_wins';
    return 'general';
  }
}
