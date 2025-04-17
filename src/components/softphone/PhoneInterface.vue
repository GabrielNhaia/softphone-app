// src/components/softphone/PhoneInterface.vue
<template>
  <div class="phone-interface">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h4>Softphone</h4>
        <div class="status-indicator">
          <span class="badge" :class="statusClass">{{ connectionStatus }}</span>
        </div>
      </div>
      
      <div class="card-body">
        <!-- Display número -->
        <div class="phone-display mb-3">
          <input 
            type="text" 
            class="form-control form-control-lg text-center" 
            v-model="phoneNumber" 
            placeholder="Digite o número..."
            @keyup.enter="makeCall"
          >
        </div>
        
        <!-- Teclado numérico -->
        <div class="dialpad mb-4">
          <div class="row g-2 mb-2" v-for="row in dialpadRows" :key="row.join('')">
            <div class="col" v-for="digit in row" :key="digit">
              <button 
                class="btn btn-outline-secondary w-100" 
                @click="addDigit(digit)"
              >
                {{ digit }}
              </button>
            </div>
          </div>
          
          <div class="row g-2">
            <div class="col">
              <button class="btn btn-outline-secondary w-100" @click="addDigit('*')">*</button>
            </div>
            <div class="col">
              <button class="btn btn-outline-secondary w-100" @click="addDigit('0')">0</button>
            </div>
            <div class="col">
              <button class="btn btn-outline-secondary w-100" @click="addDigit('#')">#</button>
            </div>
          </div>
        </div>
        
        <!-- Controles de chamada -->
        <div class="call-controls">
          <div class="row g-3">
            <div class="col">
              <button 
                class="btn btn-success w-100" 
                @click="makeCall" 
                :disabled="!isRegistered || callActive || !phoneNumber"
              >
                <i class="fas fa-phone"></i> Ligar
              </button>
            </div>
            <div class="col">
              <button 
                class="btn btn-danger w-100" 
                @click="hangupCall" 
                :disabled="!callActive"
              >
                <i class="fas fa-phone-slash"></i> Desligar
              </button>
            </div>
          </div>
          
          <div class="row mt-3" v-if="incomingCall">
            <div class="col">
              <button class="btn btn-success w-100" @click="answerCall">
                <i class="fas fa-phone"></i> Atender
              </button>
            </div>
            <div class="col">
              <button class="btn btn-danger w-100" @click="rejectCall">
                <i class="fas fa-times"></i> Rejeitar
              </button>
            </div>
          </div>
          
          <div class="row mt-3" v-if="callActive">
            <div class="col">
              <button 
                class="btn btn-warning w-100" 
                @click="showTransferDialog"
              >
                <i class="fas fa-exchange-alt"></i> Transferir
              </button>
            </div>
            <div class="col">
              <button 
                class="btn btn-info w-100" 
                @click="toggleMute"
              >
                <i class="fas" :class="isMuted ? 'fa-microphone-slash' : 'fa-microphone'"></i>
                {{ isMuted ? 'Unmute' : 'Mute' }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Áudio elementos -->
        <audio ref="remoteAudio" autoplay></audio>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhoneInterface',
  props: {
    sipService: Object,
    isRegistered: Boolean
  },
  data() {
    return {
      phoneNumber: '',
      callActive: false,
      incomingCall: false,
      caller: '',
      isMuted: false,
      dialpadRows: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]
    };
  },
  computed: {
    connectionStatus() {
      if (this.isRegistered) {
        return this.callActive ? 'Em Chamada' : 'Conectado';
      }
      return 'Desconectado';
    },
    statusClass() {
      if (this.isRegistered) {
        return this.callActive ? 'bg-danger' : 'bg-success';
      }
      return 'bg-secondary';
    }
  },
  mounted() {
    if (this.sipService) {
      this.registerSipEvents();
      
      // Configurar listener para stream remoto
      window.addEventListener('remoteStreamAvailable', this.handleRemoteStream);
    }
  },
  beforeUnmount() {
    window.removeEventListener('remoteStreamAvailable', this.handleRemoteStream);
  },
  methods: {
    registerSipEvents() {
      this.sipService.registerEventHandlers({
        onCallReceived: (session) => {
          this.incomingCall = true;
          this.caller = session.remote_identity.uri.user;
        },
        onCallEnded: () => {
          this.callActive = false;
          this.incomingCall = false;
          this.isMuted = false;
        },
        onCallEstablished: () => {
          this.callActive = true;
          this.incomingCall = false;
        }
      });
    },
    
    handleRemoteStream(event) {
      const stream = event.detail;
      if (this.$refs.remoteAudio) {
        this.$refs.remoteAudio.srcObject = stream;
      }
    },
    
    addDigit(digit) {
      this.phoneNumber += digit;
    },
    
    makeCall() {
      if (!this.phoneNumber || !this.isRegistered) return;
      
      try {
        this.sipService.call(this.phoneNumber);
      } catch (error) {
        console.error('Erro ao realizar chamada:', error);
      }
    },
    
    answerCall() {
      if (this.incomingCall) {
        this.sipService.answer();
      }
    },
    
    rejectCall() {
      if (this.incomingCall) {
        this.sipService.hangup();
        this.incomingCall = false;
      }
    },
    
    hangupCall() {
      if (this.callActive) {
        this.sipService.hangup();
      }
    },
    
    toggleMute() {
      if (this.callActive && this.sipService.session) {
        const session = this.sipService.session;
        
        if (this.isMuted) {
          session.unmute();
        } else {
          session.mute();
        }
        
        this.isMuted = !this.isMuted;
      }
    },
    
    showTransferDialog() {
      const transferNumber = prompt('Digite o número para transferência:');
      if (transferNumber) {
        this.transferCall(transferNumber);
      }
    },
    
    transferCall(destination) {
      if (this.callActive && destination) {
        this.sipService.transfer(destination);
      }
    }
  }
}
</script>

<style scoped>
.phone-interface {
  max-width: 400px;
  margin: 0 auto;
}

.dialpad button {
  height: 50px;
  font-size: 1.2rem;
}

.call-controls button {
  font-size: 1rem;
}

.phone-display input {
  font-size: 1.5rem;
  letter-spacing: 1px;
}
</style>