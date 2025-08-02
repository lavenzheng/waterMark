// 统一错误处理工具
export class ErrorHandler {
  static handle(error, context = '') {
    console.error(`[${context}] 错误:`, error);
    
    // 根据错误类型提供不同的处理
    if (error.message.includes('网络')) {
      return '网络连接失败，请检查网络设置';
    } else if (error.message.includes('权限')) {
      return '权限不足，请检查插件权限设置';
    } else if (error.message.includes('图片')) {
      return '图片处理失败，请检查图片格式';
    } else if (error.message.includes('字段')) {
      return '字段操作失败，请检查字段类型';
    } else {
      return `操作失败: ${error.message}`;
    }
  }

  static async wrapAsync(fn, context = '') {
    try {
      return await fn();
    } catch (error) {
      const message = this.handle(error, context);
      throw new Error(message);
    }
  }
}

// 全局错误监听器
export function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    console.error('全局错误:', {
      message: event.error?.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      timestamp: new Date().toISOString()
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', {
      reason: event.reason,
      timestamp: new Date().toISOString()
    });
  });
} 