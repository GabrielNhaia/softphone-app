<template>
  <div class="softphone">
    <div class="phone-container">
      <div class="status-bar">
        <span class="status-indicator" :class="{ connected: isRegistered }"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
      
      <div class="phone-display">
        <div v-if="inCall" class="call-info">
          <div class="caller-id">{{ remoteNumber }}</div>
          <div class="call-status">{{ callStatus }}</div>
          <div v-if="callDuration" class="call-timer">{{ formattedDuration }}</div>
        </div>
        <div v-else class="number-display">
          <input 
            type="text" 
            v-model="phoneNumber" 
            placeholder="Digite o número" 
            class="phone-input"
            @keyup.enter="makeCall"
          />
        </div>
      </div>
      
      <PhoneKeypad @digit="addDigit" />
      
      <div class="phone-actions">
        <button 
          v-if="!inCall" 
          @click="makeCall" 
          class="action-btn call-btn" 
          :disabled="!isRegistered || !phoneNumber">
          <i class="fas fa-phone"></i>
        </button>
        
        <template v-else>
          <button v-if="isIncoming && !callAccepted" @click="answerCall" class="action-btn answer-btn">
            <i class="fas fa-phone"></i>
          </button>
          
          <button @click="hangupCall" class="action-btn hangup-btn">
            <i class="fas fa-phone-slash"></i>
          </button>
          
          <button @click="toggleMute" class="action-btn" :class="{ 'mute-btn': !isMuted, 'unmute-btn': isMuted }">
            <i :class="isMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone'"></i>
          </button>
          
          <button @click="openTransferDialog" class="action-btn transfer-btn">
            <i class="fas fa-random"></i>
          </button>
        </template>
      </div>
    </div>
    
    <!-- Dialog de transferência -->
    <div v-if="showTransferDialog" class="transfer-dialog">
      <div class="transfer-content">
        <h3>Transferir Chamada</h3>
        <input 
          type="text" 
          v-model="transferTo" 
          placeholder="Número para transferência" 
          class="transfer-input"
        />
        <div class="transfer-actions">
          <button @click="transferCall" class="transfer-action-btn">Transferir</button>
          <button @click="showTransferDialog = false" class="cancel-action-btn">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PhoneKeypad from './PhoneKeypad.vue';

