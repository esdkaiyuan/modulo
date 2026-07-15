<script setup lang="ts">
const tools = [
  { route: 'image', icon: '▣', title: 'Image Converter', desc: '将 PNG / JPG / BMP / WebP 图片转换为单色、RGB565 或 16 色调色板 C 数组,支持亮度、对比度、阈值与抖动调节。' },
  { route: 'video', icon: '▶', title: 'Video Extractor', desc: '从视频按时间范围与采样帧率抽帧,批量转换为多帧 1bpp 点阵数据,可实时播放预览。' },
  { route: 'animation', icon: '◧', title: 'Animation Frames', desc: '解码 GIF 动画,按帧范围与步长取模,输出帧数据与逐帧延时表。' },
  { route: 'font', icon: '字', title: 'Font Extractor', desc: '汉字 / 字符点阵字模生成,支持多字符字模表、自定义 TTF 字体、加粗斜体与反相。' },
  { route: 'batch', icon: '≣', title: 'Batch Processor', desc: '批量导入多张图片,统一参数一键取模,合并输出全部 C 数组。' },
  { route: 'handdraw', icon: '✎', title: 'Pixel Editor', desc: '手绘像素画编辑器:画笔、橡皮、填充、取色、对称镜像与撤销重做,导出 C 数组 / HEX / BIN。' }
];

function launch(route: string) {
  window.location.hash = `#/${route}`;
}
</script>

<template>
  <div class="home">
    <div class="home-hero">
      <h1>Dot Matrix Studio</h1>
      <p>All-in-One Dot Matrix Solution — 六合一嵌入式取模工具箱</p>
    </div>
    <div class="home-grid">
      <article v-for="tool in tools" :key="tool.route" class="tool-card">
        <span class="card-icon">{{ tool.icon }}</span>
        <h2>{{ tool.title }}</h2>
        <p>{{ tool.desc }}</p>
        <button class="launch-btn" :data-test="`launch-${tool.route}`" @click="launch(tool.route)">
          Launch →
        </button>
      </article>
    </div>
  </div>
</template>
