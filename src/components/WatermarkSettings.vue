<template>
  <div class="watermark-settings">
    <h4>{{ $t('label.watermark_settings') }}</h4>
    
    <!-- 水印来源选择 -->
    <div class="setting-item">
      <label>水印来源:</label>
      <select v-model="watermarkSource">
        <option value="custom">自定义文本</option>
        <option value="field">选择字段</option>
      </select>
    </div>
    
    <!-- 自定义文本输入 -->
    <div v-if="watermarkSource === 'custom'" class="setting-item">
      <label>水印文本:</label>
      <input v-model="watermarkText" placeholder="输入水印文本" />
    </div>
    
    <!-- 字段选择 -->
    <div v-if="watermarkSource === 'field'" class="setting-item">
      <label>水印字段:</label>
      <select v-model="watermarkFieldId" @change="getWatermarkFieldValue">
        <option value="">-- 选择字段 --</option>
        <option v-for="field in watermarkFieldList" :key="field.id" :value="field.id">
          {{ field.name }}
        </option>
      </select>
    </div>
    
    <!-- 目标字段选择 -->
    <div class="setting-item">
      <label>{{ $t('label.target_field') }}:</label>
      <select v-model="targetFieldId">
        <option value="">-- {{ $t('placeholder.field') }} --</option>
        <option v-for="field in targetFieldList" :key="field.id" :value="field.id">
          {{ field.name }}
        </option>
      </select>
    </div>
    
    <!-- 字体设置 -->
    <div class="setting-item">
      <label>{{ $t('label.font') }}:</label>
      <select v-model="watermarkFont">
        <option value="Arial">Arial</option>
        <option value="SimSun">宋体</option>
        <option value="Microsoft YaHei">微软雅黑</option>
        <option value="SimHei">黑体</option>
      </select>
    </div>
    
    <!-- 字体大小 -->
    <div class="setting-item">
      <label>{{ $t('label.font_size') }}:</label>
      <input type="number" v-model="watermarkSize" min="8" max="72" />
    </div>
    
    <!-- 颜色设置 -->
    <div class="setting-item">
      <label>{{ $t('label.color') }}:</label>
      <input type="color" v-model="watermarkColor" />
    </div>
    
    <!-- 透明度 -->
    <div class="setting-item">
      <label>{{ $t('label.opacity') }}:</label>
      <input type="range" v-model="watermarkOpacity" min="0.1" max="1" step="0.1" />
      <span>{{ watermarkOpacity }}</span>
    </div>
    
    <!-- 位置设置 -->
    <div class="setting-item">
      <label>{{ $t('label.position') }}:</label>
      <select v-model="watermarkPosition">
        <option value="center">{{ $t('label.center') }}</option>
        <option value="top-left">{{ $t('label.top_left') }}</option>
        <option value="top-right">{{ $t('label.top_right') }}</option>
        <option value="bottom-left">{{ $t('label.bottom_left') }}</option>
        <option value="bottom-right">{{ $t('label.bottom_right') }}</option>
        <option value="custom">{{ $t('label.custom') }}</option>
      </select>
    </div>
    
    <!-- 自定义位置 -->
    <div v-if="watermarkPosition === 'custom'" class="setting-item">
      <label>{{ $t('label.horizontal_position') }} (%):</label>
      <input type="range" v-model="watermarkX" min="0" max="100" step="1" />
      <span>{{ watermarkX }}</span>
    </div>
    <div v-if="watermarkPosition === 'custom'" class="setting-item">
      <label>{{ $t('label.vertical_position') }} (%):</label>
      <input type="range" v-model="watermarkY" min="0" max="100" step="1" />
      <span>{{ watermarkY }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// Props
const props = defineProps({
  watermarkText: String,
  watermarkFont: String,
  watermarkSize: Number,
  watermarkColor: String,
  watermarkOpacity: Number,
  watermarkPosition: String,
  watermarkX: Number,
  watermarkY: Number,
  watermarkSource: String,
  watermarkFieldId: String,
  watermarkFieldList: Array,
  watermarkFieldValue: String,
  targetFieldId: String,
  targetFieldList: Array
});

// Emits
const emit = defineEmits([
  'update:watermarkText',
  'update:watermarkFont',
  'update:watermarkSize',
  'update:watermarkColor',
  'update:watermarkOpacity',
  'update:watermarkPosition',
  'update:watermarkX',
  'update:watermarkY',
  'update:watermarkSource',
  'update:watermarkFieldId',
  'update:targetFieldId',
  'getWatermarkFieldValue'
]);

// 获取水印字段值
const getWatermarkFieldValue = () => {
  emit('getWatermarkFieldValue');
};

// 监听变化并向上传递
watch(() => props.watermarkText, (val) => emit('update:watermarkText', val));
watch(() => props.watermarkFont, (val) => emit('update:watermarkFont', val));
watch(() => props.watermarkSize, (val) => emit('update:watermarkSize', val));
watch(() => props.watermarkColor, (val) => emit('update:watermarkColor', val));
watch(() => props.watermarkOpacity, (val) => emit('update:watermarkOpacity', val));
watch(() => props.watermarkPosition, (val) => emit('update:watermarkPosition', val));
watch(() => props.watermarkX, (val) => emit('update:watermarkX', val));
watch(() => props.watermarkY, (val) => emit('update:watermarkY', val));
watch(() => props.watermarkSource, (val) => emit('update:watermarkSource', val));
watch(() => props.watermarkFieldId, (val) => emit('update:watermarkFieldId', val));
watch(() => props.targetFieldId, (val) => emit('update:targetFieldId', val));
</script>

<style scoped>
.watermark-settings {
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.watermark-settings h4 {
  margin-top: 0;
  margin-bottom: 6px;
  font-size: 16px;
  color: #333;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 3px;
}

.setting-item label {
  width: 100px;
  font-size: 14px;
  color: #666;
}

.setting-item input,
.setting-item select {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  width: 150px;
}

.setting-item input[type='color'] {
  width: 40px;
  height: 30px;
  padding: 2px;
}

.setting-item input[type='range'] {
  width: 120px;
  margin-right: 10px;
}
</style> 