<template>
  <div>
    <input v-model="mValue" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
const emits = defineEmits(['update:value','update:modelValue'])
const props = defineProps({
  value: { // ==>v-model:value=""
    type: String,
    default: ''
  },
  modelValue: { // ==> v-model=""
    type: String,
    default: ''
  }
})
const mValue = ref(props.value)
watch(()=>mValue.value,()=>{
  emits('update:value',mValue.value)
  emits('update:modelValue',mValue.value)
})
</script>