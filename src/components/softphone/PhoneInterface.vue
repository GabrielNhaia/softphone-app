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
        <div class="phone-display mb-3">
          <input 
            type="text" 
            class="form-control form-control-lg text-center" 
            v-model="phoneNumber" 
            placeholder="Digite o número..."
            @keyup.enter="makeCall"
          >
        </div>
        
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
                @click="openTransferModal"
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
        
        <audio ref="remoteAudio" autoplay></audio>
      </div>
    </div>

    <div class="modal fade" :class="{'show': showTransferModal}" v-if="showTransferModal" tabindex="-1" role="dialog" aria-labelledby="transferModalLabel" :style="{'display': showTransferModal ? 'block' : 'none'}" aria-modal="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="transferModalLabel">Transferir Chamada</h5>
            <button type="button" class="btn-close" @click="closeTransferModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="transferNumber">Número para transferência:</label>
              <input type="text" class="form-control" id="transferNumber" v-model="transferNumber" placeholder="Digite o número..." @keyup.enter="confirmTransfer">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeTransferModal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="confirmTransfer">Transferir</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-backdrop fade show" v-if="showTransferModal"></div>
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
      ],
      showTransferModal: false,
      transferNumber: ''
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
      window.addEventListener('remoteStreamAvailable', this.handleRemoteStream);
    }
  },
  beforeUnmount() {
    window.removeEventListener('remoteStreamAvailable', this.handleRemoteStream);
  },
  methods: {
    registerSipEvents() {
      this.sipService.on('incomingCall', (data) => {
        this.incomingCall = true;
        this.caller = data.remoteNumber || 'Desconhecido';
      });

      this.sipService.on('callStatus', (status) => {
        if (status.code === 'confirmed' || status === 'confirmed') {
          this.callActive = true;
          this.incomingCall = false;
        } else if (status.code === 'ended' || status === 'ended') {
          this.callActive = false;
          this.incomingCall = false;
          this.isMuted = false;
        }
      });

      this.sipService.on('ended', () => {
        this.callActive = false;
        this.incomingCall = false;
        this.isMuted = false;
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
      if (this.callActive) {
        this.sipService.toggleMute(!this.isMuted);
        this.isMuted = !this.isMuted;
      }
    },
    
    openTransferModal() {
      if (this.callActive) {
        this.showTransferModal = true;
        this.transferNumber = '';

        document.addEventListener('keydown', this.handleEscKey);
        
        setTimeout(() => {
          document.getElementById('transferNumber')?.focus();
        }, 100);
      }
    },
    
    closeTransferModal() {
      this.showTransferModal = false;
      this.transferNumber = '';
      document.removeEventListener('keydown', this.handleEscKey);
    },
    
    handleEscKey(event) {
      if (event.key === 'Escape' && this.showTransferModal) {
        this.closeTransferModal();
      }
    },
    
    confirmTransfer() {
      if (this.transferNumber) {
        this.transferCall(this.transferNumber);
        this.closeTransferModal();
      }
    },
    
    showTransferDialog() {
      this.openTransferModal();
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

.modal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: 0;
}

.modal-dialog {
  position: relative;
  width: auto;
  margin: 1.75rem auto;
  max-width: 500px;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #fff;
  border-radius: .3rem;
  box-shadow: 0 0.25rem 0.5rem rgba(0,0,0,.5);
  outline: 0;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  border-top-left-radius: calc(.3rem - 1px);
  border-top-right-radius: calc(.3rem - 1px);
}

.modal-body {
  position: relative;
  flex: 1 1 auto;
  padding: 1rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.75rem;
  border-top: 1px solid #dee2e6;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  opacity: 0.5;
}

.btn-close {
  background: transparent;
  border: 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  color: #000;
  opacity: 0.5;
  cursor: pointer;
  padding: 0;
}

.btn-close:hover {
  opacity: 1;
}

/* Animação para a modal */
.modal.fade .modal-dialog {
  transition: transform .3s ease-out;
}

.modal.show .modal-dialog {
  transform: none;
}

/* Ajuste para smartphones */
@media (max-width: 576px) {
  .modal-dialog {
    margin: 0.5rem;
    max-width: calc(100% - 1rem);
  }
}
</style>