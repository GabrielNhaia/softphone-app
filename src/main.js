import { createApp } from 'vue'
import App from './App.vue'

import 'webrtc-adapter';

if (!window.RTCPeerConnection) {
  console.warn('WebRTC não é suportado neste navegador.');
}

async function checkInitialPermissions() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    console.log('Permissão de áudio concedida.');
  } catch (error) {
    console.warn('Permissão de áudio não concedida:', error);
  }
}

checkInitialPermissions().then(() => {
  createApp(App).mount('#app');
});