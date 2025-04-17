<template>
  <div class="settings-container">
    <h2>Configurações SIP</h2>
    <form @submit.prevent="saveSettings">
      <div class="form-group">
        <label for="displayName">Nome de Exibição</label>
        <input 
          type="text" 
          id="displayName" 
          v-model="config.displayName" 
          placeholder="Seu nome"
        />
      </div>
      
      <div class="form-group">
        <label for="username">Usuário SIP</label>
        <input 
          type="text" 
          id="username" 
          v-model="config.username" 
          placeholder="usuário"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="password">Senha</label>
        <input 
          type="password" 
          id="password" 
          v-model="config.password" 
          placeholder="senha"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="domain">Domínio SIP</label>
        <input 
          type="text" 
          id="domain" 
          v-model="config.domain" 
          placeholder="sip.example.com"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="websocket">WebSocket SIP</label>
        <input 
          type="text" 
          id="websocket" 
          v-model="config.websocket" 
          placeholder="wss://sip.example.com:8089/ws"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="stunServer">Servidor STUN</label>
        <input 
          type="text" 
          id="stunServer" 
          v-model="config.stunServer" 
          placeholder="stun:stun.l.google.com:19302"
        />
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="config.autoConnect" />
          Conectar automaticamente ao iniciar
        </label>
      </div>
      
      <div class="form-actions">
        <button type="button" class="cancel-btn" @click="cancel">Cancelar</button>
        <button type="submit" class="save-btn">Salvar</button>
      </div>
    </form>
    
    <div class="server-status" v-if="testingConnection">
      <div class="spinner"></div>
      <span>Testando conexão...</span>
    </div>
    
    <div :class="['alert', statusClass]" v-if="statusMessage">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import JsSIP from 'jssip';

export default {
  name: 'SipSettings',
  props: {
    initialConfig: {
      type: Object,
      default: () => ({
        displayName: '',
        username: '',
        password: '',
        domain: '',
        websocket: '',
        stunServer: 'stun:stun.l.google.com:19302',
        autoConnect: true,
        valid: false
      })
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const config = reactive({ ...props.initialConfig });
    const testingConnection = ref(false);
    const statusMessage = ref('');
    const statusType = ref('');
    
    const statusClass = computed(() => {
      return statusType.value ? `alert-${statusType.value}` : '';
    });
    
    const validateSettings = () => {
      if (!config.username || !config.password || !config.domain || !config.websocket) {
        statusMessage.value = 'Por favor, preencha todos os campos obrigatórios.';
        statusType.value = 'error';
        return false;
      }
      
      // Validar formato do websocket
      if (!config.websocket.startsWith('wss://') && !config.websocket.startsWith('ws://')) {
        statusMessage.value = 'O WebSocket deve começar com wss:// ou ws://';
        statusType.value = 'error';
        return false;
      }
      
      return true;
    };
    
    const testConnection = async () => {
      if (!validateSettings()) return false;
      
      testingConnection.value = true;
      statusMessage.value = 'Testando conexão...';
      statusType.value = 'info';
      
      return new Promise((resolve) => {
        try {
          // Configurar JsSIP para teste
          const socket = new JsSIP.WebSocketInterface(config.websocket);
          const testUA = new JsSIP.UA({
            sockets: [socket],
            uri: `sip:${config.username}@${config.domain}`,
            password: config.password,
            register: false
          });
          
          // Temporizador para timeout
          const timeout = setTimeout(() => {
            statusMessage.value = 'Tempo esgotado ao tentar conectar.';
            statusType.value = 'error';
            testingConnection.value = false;
            testUA.stop();
            resolve(false);
          }, 10000);
          
          // Evento de conexão bem-sucedida
          testUA.on('connected', () => {
            clearTimeout(timeout);
            statusMessage.value = 'Conexão estabelecida com sucesso!';
            statusType.value = 'success';
            testingConnection.value = false;
            testUA.stop();
            resolve(true);
          });
          
          // Eventos de erro
          testUA.on('disconnected', () => {
            clearTimeout(timeout);
            statusMessage.value = 'Não foi possível estabelecer conexão.';
            statusType.value = 'error';
            testingConnection.value = false;
            resolve(false);
          });
          
          testUA.on('transportError', () => {
            clearTimeout(timeout);
            statusMessage.value = 'Erro de transporte ao tentar conectar.';
            statusType.value = 'error';
            testingConnection.value = false;
            resolve(false);
          });
          
          // Iniciar o teste
          testUA.start();
          
        } catch (e) {
          console.error('Erro ao testar conexão:', e);
          statusMessage.value = `Erro: ${e.message}`;
          statusType.value = 'error';
          testingConnection.value = false;
          resolve(false);
        }
      });
    };
    
    const saveSettings = async () => {
      if (!validateSettings()) return;
      
      const connectionSuccess = await testConnection();
      
      if (connectionSuccess) {
        // Marcar a configuração como válida e emitir evento de salvar
        config.valid = true;
        emit('save', { ...config });
      }
    };
    
    const cancel = () => {
      emit('cancel');
    };
    
    // Carregar configurações do localStorage ao montar o componente
    onMounted(() => {
      const savedConfig = localStorage.getItem('sipConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          Object.assign(config, parsedConfig);
        } catch (e) {
          console.error('Erro ao carregar configurações:', e);
        }
      }
    });
    
    return {
      config,
      testingConnection,
      statusMessage,
      statusClass,
      saveSettings,
      cancel
    };
  }
}
</script>

<style scoped>
.settings-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

input[type="text"]:focus,
input[type="password"]:focus {
  border-color: #007aff;
  outline: none;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-btn {
  background-color: #007aff;
  color: white;
}

.save-btn:hover {
  background-color: #0055b3;
}

.cancel-btn {
  background-color: #f1f1f1;
  color: #333;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.server-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007aff;
  border-radius: 50%;
  margin-right: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.alert {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.alert-success {
  background-color: #e4f8e1;
  color: #0d7d10;
}

.alert-error {
  background-color: #fde1e1;
  color: #d32f2f;
}

.alert-info {
  background-color: #e1f5fe;
  color: #0277bd;
}
</style>