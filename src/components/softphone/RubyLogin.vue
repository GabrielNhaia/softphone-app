<template>
  <div class="ruby-login">
    <div class="card">
      <div class="card-header">
        <h4>Login na API Ruby</h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="login">
          <div class="form-group mb-3">
            <label for="username">Usuário</label>
            <input 
              type="text" 
              class="form-control" 
              id="username" 
              v-model="credentials.username"
              placeholder="Usuário"
              required
            >
          </div>
          
          <div class="form-group mb-3">
            <label for="password">Senha</label>
            <input 
              type="password" 
              class="form-control" 
              id="password" 
              v-model="credentials.password"
              required
            >
          </div>
          
          <div class="form-group mb-3">
            <label for="apiUrl">URL da API (opcional)</label>
            <input 
              type="text" 
              class="form-control" 
              id="apiUrl" 
              v-model="apiUrl"
              placeholder="http://localhost:3000/api"
            >
          </div>
          
          <div class="d-grid">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ loading ? 'Autenticando...' : 'Entrar' }}
            </button>
          </div>
          
          <div class="alert alert-danger mt-3" v-if="error">
            {{ error }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import RubyApiService from '../../services/ruby-api-service';

export default {
  name: 'RubyLogin',
  data() {
    return {
      credentials: {
        username: '',
        password: ''
      },
      apiUrl: 'http://localhost:3000/api',
      loading: false,
      error: null,
      rubyApiService: null
    };
  },
  created() {
    // Inicializar o serviço com a URL padrão
    this.rubyApiService = new RubyApiService(this.apiUrl);
    
    // Verificar se já tem um token salvo
    const token = localStorage.getItem('rubyApiToken');
    if (token) {
      this.$emit('auth-success', this.rubyApiService);
    }
  },
  methods: {
    async login() {
      this.loading = true;
      this.error = null;
      
      try {
        // Atualizar URL da API se foi alterada
        if (this.apiUrl) {
          this.rubyApiService = new RubyApiService(this.apiUrl);
        }
        
        await this.rubyApiService.login(this.credentials.username, this.credentials.password);
        
        // Emitir evento de sucesso com o serviço
        this.$emit('auth-success', this.rubyApiService);
      } catch (error) {
        this.error = 'Falha na autenticação. Verifique suas credenciais.';
        console.error('Erro de login:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.ruby-login {
  max-width: 500px;
  margin: 0 auto;
}
</style>