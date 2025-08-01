<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : Wang Chao
 * @LastTime   : 2025-02-27 06:39
 * @desc       : 主要页面
-->
<script setup>
  import { bitable } from '@lark-base-open/js-sdk';
  import { ref, onMounted, watch, watchEffect, computed } from 'vue';

  // 国际化
  import { useI18n } from 'vue-i18n';
  const { t, locale } = useI18n();

  // 确保图片预览标签已添加到国际化配置
  // 如果需要，可以在这里添加动态翻译

  // 选择模式 cell 单元格; field 字段; database 数据表
  const selectModel = ref('cell');

  const databaseList = ref();
  const databaseId = ref();
  const viewList = ref();
  const viewId = ref();
  const fieldList = ref();
  const fieldId = ref();

  const base = bitable.base;

  // 当前点击字段id
  const currentFieldId = ref();
  const recordId = ref();

  const currentValue = ref();
  const imageUrl = ref('');
  const isImageAttachment = ref(false);
  const fieldType = ref('');
  const isAttachmentField = ref(false);

  // 水印相关状态
  const watermarkText = ref('水印文本');
  const watermarkFont = ref('Arial');
  const watermarkSize = ref(24);
  const watermarkColor = ref('#000000');
  const watermarkOpacity = ref(0.5);
  const watermarkPosition = ref('center'); // center, top-left, top-right, bottom-left, bottom-right, custom
  const watermarkX = ref(50); // 横向位置(%)
  const watermarkY = ref(50); // 纵向位置(%)
  const watermarkedImageUrl = ref('');

  // 计算水印位置样式
  const watermarkPositionStyle = computed(() => {
    if (watermarkPosition.value === 'custom') {
      return { 
        top: `${watermarkY.value}%`, 
        left: `${watermarkX.value}%`, 
        transform: 'translate(-50%, -50%)'
      };
    } else {
      switch(watermarkPosition.value) {
        case 'top-left': return { top: '10px', left: '10px' };
        case 'top-right': return { top: '10px', right: '10px' };
        case 'bottom-left': return { bottom: '10px', left: '10px' };
        case 'bottom-right': return { bottom: '10px', right: '10px' };
        default: return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      }
    }
  });

  // 添加水印到图片
  function addWatermarkToImage(imgUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 设置canvas尺寸与图片一致
        canvas.width = img.width;
        canvas.height = img.height;

        // 绘制原图
        ctx.drawImage(img, 0, 0);

        // 设置水印样式
        ctx.font = `${watermarkSize.value}px ${watermarkFont.value}`;
        ctx.fillStyle = watermarkColor.value;
        ctx.globalAlpha = watermarkOpacity.value;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 计算水印位置
        let x, y;
        if (watermarkPosition.value === 'custom') {
          x = (watermarkX.value / 100) * canvas.width;
          y = (watermarkY.value / 100) * canvas.height;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
        } else {
          switch(watermarkPosition.value) {
            case 'top-left':
              x = 20;
              y = 20;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              break;
            case 'top-right':
              x = canvas.width - 20;
              y = 20;
              ctx.textAlign = 'right';
              ctx.textBaseline = 'top';
              break;
            case 'bottom-left':
              x = 20;
              y = canvas.height - 20;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'bottom';
              break;
            case 'bottom-right':
              x = canvas.width - 20;
              y = canvas.height - 20;
              ctx.textAlign = 'right';
              ctx.textBaseline = 'bottom';
              break;
            default:
              x = canvas.width / 2;
              y = canvas.height / 2;
          }
        }

        // 绘制水印
        ctx.fillText(watermarkText.value, x, y);

        // 返回带水印的图片URL
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imgUrl;
    });
  }

  // 监听图片URL变化，添加水印
  watch(imageUrl, async (newVal) => {
    if (newVal) {
      watermarkedImageUrl.value = await addWatermarkToImage(newVal);
    }
  });

  // 监听水印设置变化，重新添加水印
  watch([watermarkText, watermarkFont, watermarkSize, watermarkColor, watermarkOpacity, watermarkPosition, watermarkX, watermarkY], async () => {
    if (imageUrl.value) {
      watermarkedImageUrl.value = await addWatermarkToImage(imageUrl.value);
    }
  });

  onMounted(async () => {
    databaseList.value = await base.getTableMetaList();
  });

  // 切换数据表, 默认选择第一个视图
  async function databaseChange() {
    if (selectModel.value === 'field') {
      const table = await base.getTable(databaseId.value);
      viewList.value = await table.getViewMetaList();
      viewId.value = viewList.value[0]?.id;
    }
  }

  // 根据视图列表获取字段列表
  watch(viewId, async (newValue, oldValue) => {
    const table = await base.getTable(databaseId.value);
    const view = await table.getViewById(newValue);
    const _list = await view.getFieldMetaList();

    // 只展示文本相关字段
    fieldList.value = _list.filter((item) => item.type === 1);
  });

  // 切换选择模式时,重置选择
  watch(selectModel, async (newValue, oldValue) => {
    if (newValue === 'cell') return;
    // 单列和数据表模式，默认选中当前数据表和当前视图

    const selection = await base.getSelection();
    databaseId.value = selection.tableId;

    if (newValue === 'field') {
      fieldId.value = '';
      fieldList.value = [];
      viewId.value = '';

      const table = await base.getTable(databaseId.value);
      viewList.value = await table.getViewMetaList();
      viewId.value = selection.viewId;
    }
  });

  // 数据表修改后，自动获取视图列表
  watchEffect(async () => {
    const table = await base.getTable(databaseId.value);
    viewList.value = await table.getViewMetaList();
  });

  base.onSelectionChange(async (event) => {
    // 获取点击的字段id和记录id
    currentFieldId.value = event.data.fieldId;
    recordId.value = event.data.recordId;

    // 获取当前数据表和视图
    databaseId.value = event.data.tableId;
    viewId.value = event.data.viewId;

    if (currentFieldId.value && recordId.value) {
      try {
        // 重置图片显示状态
        isImageAttachment.value = false;
        imageUrl.value = '';

        // 获取当前数据表
        const table = await base.getTable(databaseId.value);
        // 获取字段
        const field = await table.getField(currentFieldId.value);

        // 检查字段类型 - 添加调试信息
        fieldType.value = field.type;
        console.log('字段类型:', field.type);
        // 实际开发中发现附件字段类型可能是11或其他值，这里改为更灵活的判断方式
        isAttachmentField.value = field.type === 11 || field.type === 'attachment' || field.type === 'image';
        if (isAttachmentField) { // 附件字段类型
          // 获取附件URLs
          try {
            const attachmentUrls = await field.getAttachmentUrls(recordId.value);
            console.log('附件URLs:', attachmentUrls);
            // 获取单元格值
            const value = await field.getCell(recordId.value).then(cell => cell.getValue());
            console.log('附件值:', value);

            // 检查是否有附件且是图片
            if (Array.isArray(value) && value.length > 0 && attachmentUrls.length > 0) {
              const firstAttachment = value[0];
              // 检查MIME类型是否为图片
              if (firstAttachment.type && firstAttachment.type.startsWith('image/')) {
                isImageAttachment.value = true;
                imageUrl.value = attachmentUrls[0];
                console.log('图片URL:', imageUrl.value);
                currentValue.value = `图片附件: ${firstAttachment.name}`;
              } else {
                currentValue.value = `非图片附件: ${firstAttachment.name}`;
              }
            } else {
              currentValue.value = '无附件数据';
            }
          } catch (error) {
            console.error('获取附件数据失败:', error);
            currentValue.value = '获取附件数据失败';
            // 调试信息
            console.log('字段ID:', currentFieldId.value);
            console.log('记录ID:', recordId.value);
          }
        } else {
          // 非附件字段，按原有逻辑处理
          console.log('非附件字段处理，字段类型:', fieldType.value);
          // 获取单元格
          const cell = await field.getCell(recordId.value);
          // 获取单元格值
          const value = await cell.getValue();

          // 根据字段类型处理值
          if (Array.isArray(value) && value.length > 0 && value[0].text) {
            currentValue.value = value[0].text;
          } else if (typeof value === 'string') {
            currentValue.value = value;
          } else if (typeof value === 'object') {
            currentValue.value = JSON.stringify(value);
          } else {
            currentValue.value = String(value);
          }
        }
      } catch (error) {
        console.error('获取单元格值失败:', error);
        currentValue.value = '获取数据失败';
      }
    } else {
      currentValue.value = '';
    }
  });
