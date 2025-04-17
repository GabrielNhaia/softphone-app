<template>
  <div class="phone-keypad">
    <div class="keypad-row">
      <button @click="$emit('digit', '1')" class="keypad-btn">1</button>
      <button @click="$emit('digit', '2')" class="keypad-btn">2</button>
      <button @click="$emit('digit', '3')" class="keypad-btn">3</button>
    </div>
    <div class="keypad-row">
      <button @click="$emit('digit', '4')" class="keypad-btn">4</button>
      <button @click="$emit('digit', '5')" class="keypad-btn">5</button>
      <button @click="$emit('digit', '6')" class="keypad-btn">6</button>
    </div>
    <div class="keypad-row">
      <button @click="$emit('digit', '7')" class="keypad-btn">7</button>
      <button @click="$emit('digit', '8')" class="keypad-btn">8</button>
      <button @click="$emit('digit', '9')" class="keypad-btn">9</button>
    </div>
    <div class="keypad-row">
      <button @click="$emit('digit', '*')" class="keypad-btn">*</button>
      <button @click="$emit('digit', '0')" class="keypad-btn">0</button>
      <button @click="$emit('digit', '#')" class="keypad-btn">#</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhoneKeypad',
  emits: ['digit']
}
</script>

<style scoped>
.phone-keypad {
  width: 100%;
  max-width: 300px;
  margin: 20px auto;
}

.keypad-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.keypad-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.keypad-btn:hover {
  background-color: #e0e0e0;
}

.keypad-btn:active {
  background-color: #d0d0d0;
  transform: scale(0.95);
}
</style>