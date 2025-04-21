import JsSIP from 'jssip';
import { EventEmitter } from 'events';

class SipService extends EventEmitter {
  constructor() {
    super();
    this.ua = null;
    this.session = null;
    this.registered = false;
    this.config = null;
    this.audioElement = null;
    this.setupAudioElement();
  }

  setupAudioElement() {
    this.audioElement = document.createElement('audio');
    this.audioElement.autoplay = true;
    document.body.appendChild(this.audioElement);
  }

  connect(config) {
    return new Promise((resolve, reject) => {
      if (this.ua) {
        this.disconnect();
      }

      this.config = config;

      const socket = new JsSIP.WebSocketInterface(config.websocket);

      const options = {
        sockets: [socket],
        uri: `sip:${config.username}@${config.domain}`,
        password: config.password,
        display_name: config.displayName || config.username,
        register: true,
        register_expires: 300,
        session_timers: false,
      };

      try {
        this.ua = new JsSIP.UA(options);

        this.ua.on('connecting', () => {
          this.emit('connecting');
        });

        this.ua.on('connected', () => {
          this.emit('connected');
        });

        this.ua.on('disconnected', () => {
          this.registered = false;
          this.emit('disconnected');
        });

        this.ua.on('registered', () => {
          this.registered = true;
          this.emit('registered');
          resolve(true);
        });

        this.ua.on('unregistered', () => {
          this.registered = false;
          this.emit('unregistered');
        });

        this.ua.on('registrationFailed', (data) => {
          this.registered = false;
          this.emit('registrationFailed', data);
          reject(data);
        });

        this.ua.on('newRTCSession', (data) => {
          const session = data.session;

          if (this.session) {
            if (data.originator === 'remote') {
              session.terminate();
              return;
            }
          }

          this.session = session;

          this._setupSessionEvents(session);

          if (data.originator === 'remote') {
            const remoteNumber = session.remote_identity.uri.user;

            this.emit('incomingCall', {
              remoteNumber,
              session
            });
          }
        });

        this.ua.start();

      } catch (error) {
        console.error('Erro ao iniciar SIP UA:', error);
        reject(error);
      }
    });
  }

  _setupSessionEvents(session) {
    session.on('progress', () => {
      this.emit('callStatus', { code: 'progress', description: 'Chamando...' });
    });

    session.on('accepted', () => {
      this.emit('callStatus', { code: 'confirmed', description: 'Chamada em andamento' });
      this._setupRemoteStream(session);
    });

    session.on('confirmed', () => {
      this.emit('callStatus', { code: 'confirmed', description: 'Chamada em andamento' });
      this._setupRemoteStream(session);
    });

    session.on('ended', () => {
      this.emit('callStatus', { code: 'ended', description: 'Chamada finalizada' });
      this.emit('ended');
      this.session = null;
    });

    session.on('failed', (data) => {
      const cause = data.cause || 'Erro desconhecido';
      this.emit('callStatus', { code: 'failed', description: `Falha na chamada: ${cause}` });
      this.emit('ended');
      this.session = null;
    });

    session.on('refer', (data) => {
      this.emit('callStatus', { code: 'refer', description: 'Transferindo chamada...' });
    });
  }

  _setupRemoteStream(session) {
    const remoteStream = session.connection.getRemoteStreams()[0];
    
    if (remoteStream) {
      if ('srcObject' in this.audioElement) {
        this.audioElement.srcObject = remoteStream;
      } else {
        this.audioElement.src = window.URL.createObjectURL(remoteStream);
      }
    }
  }

  call(number) {
    console.log('Chamando número:', number);

    if (!this.ua || !this.registered) {
      throw new Error('Não registrado no servidor SIP');
    }

    const options = {
      mediaConstraints: { audio: true, video: false },
      pcConfig: {
        iceServers: [
          { urls: this.config.stunServer || 'stun:stun.l.google.com:19302' }
        ]
      }
    };

    try {
      const target = `sip:${number}@${this.config.domain}`;
      this.session = this.ua.call(target, options);
      return this.session;
    } catch (error) {
      console.error('Erro ao fazer chamada:', error);
      throw error;
    }
  }

  // Atender uma chamada recebida
  answer() {
    console.log('Atendendo chamada');

    if (!this.session) {
      throw new Error('Nenhuma chamada para atender');
    }

    const options = {
      mediaConstraints: { audio: true, video: false }
    };

    try {
      this.session.answer(options);
    } catch (error) {
      console.error('Erro ao atender chamada:', error);
      throw error;
    }
  }

  // Finalizar a chamada atual
  hangup() {
    console.log('Desligando chamada');

    if (this.session) {
      try {
        this.session.terminate();
      } catch (error) {
        console.error('Erro ao finalizar chamada:', error);
      }
      this.session = null;
    }
  }

  // Ativar/Desativar o mudo
  toggleMute(mute) {
    console.log('Alterando estado de mudo:', mute);

    if (!this.session) return;

    try {
      const audioSender = this.session.connection.getSenders()
        .find(sender => sender.track && sender.track.kind === 'audio');

      if (audioSender && audioSender.track) {
        audioSender.track.enabled = !mute;
      }
    } catch (error) {
      console.error('Erro ao alternar mudo:', error);
    }
  }

  // Enviar DTMF
  sendDTMF(tone) {
    console.log('Enviando tom DTMF:', tone);

    if (!this.session || !this.session.isEstablished()) return;

    try {
      this.session.sendDTMF(tone);
    } catch (error) {
      console.error('Erro ao enviar DTMF:', error);
    }
  }

  // Transferir chamada
  transfer(target) {
    console.log('Transferindo chamada para:', target);

    if (!this.session || !this.session.isEstablished()) {
      throw new Error('Nenhuma chamada ativa para transferir');
    }

    try {
      const transferTarget = `sip:${target}@${this.config.domain}`;
      this.session.refer(transferTarget);
    } catch (error) {
      console.error('Erro ao transferir chamada:', error);
      throw error;
    }
  }

  // Desconectar e limpar
  disconnect() {
    console.log('Desconectando do servidor SIP');
    this.registered = false;

    if (this.session) {
      try {
        this.session.terminate();
      } catch (e) {
        console.error('Erro ao finalizar sessão:', e);
      }
      this.session = null;
    }

    if (this.ua) {
      try {
        this.ua.stop();
      } catch (e) {
        console.error('Erro ao parar UA:', e);
      }
      this.ua = null;
    }

    this.registered = false;
  }

  // Verificar se está registrado
  isRegistered() {
    return this.registered;
  }

  // Verificar se há uma chamada em andamento
  hasActiveCall() {
    return !!this.session;
  }

  // Registrar handlers de eventos personalizados
  registerEventHandlers(handlers) {
    if (handlers.onRegistered) {
      this.on('registered', handlers.onRegistered);
    }
    
    if (handlers.onRegistrationFailed) {
      this.on('registrationFailed', handlers.onRegistrationFailed);
    }
    
    if (handlers.onCallReceived) {
      this.on('incomingCall', handlers.onCallReceived);
    }
    
    if (handlers.onCallEnded) {
      this.on('ended', handlers.onCallEnded);
    }
    
    if (handlers.onCallEstablished) {
      this.on('callEstablished', handlers.onCallEstablished);
      // Adicionamos um listener para o evento callStatus também
      this.on('callStatus', (status) => {
        if (status.code === 'confirmed') {
          handlers.onCallEstablished();
        }
      });
    }
  }
}

export default SipService;