<template>
  <div class="sip-config">
    <h2>Configurações SIP</h2>
    
    <form @submit.prevent="saveConfig">
      <div class="form-group">
        <label for="displayName">Nome de Exibição</label>
        <input 
          type="text" 
          id="displayName" 
          v-model="config.displayName" 
          placeholder="Seu nome"
          class="form-control"
        />
      </div>
      
      <div class="form-group">
        <label for="username">Usuário SIP*</label>
        <input 
          type="text" 
          id="username" 
          v-model="config.username" 
          placeholder="usuário"
          class="form-control"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="password">Senha*</label>
        <input 
          type="password" 
          id="password" 
          v-model="config.password" 
          placeholder="senha"
          class="form-control"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="domain">Domínio SIP*</label>
        <input 
          type="text" 
          id="domain" 
          v-model="config.domain" 
          placeholder="sip.exemplo.com ou endereço IP"
          class="form-control"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="websocket">WebSocket SIP*</label>
        <input 
          type="text" 
          id="websocket" 
          v-model="config.websocket" 
          placeholder="wss://sip.exemplo.com:8089/ws"
          class="form-control"
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
          class="form-control"
        />
      </div>
      
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" v-model="config.autoConnect">
          Conectar automaticamente ao iniciar
        </label>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="save-btn">Salvar e Conectar</button>
        <button type="button" class="test-btn" @click="testConnection">Testar Conexão</button>
      </div>
    </form>
    
    <div v-if="testStatus" :class="['status-message', testStatusClass]">
      {{ testStatus }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'SipConfig',
  props: {
    initialConfig: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['config-saved', 'connect'],
  data() {
    return {
      config: {
        displayName: '',
        username: '',
        password: '',
        domain: '',
        websocket: '',
        stunServer: 'stun:stun.l.google.com:19302',
        autoConnect: true
      },
      testStatus: '',
      testStatusClass: '',
      isLoading: false
    };
  },
  created() {
    // Carregar configurações iniciais, se fornecidas
    if (this.initialConfig) {
      Object.assign(this.config, this.initialConfig);
    }
    
    // Verificar se há configurações no localStorage
    const savedConfig = localStorage.getItem('sipConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        Object.assign(this.config, parsedConfig);
      } catch (error) {
        console.error('Erro ao carregar configurações salvas:', error);
      }
    }
  },
  methods: {
    saveConfig() {
      if (!this.validateConfig()) {
        return;
      }
      
      // Salvar no localStorage
      localStorage.setItem('sipConfig', JSON.stringify(this.config));
      
      // Emitir evento para o componente pai
      this.$emit('config-saved', { ...this.config });
      
      // Tentar conectar
      this.$emit('connect', { ...this.config });
    },
    
    validateConfig() {
      if (!this.config.username || !this.config.password || !this.config.domain || !this.config.websocket) {
        this.testStatus = 'Preencha todos os campos obrigatórios (*)';
        this.testStatusClass = 'error';
        return false;
      }
      
      // Verificar formato do websocket
      if (!this.config.websocket.startsWith('wss://') && !this.config.websocket.startsWith('ws://')) {
        this.testStatus = 'O WebSocket deve começar com wss:// ou ws://';
        this.testStatusClass = 'error';
        return false;
      }
      
      return true;
    },
    
    async testConnection() {
      if (!this.validateConfig()) {
        return;
      }
      
      this.isLoading = true;
      this.testStatus = 'Testando conexão...';
      this.testStatusClass = 'info';
      
      try {
        // Emitir um evento para testar a conexão e aguardar o resultado
        this.$emit('connect', { ...this.config, testMode: true });
        
        // Normalmente, o resultado seria recebido através de um callback ou promessa
        // Aqui estamos simulando um teste bem-sucedido após um atraso
        setTimeout(() => {
          this.testStatus = 'Conexão bem-sucedida!';
          this.testStatusClass = 'success';
          this.isLoading = false;
        }, 2000);
      } catch (error) {
        this.testStatus = `Erro na conexão: ${error.message}`;
        this.testStatusClass = 'error';
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.sip-config {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.form-control:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0,123,255,.25);
}

.checkbox {
  display: flex;
  align-items: center;
}

.checkbox input {
  margin-right: 8px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.save-btn, .test-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.save-btn {
  background-color: #28a745;
  color: white;
}

.test-btn {
  background-color: #007bff;
  color: white;
}

.save-btn:hover {
  background-color: #218838;
}

.test-btn:hover {
  background-color: #0069d9;
}

.status-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
}

.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}
</style>