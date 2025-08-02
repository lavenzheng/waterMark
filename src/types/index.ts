// 水印设置类型
export interface WatermarkSettings {
  text: string;
  font: string;
  size: number;
  color: string;
  opacity: number;
  position: string;
  x: number;
  y: number;
  source: 'custom' | 'field';
  fieldId?: string;
  fieldValue?: string;
}

// 字段信息类型
export interface FieldInfo {
  id: string;
  name: string;
  type: number;
  property?: any;
}

// 保存日志类型
export interface SaveLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

// 图片处理结果类型
export interface ImageProcessResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
  size?: number;
}

// 缓存统计类型
export interface CacheStats {
  size: number;
  maxSize: number;
}

// 错误信息类型
export interface ErrorInfo {
  message: string;
  context: string;
  timestamp: string;
  stack?: string;
} 