export default {
  name: 'SoftPhone',
  components: {
    PhoneKeypad
  },
  props: {
    sipService: {
      type: Object,
      required: true
    },
    isRegistered: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      phoneNumber: '',
      inCall: false,
      isIncoming: false,
      callAccepted: false,
      callStatus: '',
      remoteNumber: '',
      callDuration: 0,
      callTimer: null,
      callStartTime: null,
      isMuted: false,
      showTransferDialog: false,
      transferTo: '',
      currentSession: null
    };
  },
  computed: {
    statusText() {
      if (this.isRegistered) {
        return 'Conectado';
      }
      return 'Desconectado';
    },
    formattedDuration() {
      const minutes = Math.floor(this.callDuration / 60);
      const seconds = this.callDuration % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  },
  mounted() {
    // Registrar handlers de eventos SIP
    this.sipService.on('incomingCall', this.handleIncomingCall);
    this.sipService.on('callStatus', this.handleCallStatus);
    this.sipService.on('ended', this.resetCallState);
  },
  beforeUnmount() {
    // Remover handlers de eventos
    this.sipService.off('incomingCall', this.handleIncomingCall);
    this.sipService.off('callStatus', this.handleCallStatus);
    this.sipService.off('ended', this.resetCallState);
    this.stopCallTimer();
  },
  methods: {
    addDigit(digit) {
      this.phoneNumber += digit;
      
      // Se estiver em uma chamada ativa, enviar DTMF
      if (this.inCall && this.callAccepted && this.currentSession) {
        this.sipService.sendDTMF(digit);
      }
    },
    
    makeCall() {
      if (!this.isRegistered || !this.phoneNumber || this.inCall) return;
      
      this.inCall = true;
      this.isIncoming = false;
      this.callAccepted = false;
      this.callStatus = 'Chamando...';
      this.remoteNumber = this.phoneNumber;
      
      this.currentSession = this.sipService.call(this.phoneNumber);
    },
    
    answerCall() {
      if (!this.inCall || !this.isIncoming || this.callAccepted) return;
      
      this.sipService.answer();
      this.callStatus = 'Chamada em andamento';
      this.callAccepted = true;
      this.startCallTimer();
    },
    
    hangupCall() {
      if (!this.inCall) return;
      
      this.sipService.hangup();
      this.resetCallState();
    },
    
    toggleMute() {
      if (!this.inCall || !this.callAccepted) return;
      
      this.isMuted = !this.isMuted;
      this.sipService.toggleMute(this.isMuted);
    },
    
    openTransferDialog() {
      if (!this.inCall || !this.callAccepted) return;
      
      this.showTransferDialog = true;
      this.transferTo = '';
    },
    
    transferCall() {
      if (!this.transferTo || !this.inCall || !this.callAccepted) {
        this.showTransferDialog = false;
        return;
      }
      
      this.sipService.transfer(this.transferTo);
      this.callStatus = 'Transferindo...';
      this.showTransferDialog = false;
    },
    
    handleIncomingCall(data) {
      this.inCall = true;
      this.isIncoming = true;
      this.callAccepted = false;
      this.callStatus = 'Chamada recebida';
      this.remoteNumber = data.remoteNumber || 'Desconhecido';
      this.currentSession = data.session;
    },
    
    handleCallStatus(status) {
      this.callStatus = status.description || status;
      
      if (status === 'confirmed' || status.code === 'confirmed') {
        this.callAccepted = true;
        this.startCallTimer();
      }
    },
    
    startCallTimer() {
      this.callStartTime = new Date();
      this.callTimer = setInterval(() => {
        const now = new Date();
        this.callDuration = Math.floor((now - this.callStartTime) / 1000);
      }, 1000);
    },
    
    stopCallTimer() {
      if (this.callTimer) {
        clearInterval(this.callTimer);
        this.callTimer = null;
      }
    },
    
    resetCallState() {
      this.inCall = false;
      this.isIncoming = false;
      this.callAccepted = false;
      this.callStatus = '';
      this.stopCallTimer();
      this.callDuration = 0;
      this.isMuted = false;
      this.currentSession = null;
    }
  }
}
</script>

<style scoped>
.softphone {
  font-family: Arial, sans-serif;
  position: relative;
}

.phone-container {
  width: 100%;
  max-width: 350px;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  padding: 20px;
  background-color: #f9f9f9;
}

.status-bar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: #ff3b30;
}

.status-indicator.connected {
  background-color: #34c759;
}

.status-text {
  font-size: 14px;
  color: #555;
}

.phone-display {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.phone-input {
  width: 100%;
  border: none;
  font-size: 22px;
  text-align: center;
  outline: none;
}

.call-info {
  text-align: center;
}

.caller-id {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}

.call-status {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.call-timer {
  font-size: 16px;
  font-weight: bold;
  color: #007aff;
}

.phone-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.action-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.call-btn {
  background-color: #34c759;
}

.answer-btn {
  background-color: #34c759;
}

.hangup-btn {
  background-color: #ff3b30;
}

.mute-btn {
  background-color: #5856d6;
}

.unmute-btn {
  background-color: #ff9500;
}

.transfer-btn {
  background-color: #007aff;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.transfer-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.transfer-content {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  width: 300px;
  max-width: 90%;
}

.transfer-content h3 {
  margin-top: 0;
  text-align: center;
  margin-bottom: 15px;
}

.transfer-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  margin-bottom: 15px;
}

.transfer-actions {
  display: flex;
  justify-content: space-between;
}

.transfer-action-btn, .cancel-action-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.transfer-action-btn {
  background-color: #007aff;
  color: white;
}

.cancel-action-btn {
  background-color: #eee;
  color: #333;
}
</style>