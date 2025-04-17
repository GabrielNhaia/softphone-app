<template>
  <div class="phone-interface">
    <!-- Status e display -->
    <div class="phone-status">
      <div class="status-indicator" :class="{ active: isRegistered }"></div>
      <span class="status-text">{{ isRegistered ? 'Registrado' : 'Não registrado' }}</span>
    </div>
    
    <!-- Exibição do número ou chamada atual -->
    <div class="phone-display">
      <div v-if="currentCall" class="call-info">
        <div class="caller-id">{{ currentCall.getRemoteIdentity().uri.user }}</div>
        <div class="call-status">{{ callStatus }}</div>
        <div v-if="callTimer" class="call-duration">{{ formattedDuration }}</div>
      </div>
      <div v-else class="number-input">
        <input 
          type="text" 
          v-model="phoneNumber" 
          placeholder="Digite o número..."
          @keydown.enter="makeCall"
          class="phone-number-input"
        />
      </div>
    </div>
    
    <!-- Teclado numérico estilizado -->
    <div class="phone-keypad">
      <div class="keypad-row">
        <button @click="addDigit('1')" class="keypad-btn">1</button>
        <button @click="addDigit('2')" class="keypad-btn">2</button>
        <button @click="addDigit('3')" class="keypad-btn">3</button>
      </div>
      <div class="keypad-row">
        <button @click="addDigit('4')" class="keypad-btn">4</button>
        <button @click="addDigit('5')" class="keypad-btn">5</button>
        <button @click="addDigit('6')" class="keypad-btn">6</button>
      </div>
      <div class="keypad-row">
        <button @click="addDigit('7')" class="keypad-btn">7</button>
        <button @click="addDigit('8')" class="keypad-btn">8</button>
        <button @click="addDigit('9')" class="keypad-btn">9</button>
      </div>
      <div class="keypad-row">
        <button @click="addDigit('*')" class="keypad-btn">*</button>
        <button @click="addDigit('0')" class="keypad-btn">0</button>
        <button @click="addDigit('#')" class="keypad-btn">#</button>
      </div>
    </div>
    
    <!-- Ações de chamada -->
    <div class="phone-actions">
      <template v-if="!currentCall">
        <button @click="makeCall" class="action-btn call-btn">
          <i class="fas fa-phone"></i>
        </button>
      </template>
      <template v-else>
        <button @click="answerCall" v-if="isIncomingCall" class="action-btn answer-btn">
          <i class="fas fa-phone"></i>
        </button>
        <button @click="hangupCall" class="action-btn hangup-btn">
          <i class="fas fa-phone-slash"></i>
        </button>
        <button @click="toggleMute" class="action-btn" :class="{ 'muted': isMuted }">
          <i class="fas" :class="isMuted ? 'fa-microphone-slash' : 'fa-microphone'"></i>
        </button>
        <button @click="showTransferDialog = true" class="action-btn transfer-btn">
          <i class="fas fa-exchange-alt"></i>
        </button>
      </template>
    </div>
    
    <!-- Diálogo de transferência -->
    <div v-if="showTransferDialog" class="transfer-dialog">
      <div class="transfer-content">
        <h4>Transferir chamada</h4>
        <input 
          type="text" 
          v-model="transferTarget" 
          placeholder="Número para transferência"
          class="transfer-input"
        />
        <div class="transfer-buttons">
          <button @click="transferCall" class="transfer-btn">Transferir</button>
          <button @click="showTransferDialog = false" class="cancel-btn">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// ...existing code...
</script>

<style scoped>
.phone-interface {
  background-color: #f8f9fa;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 360px;
  margin: 0 auto;
  padding: 20px;
}

.phone-status {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #dc3545;
  margin-right: 8px;
  transition: background-color 0.3s;
}

.status-indicator.active {
  background-color: #28a745;
}

.status-text {
  font-size: 14px;
  color: #6c757d;
}

.phone-display {
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
}

.phone-number-input {
  width: 100%;
  border: none;
  font-size: 24px;
  text-align: center;
  outline: none;
}

.call-info {
  text-align: center;
  width: 100%;
}

.caller-id {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 5px;
}

.call-status {
  font-size: 14px;
  color: #6c757d;
}

.call-duration {
  font-size: 16px;
  font-weight: bold;
  color: #28a745;
  margin-top: 5px;
}

.phone-keypad {
  margin-bottom: 20px;
}

.keypad-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.keypad-btn {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  border: none;
  background-color: #e9ecef;
  color: #212529;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.keypad-btn:hover {
  background-color: #dee2e6;
}

.keypad-btn:active {
  transform: scale(0.95);
  background-color: #ced4da;
}

.phone-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.action-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.call-btn {
  background-color: #28a745;
  color: white;
}

.answer-btn {
  background-color: #28a745;
  color: white;
}

.hangup-btn {
  background-color: #dc3545;
  color: white;
}

.transfer-btn {
  background-color: #007bff;
  color: white;
}

.action-btn.muted {
  background-color: #ffc107;
  color: #212529;
}

.action-btn:hover {
  transform: scale(1.05);
}

.action-btn:active {
  transform: scale(0.95);
}

.transfer-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
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

.transfer-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  margin: 15px 0;
  font-size: 16px;
}

.transfer-buttons {
  display: flex;
  justify-content: space-between;
}

.transfer-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
}
</style>