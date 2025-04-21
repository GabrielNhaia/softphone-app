<template>
  <div id="app">
    <div class="container">
      <header class="mb-4 text-center">
        <h1 class="mt-4">VuePhone</h1>
        <p class="lead">Softphone em Vue.js com WebRTC e SIP</p>
      </header>
      
      <div>
        <softphone />
      </div>
      
      <footer class="mt-5 text-center text-muted">
        <p>VuePhone - Softphone com Vue.js, WebRTC e SIP © {{ new Date().getFullYear() }}</p>
      </footer>
    </div>
  </div>
</template>

<script>
import Softphone from './components/Softphone.vue';

export default {
  name: 'App',
  components: {
    Softphone
  }
}
</script>

<style>
@import 'bootstrap/dist/css/bootstrap.min.css';
@import '@fortawesome/fontawesome-free/css/all.min.css';

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin-top: 20px;
  margin-bottom: 40px;
}
</style>