</script>

<template>
  <div class="main">
    <div class="label">
      <div class="text">{{ $t('label.base') }}</div>
      <el-select
        v-model="databaseId"
        :placeholder="$t('placeholder.base')"
        @change="databaseChange"
        popper-class="selectStyle"
      >
        <el-option
          v-for="item in databaseList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </div>

    <div class="label">
      <div class="text">{{ $t('label.view') }}</div>
      <el-select
        v-model="viewId"
        :placeholder="$t('placeholder.view')"
        popper-class="selectStyle"
      >
        <el-option
          v-for="item in viewList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </div>
    <div class="label">
      <div class="text">{{ $t('label.field') }}</div>
      <el-select
        v-model="fieldId"
        :placeholder="$t('placeholder.field')"
        popper-class="selectStyle"
      >
        <el-option
          v-for="item in fieldList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </div>

    <div>{{ $t('label.current') }}</div>
    <div class="show-data">{{ currentValue || '暂无数据' }}</div>

    <!-- 图片附件显示区域 -->
    <div v-if="isImageAttachment" class="image-container">
      <div class="image-label">{{ $t('label.image_preview') }}</div>
      
      <!-- 水印设置区域 -->
      <div class="watermark-settings">
        <h4>{{ $t('label.watermark_settings') }}</h4>
        <div class="setting-item">
          <label>{{ $t('label.watermark_text') }}:</label>
          <input v-model="watermarkText" placeholder="输入水印文本" />
        </div>
        <div class="setting-item">
          <label>{{ $t('label.font') }}:</label>
          <select v-model="watermarkFont">
            <option value="Arial">Arial</option>
            <option value="SimSun">宋体</option>
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="SimHei">黑体</option>
          </select>
        </div>
        <div class="setting-item">
          <label>{{ $t('label.font_size') }}:</label>
          <input type="number" v-model="watermarkSize" min="8" max="72" />
        </div>
        <div class="setting-item">
          <label>{{ $t('label.color') }}:</label>
          <input type="color" v-model="watermarkColor" />
        </div>
        <div class="setting-item">
          <label>{{ $t('label.opacity') }}:</label>
          <input type="range" v-model="watermarkOpacity" min="0.1" max="1" step="0.1" />
          <span>{{ watermarkOpacity }}</span>
        </div>
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
      
      <!-- 预览区域 -->
      <div class="preview-container">
        <img :src="watermarkedImageUrl || imageUrl" alt="预览图片" class="preview-image" />
        <div v-if="watermarkText" :style="watermarkPositionStyle" class="watermark-preview">
          {{ watermarkText }}
        </div>
      </div>
      
      <div class="debug-info">
        <p>图片URL: {{ imageUrl }}</p>
        <p>是否为图片附件: {{ isImageAttachment }}</p>
      </div>
    </div>
    <div v-else-if="currentFieldId && currentFieldId.value">
      <div class="debug-info">
        <p>字段类型: {{ fieldType.value }}</p>
        <p>是否为附件字段: {{ isAttachmentField.value }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .main {
    font-weight: normal;
  }

  .label {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .text {
      width: 70px;
      margin-right: 10px;
      white-space: nowrap;
      font-size: 14px;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      color: #fff;
      background-color: rgb(20, 86, 240);
      border-color: rgb(20, 86, 240);
      box-shadow: 1px 0 0 0 rgb(20, 86, 240);
    }

    :deep(.el-radio-button__inner) {
      font-weight: 300;
    }

    :deep(.el-radio-button__inner:hover) {
      color: rgb(20, 86, 240);
    }

    :deep(.el-input__inner) {
      font-weight: 300;
    }
  }

  .show-data {
    margin-top: 20px;
    width: 90%;
    padding: 10px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    min-height: 30px;
  }

  .image-container {
  margin-top: 20px;
  width: 90%;
}

.watermark-settings {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.watermark-settings h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
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

.preview-container {
  position: relative;
  display: inline-block;
}

.watermark-preview {
  position: absolute;
  font-size: 24px;
  color: #000;
  opacity: 0.5;
  pointer-events: none;
  white-space: nowrap;
}

.image-label {
  font-size: 14px;
  margin-bottom: 10px;
  color: #666;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.debug-info {
  margin-top: 12px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
}

.debug-info p {
  margin: 4px 0;
}
</style>

<style>
  .selectStyle {
    .el-select-dropdown__item {
      font-weight: 300 !important;
    }

    .el-select-dropdown__item.selected {
      color: rgb(20, 86, 240);
    }
  }
</style>
