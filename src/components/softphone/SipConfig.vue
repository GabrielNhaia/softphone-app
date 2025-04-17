// src/components/softphone/SipConfig.vue
<template>
  <div class="sip-config">
    <div class="card">
      <div class="card-header">
        <h4>Configurações SIP</h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveConfig">
          <div class="form-group mb-3">
            <label for="sipDomain">Domínio SIP</label>
            <input 
              type="text" 
              class="form-control" 
              id="sipDomain" 
              v-model="config.domain"
              placeholder="exemplo.com"
              required
            >
          </div>
          
          <div class="form-group mb-3">
            <label for="sipWsServer">Servidor WebSocket</label>
            <input 
              type="text" 
              class="form-control" 
              id="sipWsServer" 
              v-model="config.wsServer"
              placeholder="wss://sip-ws.exemplo.com"
              required
            >
          </div>
          
          <div class="form-group mb-3">
            <label for="sipUser">Usuário</label>
            <input 
              type="text" 
              class="form-control" 
              id="sipUser" 
              v-model="config.user"
              placeholder="usuario"
              required
            >
          </div>
          
          <div class="form-group mb-3">
            <label for="sipPassword">Senha</label>
            <input 
              type="password" 
              class="form-control" 
              id="sipPassword" 
              v-model="config.password"
              required
            >
          </div>
          
          <div class="d-flex justify-content-between">
            <button type="submit" class="btn btn-primary">Salvar</button>
            <button type="button" class="btn btn-success" @click="connect" :disabled="!isConfigValid">
              Conectar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SipConfig',
  data() {
    return {
      config: {
        domain: '',
        wsServer: '',
        user: '',
        password: ''
      }
    };
  },
  computed: {
    isConfigValid() {
      return this.config.domain && 
             this.config.wsServer && 
             this.config.user && 
             this.config.password;
    }
  },
  created() {
    // Carregar configuração salva
    const savedConfig = localStorage.getItem('sipConfig');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  },
  methods: {
    saveConfig() {
      localStorage.setItem('sipConfig', JSON.stringify(this.config));
      this.$emit('config-saved', this.config);
    },
    connect() {
      this.$emit('connect', this.config);
    }
  }
}
</script>

<style scoped>
.sip-config {
  max-width: 500px;
  margin: 0 auto;
}
</style>