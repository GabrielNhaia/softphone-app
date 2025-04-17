<template>
  <div class="softphone-container">
    <div v-if="!isConnected">
      <sip-config 
        @config-saved="handleConfigSaved" 
        @connect="handleConnect"
      />
    </div>
    
    <div v-else>
      <phone-interface 
        :sipService="sipService"
        :isRegistered="isRegistered"
      />
      
      <div class="text-center mt-3">
        <button class="btn btn-outline-secondary" @click="disconnect">
          <i class="fas fa-cog"></i> Configurações
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import SipConfig from './softphone/SipConfig.vue';
import PhoneInterface from './softphone/PhoneInterface.vue';
import SipService from '../services/sip-service';

export default {
  name: 'Softphone',
  components: {
    SipConfig,
    PhoneInterface
  },
  data() {
    return {
      sipService: null,
      isConnected: false,
      isRegistered: false,
      sipConfig: null
    };
  },
  created() {
    this.sipService = new SipService();
    
    // Verificar se há configurações salvas e conectar automaticamente
    const savedConfig = localStorage.getItem('sipConfig');
    if (savedConfig) {
      try {
        this.sipConfig = JSON.parse(savedConfig);
        if (this.sipConfig.autoConnect) {
          this.handleConnect(this.sipConfig);
        }
      } catch (e) {
        console.error('Erro ao carregar configurações salvas:', e);
      }
    }
  },
  methods: {
    handleConfigSaved(config) {
      this.sipConfig = config;
      // Salvar no localStorage
      localStorage.setItem('sipConfig', JSON.stringify(config));
    },
    
    async handleConnect(config) {
      if (!config) {
        config = this.sipConfig;
      }
      
      if (!config) {
        alert('Por favor, configure os parâmetros SIP primeiro.');
        return;
      }
      
      try {
        this.sipService.registerEventHandlers({
          onRegistered: () => {
            this.isRegistered = true;
          },
          onRegistrationFailed: (e) => {
            alert(`Falha no registro SIP: ${e.cause}`);
            this.isRegistered = false;
          }
        });
        
        const result = await this.sipService.connect(config);
        this.isConnected = result;
      } catch (error) {
        console.error('Erro ao conectar:', error);
        alert('Erro ao conectar ao servidor SIP.');
      }
    },
    
    disconnect() {
      this.sipService.disconnect();
      this.isConnected = false;
      this.isRegistered = false;
    }
  }
}
</script>

<style scoped>
.softphone-container {
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
}
</style>