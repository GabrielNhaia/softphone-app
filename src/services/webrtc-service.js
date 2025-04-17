// src/services/webrtc-service.js

export default class WebRTCService {
    constructor() {
      this.pc = null;
      this.localStream = null;
      this.remoteStream = null;
      this.iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Configuração do servidor TURN - substitua com seus próprios servidores
        {
          urls: 'turn:seu-servidor-turn.com:3478',
          username: 'username',
          credential: 'password'
        }
      ];
    }
  
    async getLocalStream() {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: false 
        });
        return this.localStream;
      } catch (error) {
        console.error('Erro ao acessar mídia local:', error);
        throw error;
      }
    }
  
    createPeerConnection() {
      this.pc = new RTCPeerConnection({ iceServers: this.iceServers });
      
      // Adicionar stream local
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.pc.addTrack(track, this.localStream);
        });
      }
      
      // Configurar handlers de eventos
      this.pc.onicecandidate = this.handleIceCandidate.bind(this);
      this.pc.ontrack = this.handleTrack.bind(this);
      
      return this.pc;
    }
    
    handleIceCandidate(event) {
      if (event.candidate) {
        // Enviar ICE candidate para o outro peer via SIP INFO
        console.log('ICE candidate:', event.candidate);
      }
    }
    
    handleTrack(event) {
      this.remoteStream = event.streams[0];
      // Evento para notificar que o stream remoto está disponível
      const remoteStreamEvent = new CustomEvent('remoteStreamAvailable', {
        detail: this.remoteStream
      });
      window.dispatchEvent(remoteStreamEvent);
    }
  }