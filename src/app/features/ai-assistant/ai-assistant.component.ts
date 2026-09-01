import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiAssistantService } from '../../core/services/ai-assistant.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="ai-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="sparkles" [size]="24" color="#0284c7"></app-icon>
            BTC AI Copilot & Karar Destek Asistanı
          </h1>
          <p class="page-subtitle">Doğal Dilde Müşteri SAP Veri Sorgulama, Otomatik Analiz ve Karar Destek</p>
        </div>
      </div>

      <!-- Main Chat Area & Executive Insight Card Grid -->
      <div class="ai-grid">
        <!-- Executive Insight Card -->
        <div class="insight-summary-card">
          <div class="card-header">
            <div class="header-title">
              <app-icon name="sparkles" [size]="20" color="#38bdf8"></app-icon>
              <h3>BTC AI Insights (Otomatik Analiz Özeti)</h3>
            </div>
            <span class="live-badge">Canlı Analiz</span>
          </div>

          <div class="insight-content">
            <p>
              Yüklenen müşteri verileri başarıyla analiz edildi. Toplam <strong>5 potansiyel fırsat</strong> tespit edildi.
            </p>

            <div class="opportunity-highlight">
              <div class="highlight-item primary">
                <span class="badge">En Yüksek Potansiyel</span>
                <strong>License Optimization</strong>
                <p>Tahmini Yıllık Tasarruf: <strong>€35.000 / Yıl</strong></p>
              </div>

              <div class="highlight-item accent">
                <span class="badge">İkinci Fırsat</span>
                <strong>SAP BTP Process Automation</strong>
                <p>Tahmini Yıllık Zaman Kazancı: <strong>1.200 Saat / Yıl</strong> (€40.000 Value)</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Assistant Interface -->
        <div class="chat-container">
          <div class="chat-header">
            <div class="bot-info">
              <div class="bot-avatar"><app-icon name="sparkles" [size]="20" color="#0284c7"></app-icon></div>
              <div>
                <strong>BTC AI Copilot</strong>
                <span class="status-online">● Online • Context: ABC Holding</span>
              </div>
            </div>
          </div>

          <div class="chat-messages">
            @for (msg of aiService.messages(); track msg.id) {
              <div class="message-bubble" [class.user]="msg.sender === 'user'" [class.ai]="msg.sender === 'ai'">
                <div class="msg-meta">
                  <span class="sender-name">{{ msg.sender === 'user' ? 'Siz' : 'BTC AI Copilot' }}</span>
                  <span class="msg-time">{{ msg.timestamp }}</span>
                </div>
                
                <div class="msg-text" [innerHTML]="formatMarkdown(msg.text)"></div>

                <!-- Quick Action Buttons -->
                @if (msg.quickActions && msg.quickActions.length > 0) {
                  <div class="quick-actions-row">
                    @for (qa of msg.quickActions; track qa.actionKey) {
                      <button class="qa-btn" (click)="triggerQuickQuery(qa.label, qa.actionKey)">
                        {{ qa.label }}
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Input Bar -->
          <div class="chat-input-bar">
            <input 
              type="text" 
              placeholder="SAP verileri ve fırsatlar hakkında soru sorun..." 
              #chatInput 
              (keyup.enter)="sendUserMessage(chatInput.value); chatInput.value = ''"
              class="chat-input" />
            <button class="send-btn" (click)="sendUserMessage(chatInput.value); chatInput.value = ''">
              <app-icon name="arrow-right" [size]="16" color="#ffffff"></app-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-page {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      .page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
      .page-subtitle { margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #6b7280; }
    }

    .ai-grid {
      display: grid;
      grid-template-columns: 1fr 1.3fr;
      gap: 1.25rem;
    }

    .insight-summary-card {
      background: #111827;
      color: #ffffff;
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #1f2937;
        padding-bottom: 0.75rem;

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #f9fafb; }
        }

        .live-badge {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          padding: 0.15rem 0.5rem;
          border-radius: 10px;
          font-size: 0.68rem;
          font-weight: 700;
        }
      }

      .insight-content {
        font-size: 0.82rem;
        color: #d1d5db;
        line-height: 1.45;
        strong { color: #f9fafb; }
      }
    }

    .opportunity-highlight {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-top: 0.65rem;

      .highlight-item {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 0.65rem;

        .badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 0.25rem;
        }

        &.primary {
          border-left: 3px solid #10b981;
          .badge { background: rgba(16, 185, 129, 0.2); color: #34d399; }
        }

        &.accent {
          border-left: 3px solid #38bdf8;
          .badge { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        }

        strong { display: block; font-size: 0.85rem; color: #fff; }
        p { margin: 0.15rem 0 0 0; font-size: 0.75rem; color: #9ca3af; }
      }
    }

    .chat-container {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      height: 540px;
      overflow: hidden;
    }

    .chat-header {
      padding: 0.75rem 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;

      .bot-info {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        strong { font-size: 0.85rem; color: #111827; }
        .status-online { display: block; font-size: 0.68rem; color: #047857; }
      }
    }

    .chat-messages {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .message-bubble {
      max-width: 85%;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      line-height: 1.45;

      .msg-meta {
        display: flex;
        justify-content: space-between;
        gap: 0.8rem;
        font-size: 0.65rem;
        margin-bottom: 0.25rem;
        .sender-name { font-weight: 700; }
        .msg-time { opacity: 0.7; }
      }

      &.user {
        align-self: flex-end;
        background: #0284c7;
        color: #ffffff;
        border-bottom-right-radius: 2px;
        .msg-meta { color: rgba(255,255,255,0.8); }
      }

      &.ai {
        align-self: flex-start;
        background: #f3f4f6;
        color: #111827;
        border-bottom-left-radius: 2px;
        .msg-meta { color: #6b7280; }
      }
    }

    .quick-actions-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.65rem;

      .qa-btn {
        background: #ffffff;
        border: 1px solid #d1d5db;
        padding: 0.25rem 0.55rem;
        border-radius: 10px;
        font-size: 0.72rem;
        font-weight: 600;
        color: #0284c7;
        cursor: pointer;

        &:hover { background: #0284c7; color: #ffffff; border-color: #0284c7; }
      }
    }

    .chat-input-bar {
      padding: 0.75rem 1rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      display: flex;
      gap: 0.5rem;

      .chat-input {
        flex: 1;
        padding: 0.4rem 0.75rem;
        border-radius: 6px;
        border: 1px solid #d1d5db;
        font-size: 0.8rem;
        outline: none;
      }

      .send-btn {
        background: #0284c7;
        color: #fff;
        border: none;
        width: 34px;
        height: 34px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
    }
  `]
})
export class AiAssistantComponent {
  aiService = inject(AiAssistantService);

  sendUserMessage(text: string): void {
    if (!text) return;
    this.aiService.askQuestion(text);
  }

  triggerQuickQuery(label: string, actionKey: string): void {
    this.aiService.askQuestion(label, actionKey);
  }

  formatMarkdown(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  }
}
