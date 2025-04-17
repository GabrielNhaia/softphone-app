<template>
  <div id="app">
    <div class="container">
      <header class="mb-4 text-center">
        <h1 class="mt-4">VuePhone</h1>
        <p class="lead">Softphone em Vue.js com WebRTC e SIP</p>
      </header>
      
      <!-- Comentando a verificação de API Ruby para mostrar diretamente o softphone -->
      <!-- <div v-if="!rubyApiService">
        <ruby-login @auth-success="handleRubyAuth" />
      </div>
      
      <!-- Mostrando diretamente o softphone sem necessidade de autenticação -->
      <div>
        <softphone />
        
        <!-- <div class="text-center mt-4">
          <button class="btn btn-sm btn-outline-secondary" @click="logout">
            <i class="fas fa-sign-out-alt"></i> Sair
          </button>
        </div> -->
      </div>
      
      <footer class="mt-5 text-center text-muted">
        <p>VuePhone - Softphone com Vue.js, WebRTC e SIP © {{ new Date().getFullYear() }}</p>
      </footer>
    </div>
  </div>
</template>

<script>
// Importando apenas o componente Softphone
// import RubyLogin from './components/softphone/RubyLogin.vue';
import Softphone from './components/Softphone.vue';

export default {
  name: 'App',
  components: {
    // RubyLogin,
    Softphone
  },
  data() {
    return {
      // Não precisamos mais dessa propriedade para o teste
      // rubyApiService: null
    };
  },
  /* Comentando os métodos relacionados à API Ruby
  methods: {
    handleRubyAuth(apiService) {
      this.rubyApiService = apiService;
    },
    
    logout() {
      localStorage.removeItem('rubyApiToken');
      this.rubyApiService = null;
    }
  }
  */
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin-top: 20px;
  margin-bottom: 40px;
}

@import 'bootstrap/dist/css/bootstrap.min.css';
@import '@fortawesome/fontawesome-free/css/all.min.css';
</style>