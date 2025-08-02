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

  // 增强版全局错误处理器
  window.addEventListener('error', (event) => {
    console.error('全局错误捕获:', event.error);
    console.error('错误堆栈:', event.error.stack);
    console.error('错误发生在:', event.filename, '行号:', event.lineno);
    console.error('错误时间:', new Date().toLocaleString());
    console.error('页面URL:', window.location.href);
    console.error('targetFieldId值:', targetFieldId && targetFieldId.value);
    console.error('recordId值:', recordId && recordId.value);
    console.error('allFields值:', allFields);
    console.error('allFields.value值:', allFields && allFields.value);

    // 如果是length错误，特别处理
    if (event.error.message && event.error.message.includes('Cannot read properties of undefined (reading \'length\')')) {
      // 尝试确定哪个变量导致了错误
      let variableInfo = '';
      if (!allFields || !allFields.value) {
        variableInfo = '可能原因: allFields或allFields.value未定义';
      } else if (!Array.isArray(allFields.value)) {
        variableInfo = '可能原因: allFields.value不是数组';
      }

      alert(`捕获到length错误: ${event.error.message}\n发生在文件: ${event.filename}\n行号: ${event.lineno}\n${variableInfo}\n\n详细信息请查看控制台`);
    }
  });

  // 测试函数 - 用于隔离和诊断问题
  function testForLengthError() {
    try {
      console.log('开始测试length错误...');
      console.log('targetFieldId:', targetFieldId);
      console.log('targetFieldId.value:', targetFieldId && targetFieldId.value);
      console.log('recordId:', recordId);
      console.log('recordId.value:', recordId && recordId.value);
      console.log('watermarkedImageUrl:', watermarkedImageUrl);
      console.log('watermarkedImageUrl.value:', watermarkedImageUrl && watermarkedImageUrl.value);
      console.log('databaseId:', databaseId);
      console.log('databaseId.value:', databaseId && databaseId.value);
      console.log('allFields:', allFields);
      console.log('allFields.value:', allFields && allFields.value);

      // 测试可能导致length错误的操作
      if (allFields && allFields.value) {
        console.log('allFields.value.length:', allFields.value.length);
      } else {
        console.log('allFields或allFields.value未定义');
      }

      if (watermarkedImageUrl && watermarkedImageUrl.value) {
        console.log('watermarkedImageUrl.value.length:', watermarkedImageUrl.value.length);
      } else {
        console.log('watermarkedImageUrl或watermarkedImageUrl.value未定义');
      }

      // 模拟保存操作的核心步骤
      if (allFields && allFields.value && Array.isArray(allFields.value)) {
        const selectedField = allFields.value.find(field => field.id === targetFieldId.value);
        console.log('找到选中的字段:', selectedField);
      }

      console.log('测试完成');
      alert('测试完成，请查看控制台输出');
    } catch (error) {
      console.error('测试中捕获到错误:', error);
      alert(`测试失败: ${error.message}\n\n详细信息请查看控制台`);
    }
  }

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
  const watermarkSize = ref(48); // 减小默认水印大小
  const watermarkColor = ref('#FF0000');
  const watermarkOpacity = ref(0.5);
  const watermarkPosition = ref('center'); // center, top-left, top-right, bottom-left, bottom-right, custom
  const watermarkX = ref(50); // 横向位置(%)
  const watermarkY = ref(50); // 纵向位置(%)
  const watermarkedImageUrl = ref('');
  const watermarkPreviewUrl = ref(''); // 添加水印预览URL

  // 目标字段相关状态
  const targetFieldId = ref('');
  const targetFieldList = ref([]);
  const allFields = ref([]); // 存储所有字段信息，供验证使用
  const saveLogs = ref([]); // 存储保存操作的日志信息

  // 获取所有字段列表
  async function getTargetFields() {
    if (databaseId.value && viewId.value) {
      try {
        const table = await base.getTable(databaseId.value);
        const view = await table.getViewById(viewId.value);
        const fields = await view.getFieldMetaList();
        
        // 保存所有字段信息，供后续验证使用
        allFields.value = fields;
        
        // 显示所有字段供用户选择
        targetFieldList.value = fields;
        console.log('获取到的字段数量:', fields.length);
      } catch (error) {
        console.error('获取字段列表失败:', error);
      }
    }
  }

  // 刷新字段列表
  async function refreshFields() {
    alert('正在刷新字段列表...');
    await getTargetFields();
    alert(`刷新完成，共找到 ${targetFieldList.length} 个字段`);
  }

  // 保存带水印的图片到指定字段
  async function saveWatermarkedImage() {
    try {
      console.log('===== 保存开始 =====', new Date().toISOString());
      addSaveLog('开始保存带水印的图片...');

      // 基本验证
      if (!targetFieldId?.value) {
        alert('请选择目标字段');
        return;
      }
      if (!recordId?.value) {
        alert('请先在表格中选择一行');
        return;
      }
      if (!watermarkedImageUrl?.value) {
        alert('请先生成水印图片');
        return;
      }
      if (!databaseId?.value) {
        alert('数据库ID未定义');
        return;
      }

      addSaveLog('开始转换图片为Blob...');
      
      // 检查水印图片URL是否有效
      if (!watermarkedImageUrl.value || !watermarkedImageUrl.value.startsWith('data:image/')) {
        throw new Error('水印图片URL无效，请重新生成水印');
      }
      
      console.log('水印图片URL长度:', watermarkedImageUrl.value.length);
      console.log('水印图片URL前缀:', watermarkedImageUrl.value.substring(0, 50));
      
      // 转换图片为Blob - 使用更安全的方法
      const dataURLToBlob = (dataURL) => {
        try {
          // 验证data URL格式
          if (!dataURL.includes(',')) {
            throw new Error('无效的data URL格式');
          }
          
          const arr = dataURL.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          if (!mimeMatch) {
            throw new Error('无法解析MIME类型');
          }
          
          const mime = mimeMatch[1];
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          
          for (let i = 0; i < bstr.length; i++) {
            u8arr[i] = bstr.charCodeAt(i);
          }
          
          const blob = new Blob([u8arr], { type: mime });
          console.log('Blob创建详情:', {
            size: blob.size,
            type: blob.type,
            mime: mime,
            dataLength: arr[1].length
          });
          
          return blob;
        } catch (error) {
          console.error('Blob转换错误:', error);
          throw new Error(`Blob转换失败: ${error.message}`);
        }
      };

      const blob = dataURLToBlob(watermarkedImageUrl.value);
      if (!blob || blob.size === 0) {
        throw new Error('Blob转换失败或文件为空');
      }
      
      addSaveLog(`Blob转换成功，大小: ${Math.round(blob.size/1024)}KB`);
      console.log('Blob详情:', { size: blob.size, type: blob.type });

      // 获取表格和字段
      addSaveLog('获取表格和字段...');
      const table = await base.getTable(databaseId.value);
      const attachmentField = await table.getFieldById(targetFieldId.value);
      
      if (!attachmentField) {
        throw new Error('无法获取目标字段');
      }
      
      addSaveLog(`字段获取成功: ${attachmentField.name || '未知字段'}`);
      console.log('字段信息:', { id: attachmentField.id, type: attachmentField.type, name: attachmentField.name });

      // 检查字段类型
      const isAttachmentType = attachmentField.type === 'attachment' || attachmentField.type === 17 || attachmentField.type === 11;
      if (!isAttachmentType) {
        alert(`所选字段不是附件类型，当前类型: ${attachmentField.type}`);
        return;
      }

      // 使用附件字段的setValue方法直接保存
      addSaveLog('开始使用附件字段的setValue方法保存...');
      
      // 验证Blob在上传前是否有效
      if (!blob || blob.size === 0) {
        throw new Error('Blob无效，无法上传');
      }
      
      console.log('上传前Blob验证:', {
        size: blob.size,
        type: blob.type,
        isValid: blob instanceof Blob
      });

      // 将Blob转换为File对象
      const file = new File([blob], `watermarked_${Date.now()}.png`, { 
        type: blob.type || 'image/png' 
      });
      
      console.log('File对象详情:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // 直接使用附件字段的setValue方法，让SDK处理文件上传
      const result = await attachmentField.setValue(recordId.value, file);

      if (result) {
        addSaveLog('保存成功！', 'success');
        alert('水印图片保存成功！');
        
        // 验证保存结果
        setTimeout(async () => {
          try {
            const savedValue = await attachmentField.getValue(recordId.value);
            console.log('保存后的附件值:', savedValue);
            if (savedValue && Array.isArray(savedValue) && savedValue.length > 0) {
              addSaveLog('附件保存验证成功', 'success');
            } else {
              addSaveLog('附件保存验证失败', 'error');
            }
          } catch (verifyError) {
            console.error('验证保存结果失败:', verifyError);
            addSaveLog('验证保存结果失败', 'error');
          }
        }, 2000);
        
      } else {
        throw new Error('保存失败，返回false');
      }

    } catch (error) {
      console.error('保存失败:', error);
      addSaveLog(`保存失败: ${error.message}`, 'error');
      alert(`保存失败: ${error.message}`);
    } finally {
      console.log('===== 保存结束 =====', new Date().toISOString());
    }
  }


  // 添加保存日志的辅助函数
  function addSaveLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    saveLogs.value.push({
      timestamp,
      message,
      type
    });
  }

  // 监听数据表和视图变化，更新目标字段列表
  watch([databaseId, viewId], getTargetFields);

  // 添加水印到图片
  function addWatermarkToImage(imgUrl) {
    return new Promise((resolve, reject) => {
      if (!imgUrl) {
        reject(new Error('图片URL为空'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = function() {
        try {
          console.log('图片加载成功:', { width: img.width, height: img.height });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // 设置canvas尺寸与图片一致
          canvas.width = img.width;
          canvas.height = img.height;

          // 绘制原图
          ctx.drawImage(img, 0, 0);

          // 设置水印样式
          // 限制水印大小不超过图片宽度的20%
          const maxWatermarkSize = Math.min(watermarkSize.value, img.width * 0.2);
          ctx.font = `${maxWatermarkSize}px ${watermarkFont.value}`;
          ctx.fillStyle = watermarkColor.value;
          ctx.globalAlpha = watermarkOpacity.value;

          // 计算水印位置和样式
          let x, y;
          switch(watermarkPosition.value) {
            case 'custom':
              x = (watermarkX.value / 100) * canvas.width;
              y = (watermarkY.value / 100) * canvas.height;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              break;
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
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
          }

          // 绘制水印
          ctx.fillText(watermarkText.value, x, y);

          // 返回带水印的图片URL
          const dataUrl = canvas.toDataURL('image/png');
          
          // 验证生成的data URL
          if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
            throw new Error('生成的data URL格式无效');
          }
          
          console.log('水印图片生成成功:', {
            dataUrlLength: dataUrl.length,
            startsWithData: dataUrl.startsWith('data:image/png;base64,')
          });
          
          // 更新预览URL
          watermarkPreviewUrl.value = dataUrl;
          resolve(dataUrl);
        } catch (error) {
          console.error('水印生成错误:', error);
          reject(error);
        }
      };
      
      img.onerror = function() {
        console.error('图片加载失败:', imgUrl);
        reject(new Error('图片加载失败'));
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
    // 初始化目标字段列表
    await getTargetFields();
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
      </div>

      <!-- 目标字段选择和保存按钮 -->
      <div class="setting-item" style="margin-top: 20px;">
        <label>{{ $t('label.target_field') }}:</label>
        <select v-model="targetFieldId">
          <option value="">-- {{ $t('placeholder.field') }} --</option>
          <option v-for="field in targetFieldList" :key="field.id" :value="field.id">{{ field.name }}</option>
        </select>
      </div>
      <button @click="saveWatermarkedImage" class="save-button">{{ $t('label.save_watermarked_image') }}</button>

    <!-- 测试按钮 -->
    <button class="test-btn" @click="testForLengthError">
      测试长度错误
    </button>

      <div class="debug-info">
        <p>图片URL: {{ imageUrl }}</p>
        <p>是否为图片附件: {{ isImageAttachment }}</p>
        <p>目标字段ID: {{ targetFieldId }}</p>
        <h4>字段调试信息</h4>
        <p>数据库ID: {{ databaseId.value }}</p>
        <p>视图ID: {{ viewId.value }}</p>
        <p>记录ID: {{ recordId }}</p>
        <p>目标字段列表长度: {{ targetFieldList.length }}</p>
        <div v-if="targetFieldList.length > 0">
          <p>筛选出的字段列表:</p>
          <ul>
            <li v-for="field in targetFieldList" :key="field.id">
              {{ field.name }} (ID: {{ field.id }}, 类型: {{ field.type }})
            </li>
          </ul>
        </div>
        <div v-else>
          <p>未找到附件字段，请检查字段筛选条件</p>
        </div>
        <button @click="refreshFields" class="debug-button">刷新字段列表</button>

        <h4>保存日志</h4>
        <div class="save-log" v-if="saveLogs && saveLogs.length > 0">
          <p v-for="log in saveLogs" :key="log.timestamp" :class="log.type === 'error' ? 'error-log' : ''">
            {{ log.timestamp }}: {{ log.message }}
          </p>
        </div>
        <p v-else>暂无保存记录</p>
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

.save-button {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: rgb(20, 86, 240);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-button:hover {
  background-color: rgb(15, 70, 200);
}

.test-btn {
  margin-top: 10px;
  margin-left: 10px;
  padding: 8px 16px;
  background-color: #ff7a45;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-btn:hover {
  background-color: #ff9a6b;
}

.debug-button {
  margin-top: 10px;
  padding: 6px 12px;
  background-color: #f0ad4e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.debug-button:hover {
  background-color: #ec971f;
}

.save-log {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.error-log {
  color: #f56c6c;
  font-weight: bold;
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
