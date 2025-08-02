// 图片缓存工具
class ImageCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 50; // 最大缓存数量
  }

  // 生成缓存键
  generateKey(imgUrl, watermarkSettings) {
    const settings = JSON.stringify(watermarkSettings);
    return `${imgUrl}_${settings}`;
  }

  // 获取缓存
  get(imgUrl, watermarkSettings) {
    const key = this.generateKey(imgUrl, watermarkSettings);
    return this.cache.get(key);
  }

  // 设置缓存
  set(imgUrl, watermarkSettings, watermarkedImageUrl) {
    const key = this.generateKey(imgUrl, watermarkSettings);
    
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, watermarkedImageUrl);
  }

  // 清除缓存
  clear() {
    this.cache.clear();
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

export const imageCache = new ImageCache(); 