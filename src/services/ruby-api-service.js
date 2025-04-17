// src/services/ruby-api-service.js

export default class RubyApiService {
    constructor(baseUrl = 'http://localhost:3000/api') {
      this.baseUrl = baseUrl;
      this.token = localStorage.getItem('rubyApiToken');
    }
  
    setToken(token) {
      this.token = token;
      localStorage.setItem('rubyApiToken', token);
    }
  
    async login(username, password) {
      try {
        const response = await fetch(`${this.baseUrl}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
  
        if (!response.ok) {
          throw new Error(`Erro no login: ${response.statusText}`);
        }
  
        const data = await response.json();
        this.setToken(data.token);
        return data;
      } catch (error) {
        console.error('Erro ao fazer login na API Ruby:', error);
        throw error;
      }
    }
  
    async fetchHeaders() {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      };
    }
  
    async getSipCredentials() {
      try {
        const headers = await this.fetchHeaders();
        const response = await fetch(`${this.baseUrl}/sip/credentials`, {
          method: 'GET',
          headers
        });
  
        if (!response.ok) {
          throw new Error(`Erro ao buscar credenciais: ${response.statusText}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar credenciais SIP:', error);
        throw error;
      }
    }
  
    async logCall(callData) {
      try {
        const headers = await this.fetchHeaders();
        const response = await fetch(`${this.baseUrl}/calls`, {
          method: 'POST',
          headers,
          body: JSON.stringify(callData)
        });
  
        if (!response.ok) {
          throw new Error(`Erro ao registrar chamada: ${response.statusText}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Erro ao registrar chamada na API Ruby:', error);
        throw error;
      }
    }
  
    async getContacts() {
      try {
        const headers = await this.fetchHeaders();
        const response = await fetch(`${this.baseUrl}/contacts`, {
          method: 'GET',
          headers
        });
  
        if (!response.ok) {
          throw new Error(`Erro ao buscar contatos: ${response.statusText}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        throw error;
      }
    }
  
    async getCallHistory() {
      try {
        const headers = await this.fetchHeaders();
        const response = await fetch(`${this.baseUrl}/calls/history`, {
          method: 'GET',
          headers
        });
  
        if (!response.ok) {
          throw new Error(`Erro ao buscar histórico: ${response.statusText}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar histórico de chamadas:', error);
        throw error;
      }
    }
  }