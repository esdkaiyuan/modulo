<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <span class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" stroke-width="2"/>
            <rect x="6" y="6" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="12" y="6" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="18" y="6" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="6" y="12" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="18" y="12" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="6" y="18" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="12" y="18" width="4" height="4" rx="1" fill="currentColor"/>
            <rect x="18" y="18" width="4" height="4" rx="1" fill="currentColor"/>
          </svg>
        </span>
        <div class="logo-text">
          <h1>字库取模工具</h1>
          <p>物联网显示设备点阵字库生成器</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="showHistory = !showHistory">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          历史记录
        </button>
        <button class="action-btn" @click="showHelp = !showHelp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          使用说明
        </button>
      </div>
    </header>

    <div class="main-content">
      <aside class="sidebar">
        <div class="nav-menu">
          <div 
            class="nav-item" 
            :class="{ active: currentTab === 'text' }"
            @click="currentTab = 'text'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4,7 4,4 20,4 20,7"/>
              <line x1="9" y1="20" x2="15" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
            文本/汉字取模
          </div>
          <div 
            class="nav-item" 
            :class="{ active: currentTab === 'image' }"
            @click="currentTab = 'image'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            图片取模
          </div>
          <div 
            class="nav-item" 
            :class="{ active: currentTab === 'batch' }"
            @click="currentTab = 'batch'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            批量取模
          </div>
          <div 
            class="nav-item" 
            :class="{ active: currentTab === 'animatedImage' }"
            @click="switchMediaTab('animatedImage')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8" cy="8" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            动图取模
          </div>
          <div 
            class="nav-item" 
            :class="{ active: currentTab === 'video' }"
            @click="switchMediaTab('video')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            视频取模
          </div>
          <div 
            class="nav-item" 
            :class="{ active: currentTab === 'draw' }"
            @click="currentTab = 'draw'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
            手绘取模
          </div>
        </div>

        <ModuloSettingsPanel
          v-model:preset-id="presetId"
          v-model:width="width"
          v-model:height="height"
          v-model:color-format="colorFormat"
          v-model:output-format="outputFormat"
          v-model:resize-mode="resizeMode"
          v-model:scan-mode="scanMode"
          v-model:encoding-mode="encodingMode"
          v-model:byte-order="byteOrder"
          v-model:rotation="rotation"
          v-model:flip-x="flipX"
          v-model:flip-y="flipY"
          :preset-options="presetOptions"
          @apply-preset="applyPresetById"
        >
          <template #font-settings>
            <div class="config-item">
              <label>字体大小</label>
              <input type="range" v-model.number="fontSize" :min="8" :max="height" :step="1">
              <span class="range-value">{{ fontSize }}px</span>
            </div>

            <div class="config-item">
              <label>字体选择</label>
              <select v-model="fontFamily">
                <option value="sans-serif">无衬线字体 (Sans-serif)</option>
                <option value="serif">衬线字体 (Serif)</option>
                <option value="monospace">等宽字体 (Monospace)</option>
                <option value="Microsoft YaHei">微软雅黑</option>
                <option value="SimSun">宋体</option>
                <option value="SimHei">黑体</option>
                <option value="KaiTi">楷体</option>
                <option value="FangSong">仿宋</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="custom">自定义字体</option>
              </select>
            </div>

            <div class="config-item" v-if="fontFamily === 'custom'">
              <label>自定义字体名称</label>
              <input type="text" v-model="customFont" placeholder="输入字体名称，如：'PingFang SC'">
            </div>
          </template>
        </ModuloSettingsPanel>      </aside>

      <main class="content-area">
        <!-- 文本取模 -->
        <div v-if="currentTab === 'text'" class="tab-content">
          <div class="input-section">
            <div class="section-header">
              <h2>文本/汉字取模</h2>
              <p class="section-desc">输入文字生成点阵数据，支持中英文、数字、符号</p>
            </div>

            <div class="form-group">
              <label>输入文本</label>
              <textarea 
                v-model="inputText" 
                placeholder="请输入要取模的文字（如：你好World）"
                rows="3"
              ></textarea>
            </div>

            <button class="primary-btn" @click="generateTextModulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
              </svg>
              生成点阵
            </button>
          </div>

          <div class="result-section" v-if="textResult.length > 0">
            <div class="section-header">
              <h2>取模结果</h2>
              <div class="result-actions">
                <button class="small-btn" @click="copyResult('c')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  复制C代码
                </button>
                <button class="small-btn" @click="copyResult('bin')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  复制二进制
                </button>
                <button class="small-btn" @click="exportCFile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  导出C文件
                </button>
              </div>
            </div>

            <div class="char-results">
              <div v-for="(char, index) in textResult" :key="index" class="char-item">
                <div class="char-header">
                  <span class="char-preview">{{ char.text }}</span>
                  <span class="char-info">Unicode: {{ char.unicode }}</span>
                </div>
                <div class="matrix-preview">
                  <canvas 
                    ref="matrixCanvas"
                    :width="width" 
                    :height="height"
                    @click="togglePixel(index, $event)"
                  ></canvas>
                </div>
                <div class="char-data">
                  <div class="data-tabs">
                    <button 
                      class="tab-btn" 
                      :class="{ active: char.activeTab === 'hex' }"
                      @click="char.activeTab = 'hex'"
                    >
                      十六进制
                    </button>
                    <button 
                      class="tab-btn" 
                      :class="{ active: char.activeTab === 'bin' }"
                      @click="char.activeTab = 'bin'"
                    >
                      二进制
                    </button>
                    <button 
                      class="tab-btn" 
                      :class="{ active: char.activeTab === 'c' }"
                      @click="char.activeTab = 'c'"
                    >
                      C代码
                    </button>
                  </div>
                  <div class="data-content">
                    <pre v-if="char.activeTab === 'hex'">{{ char.hexData }}</pre>
                    <pre v-else-if="char.activeTab === 'bin'">{{ char.binData }}</pre>
                    <pre v-else>{{ char.cCode }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 图片取模 -->
        <div v-if="currentTab === 'image'" class="tab-content">
          <div class="input-section">
            <div class="section-header">
              <h2>图片取模</h2>
              <p class="section-desc">上传图片生成点阵数据，支持单色和彩色取模</p>
            </div>

            <div class="upload-area" @click="$refs.fileInput.click()" @dragover.prevent @drop.prevent="handleDrop">
              <input 
                type="file" 
                ref="fileInput" 
                accept="image/*" 
                @change="handleImageUpload"
                style="display: none"
              >
              <div class="upload-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17,8 12,3 7,8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>点击或拖拽上传图片</p>
                <p class="upload-hint">支持 PNG、JPG、BMP 格式</p>
              </div>
            </div>

            <div class="image-options" v-if="uploadedImage">
              <div class="option-group">
                <label>取模类型</label>
                <div class="radio-group">
                  <label>
                    <input type="radio" v-model="imageMode" value="mono">
                    单色取模
                  </label>
                  <label>
                    <input type="radio" v-model="imageMode" value="color">
                    彩色取模
                  </label>
                </div>
              </div>

              <div class="option-group" v-if="imageMode === 'mono' || Number(colorDepth) === 1">
                <label>二值化阈值</label>
                <input type="range" v-model.number="threshold" min="0" max="255" :step="1">
                <span class="range-value">{{ threshold }}</span>
              </div>

              <div class="option-group" v-if="imageMode === 'color'">
                <label>颜色深度</label>
                <select v-model="colorDepth">
                  <option value="1">1位（2色）</option>
                  <option value="4">4位（16色）</option>
                  <option value="8">8位（256色）</option>
                  <option value="16">16位（65536色）</option>
                </select>
              </div>
            </div>

            <button class="primary-btn" @click="generateImageModulo" :disabled="!uploadedImage">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
              </svg>
              生成点阵
            </button>
          </div>

          <div class="result-section" v-if="imageResult">
            <div class="section-header">
              <h2>取模结果</h2>
              <div class="result-actions">
                <button class="small-btn" @click="copyResult('c')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  复制C代码
                </button>
                <button class="small-btn" @click="exportCFile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  导出C文件
                </button>
              </div>
            </div>

            <div class="image-result">
              <div class="preview-area">
                <h4>原图预览</h4>
                <img :src="uploadedImage" class="source-image">
              </div>
              <div class="preview-area">
                <h4>点阵预览</h4>
                <canvas ref="imageCanvas" class="result-canvas"></canvas>
                <div class="batch-size">
                  {{ imageResult.bytesPerFrame }} bytes · {{ imageResult.modeLabel }}
                </div>
              </div>
            </div>

            <div class="data-output">
              <div class="data-tabs">
                <button 
                  class="tab-btn" 
                  :class="{ active: imageActiveTab === 'hex' }"
                  @click="imageActiveTab = 'hex'"
                >
                  十六进制
                </button>
                <button 
                  class="tab-btn" 
                  :class="{ active: imageActiveTab === 'bin' }"
                  @click="imageActiveTab = 'bin'"
                >
                  二进制
                </button>
                <button 
                  class="tab-btn" 
                  :class="{ active: imageActiveTab === 'c' }"
                  @click="imageActiveTab = 'c'"
                >
                  C代码
                </button>
              </div>
              <div class="data-content">
                <pre v-if="imageActiveTab === 'hex'">{{ imageResult.hexData }}</pre>
                <pre v-else-if="imageActiveTab === 'bin'">{{ imageResult.binData }}</pre>
                <pre v-else>{{ imageResult.cCode }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 动图/视频取模 -->
        <div v-if="isMediaTab" class="tab-content">
          <div class="input-section">
            <div class="section-header">
              <h2>{{ currentMediaLabel }}</h2>
              <p class="section-desc">{{ currentMediaDescription }}</p>
            </div>

            <div class="upload-area" @click="$refs.mediaFileInput.click()" @dragover.prevent @drop.prevent="handleMediaDrop">
              <input 
                type="file" 
                ref="mediaFileInput" 
                :accept="currentMediaAccept"
                @change="handleMediaUpload"
                style="display: none"
              >
              <div class="upload-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <p>点击或拖拽上传{{ currentMediaUploadName }}</p>
                <p class="upload-hint">{{ currentMediaHint }}</p>
              </div>
            </div>

            <div class="media-file-info" v-if="mediaFile">
              <span>{{ mediaFile.name }}</span>
              <span>{{ formatFileSize(mediaFile.size) }}</span>
              <span>{{ mediaType || '未知类型' }}</span>
            </div>

            <div class="image-options" v-if="mediaFile">
              <div class="option-group">
                <label>取模类型</label>
                <div class="radio-group">
                  <label>
                    <input type="radio" v-model="imageMode" value="mono">
                    单色取模
                  </label>
                  <label>
                    <input type="radio" v-model="imageMode" value="color">
                    彩色取模
                  </label>
                </div>
              </div>

              <div class="option-group" v-if="imageMode === 'mono' || Number(colorDepth) === 1">
                <label>二值化阈值</label>
                <input type="range" v-model.number="threshold" min="0" max="255" :step="1">
                <span class="range-value">{{ threshold }}</span>
              </div>

              <div class="option-group" v-if="imageMode === 'color'">
                <label>颜色深度</label>
                <select v-model="colorDepth">
                  <option value="1">1位（2色）</option>
                  <option value="4">4位（16色）</option>
                  <option value="8">8位（256色）</option>
                  <option value="16">16位（65536色）</option>
                </select>
              </div>

              <div class="option-group">
                <label>抽帧模式</label>
                <select v-model="mediaExtractionMode">
                  <option value="fps">按帧率</option>
                  <option value="max">按最大帧数</option>
                  <option value="fpsAndMax">帧率 + 最大帧数</option>
                </select>
              </div>

              <div class="option-group" v-if="mediaExtractionMode === 'fps' || mediaExtractionMode === 'fpsAndMax'">
                <label>抽帧帧率</label>
                <input type="range" v-model.number="mediaFps" min="1" max="30" :step="1">
                <span class="range-value">{{ mediaFps }} fps</span>
              </div>

              <div class="option-group" v-if="mediaExtractionMode === 'max' || mediaExtractionMode === 'fpsAndMax'">
                <label>最大帧数</label>
                <input type="range" v-model.number="mediaMaxFrames" min="1" max="256" :step="1">
                <span class="range-value">{{ mediaMaxFrames }} 帧</span>
              </div>

              <div class="option-group">
                <label>帧间隔</label>
                <div class="media-delay-row">
                  <label class="switch-label">
                    <input type="checkbox" v-model="mediaUseCustomDelay">
                    <span class="switch-slider"></span>
                  </label>
                  <input 
                    type="number" 
                    v-model.number="mediaFrameDelay" 
                    min="10" 
                    max="5000"
                    :disabled="!mediaUseCustomDelay"
                  >
                  <span class="range-value">ms</span>
                </div>
              </div>

              <div class="media-warning" v-if="mediaFps > 15 || mediaMaxFrames > 128">
                当前设置可能生成较大的数据量，建议降低帧率或最大帧数。
              </div>

              <div class="media-estimate">
                预计单帧 {{ mediaBytesPerFrame }} bytes，最多约 {{ mediaEstimatedBytes }} bytes
              </div>
            </div>

            <div class="media-progress" v-if="mediaStatus !== 'idle' && mediaStatus !== 'complete'">
              <div class="progress-header">
                <span>{{ mediaStatusText }}</span>
                <span>{{ Math.round(mediaProgress * 100) }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: `${Math.round(mediaProgress * 100)}%` }"></div>
              </div>
            </div>

            <div class="media-error" v-if="mediaError">{{ mediaError }}</div>

            <button class="primary-btn" @click="generateMediaModulo" :disabled="!mediaFile || isMediaProcessing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
              </svg>
              {{ isMediaProcessing ? '处理中...' : `生成${currentMediaUploadName}点阵` }}
            </button>
          </div>

          <div class="result-section" v-if="mediaResult">
            <div class="section-header">
              <h2>{{ currentMediaUploadName }}结果（{{ mediaResult.frameCount }} 帧）</h2>
              <div class="result-actions">
                <button class="small-btn" @click="copyMediaResult">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  复制当前格式
                </button>
                <button class="small-btn" @click="exportMediaCFile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  导出.c
                </button>
                <button class="small-btn" @click="exportMediaHeaderFile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  导出.h
                </button>
              </div>
            </div>

            <div class="media-result-layout">
              <div class="preview-area">
                <h4>原媒体预览</h4>
                <video v-if="mediaType.startsWith('video/')" :src="mediaUrl" class="source-image" controls muted></video>
                <img v-else :src="mediaUrl" class="source-image">
              </div>
              <div class="preview-area">
                <h4>点阵动画预览</h4>
                <canvas ref="mediaPreviewCanvas" class="result-canvas"></canvas>
                <div class="batch-size">
                  {{ mediaResult.bytesPerFrame }} bytes/帧 · {{ mediaResult.modeLabel }} · 间隔 {{ mediaResult.frameDelay }}ms
                </div>
              </div>
            </div>

            <div class="media-frame-grid">
              <div v-for="frame in mediaFrames" :key="frame.index" class="media-frame-item">
                <img :src="frame.previewUrl" :alt="`frame ${frame.index}`">
                <span>#{{ frame.index }}</span>
              </div>
            </div>

            <div class="data-output">
              <div class="data-tabs">
                <button class="tab-btn" :class="{ active: mediaActiveTab === 'arrays' }" @click="mediaActiveTab = 'arrays'">
                  逐帧数组
                </button>
                <button class="tab-btn" :class="{ active: mediaActiveTab === 'struct' }" @click="mediaActiveTab = 'struct'">
                  动画结构体
                </button>
                <button class="tab-btn" :class="{ active: mediaActiveTab === 'raw' }" @click="mediaActiveTab = 'raw'">
                  原始十六进制
                </button>
              </div>
              <div class="data-content">
                <pre>{{ getMediaOutputText() }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量取模 -->
        <div v-if="currentTab === 'batch'" class="tab-content">
          <div class="input-section">
            <div class="section-header">
              <h2>批量取模</h2>
              <p class="section-desc">批量生成多个字符的点阵数据</p>
            </div>

            <div class="form-group">
              <label>输入字符集（每行一个字符或一串字符）</label>
              <textarea 
                v-model="batchText" 
                placeholder="输入字符集，如：
0123456789
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
你好世界"
                rows="8"
              ></textarea>
            </div>

            <button class="primary-btn" @click="generateBatchModulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
              </svg>
              批量生成
            </button>
          </div>

          <div class="result-section" v-if="batchResult.length > 0">
            <div class="section-header">
              <h2>批量结果（共 {{ batchResult.length }} 个字符）</h2>
              <div class="result-actions">
                <button class="small-btn" @click="copyBatchResult('c')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  复制全部C代码
                </button>
                <button class="small-btn" @click="exportBatchCFile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  导出完整C文件
                </button>
              </div>
            </div>

            <div class="batch-grid">
              <div v-for="(item, index) in batchResult" :key="index" class="batch-item">
                <div class="batch-char">{{ item.text }}</div>
                <canvas 
                  ref="batchCanvas"
                  :width="width" 
                  :height="height"
                ></canvas>
                <div class="batch-size">
                  {{ item.data.length }} bytes
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 手绘取模 -->
        <div v-if="currentTab === 'draw'" class="tab-content">
          <div class="input-section">
            <div class="section-header">
              <h2>手绘取模</h2>
              <p class="section-desc">用鼠标绘制字符，直接生成点阵数据</p>
            </div>

            <div class="draw-container">
              <div class="draw-toolbar">
                <button 
                  class="tool-btn" 
                  :class="{ active: drawTool === 'pen' }"
                  @click="drawTool = 'pen'"
                  title="画笔工具"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                  </svg>
                  画笔
                </button>
                <button 
                  class="tool-btn" 
                  :class="{ active: drawTool === 'eraser' }"
                  @click="drawTool = 'eraser'"
                  title="橡皮擦工具"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 20H7L3 16c-1.5-1.5-1.5-4 0-5.5L10 4c1.5-1.5 4-1.5 5.5 0L20 9"/>
                    <path d="M17 17l-3-3"/>
                  </svg>
                  橡皮擦
                </button>
                <div class="toolbar-divider"></div>
                <button 
                  class="tool-btn" 
                  @click="undoDraw"
                  :disabled="drawHistory.length === 0"
                  title="撤销"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 7v6h6"/>
                    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
                  </svg>
                  撤销
                </button>
                <button 
                  class="tool-btn" 
                  @click="clearCanvas"
                  title="清空画布"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  清空
                </button>
              </div>

              <div class="canvas-wrapper">
                <canvas 
                  ref="drawCanvas"
                  :width="width * canvasScale"
                  :height="height * canvasScale"
                  @mousedown="startDrawing"
                  @mousemove="draw"
                  @mouseup="stopDrawing"
                  @mouseleave="stopDrawing"
                  @touchstart="handleTouchStart"
                  @touchmove="handleTouchMove"
                  @touchend="stopDrawing"
                ></canvas>
                <div 
                  v-show="showGrid"
                  class="canvas-grid" 
                  :style="{
                    width: width * canvasScale + 'px',
                    height: height * canvasScale + 'px',
                    backgroundSize: canvasScale + 'px ' + canvasScale + 'px'
                  }"
                ></div>
              </div>

              <div class="draw-options">
                <div class="option-row">
                  <label>画笔大小：</label>
                  <input 
                    type="range" 
                    v-model.number="brushSize" 
                    min="1" 
                    max="10" 
                    :step="1"
                  >
                  <span class="range-value">{{ brushSize }}px</span>
                </div>
                <div class="option-row">
                  <label>网格显示：</label>
                  <label class="switch-label">
                    <input type="checkbox" v-model="showGrid">
                    <span class="switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <button class="primary-btn" @click="generateDrawModulo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,11 12,14 22,4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              生成点阵数据
            </button>
          </div>

          <div class="result-section" v-if="drawResult.length > 0">
            <div class="section-header">
              <h2>手绘结果</h2>
              <div class="result-actions">
                <button class="small-btn" @click="copyDrawResult('hex')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  复制
                </button>
                <button class="small-btn" @click="exportDrawCFile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  导出C文件
                </button>
              </div>
            </div>

            <div class="data-output">
              <div class="output-tabs">
                <button 
                  class="tab-btn" 
                  :class="{ active: drawActiveTab === 'hex' }"
                  @click="drawActiveTab = 'hex'"
                >
                  十六进制
                </button>
                <button 
                  class="tab-btn" 
                  :class="{ active: drawActiveTab === 'binary' }"
                  @click="drawActiveTab = 'binary'"
                >
                  二进制
                </button>
                <button 
                  class="tab-btn" 
                  :class="{ active: drawActiveTab === 'c' }"
                  @click="drawActiveTab = 'c'"
                >
                  C代码
                </button>
              </div>

              <div class="output-content">
                <pre v-if="drawActiveTab === 'hex'">{{ formatHexData(drawResult) }}</pre>
                <pre v-if="drawActiveTab === 'binary'">{{ formatBinData(drawResult) }}</pre>
                <pre v-if="drawActiveTab === 'c'">{{ formatDrawCCode(drawResult) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 使用说明弹窗 -->
    <div class="modal" v-if="showHelp" @click.self="showHelp = false">
      <div class="modal-content">
        <h2>使用说明</h2>
        <div class="help-content">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            📖 快速开始
          </h3>
          <ol>
            <li><strong>选择功能模块</strong>：点击左侧导航菜单，选择「文本/汉字取模」、「图片取模」、「批量取模」或「手绘取模」</li>
            <li><strong>配置参数</strong>：在左侧配置面板设置点阵大小、字体、取模方式等参数</li>
            <li><strong>输入内容</strong>：在文本框中输入字符、上传图片文件，或在画布上手绘图形</li>
            <li><strong>生成数据</strong>：点击「生成点阵」按钮，右侧将显示点阵预览和十六进制数据</li>
            <li><strong>导出结果</strong>：点击「复制」按钮复制到剪贴板，或点击「导出C文件」下载代码文件</li>
          </ol>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="2"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="12" y1="2" x2="12" y2="22"/>
            </svg>
            ⚙️ 核心参数详解
          </h3>
          
          <h4>🔢 点阵大小（Width × Height）</h4>
          <ul>
            <li><strong>定义</strong>：点阵的宽度和高度，单位为像素（px）</li>
            <li><strong>范围</strong>：8×8 到 128×128，支持任意尺寸组合</li>
            <li><strong>常用规格</strong>：
              <ul>
                <li>8×8：小型图标、简单符号</li>
                <li>16×16：标准汉字显示（最常用）</li>
                <li>24×24：中等字号，清晰度更高</li>
                <li>32×32：大字号标题、重要提示</li>
                <li>64×64 / 128×128：超大图标、特殊效果</li>
              </ul>
            </li>
            <li><strong>影响</strong>：点阵越大，显示越清晰，但占用存储空间越多</li>
            <li><strong>建议</strong>：根据实际显示设备的分辨率选择合适的尺寸</li>
          </ul>

          <h4>🔤 字体大小（Font Size）</h4>
          <ul>
            <li><strong>定义</strong>：渲染文字时的字号大小，单位为像素</li>
            <li><strong>范围</strong>：8px 到当前点阵高度的最大值</li>
            <li><strong>与点阵关系</strong>：
              <ul>
                <li>字体大小 ≈ 点阵高度：文字填满整个点阵区域</li>
                <li>字体大小 &lt; 点阵高度：文字较小，周围留白较多</li>
                <li>字体大小 &gt; 点阵高度：文字被裁剪，可能显示不完整</li>
              </ul>
            </li>
            <li><strong>建议值</strong>：通常为点阵高度的 70%-90%，例如 16×16 点阵使用 12-14px 字体</li>
          </ul>

          <h4>🎨 字体选择（Font Family）</h4>
          <ul>
            <li><strong>预设字体</strong>：
              <ul>
                <li><strong>无衬线字体（Sans-serif）</strong>：现代简洁，适合屏幕显示（默认推荐）</li>
                <li><strong>衬线字体（Serif）</strong>：传统优雅，笔画有装饰</li>
                <li><strong>等宽字体（Monospace）</strong>：每个字符宽度相同，适合代码显示</li>
                <li><strong>微软雅黑</strong>：Windows 系统默认中文字体，清晰易读</li>
                <li><strong>宋体</strong>：传统印刷字体，横细竖粗</li>
                <li><strong>黑体</strong>：笔画粗细均匀，醒目有力</li>
                <li><strong>楷体</strong>：书法风格，优雅流畅</li>
                <li><strong>仿宋</strong>：介于宋体和楷体之间</li>
                <li><strong>Arial / Times New Roman / Courier New</strong>：经典西文字体</li>
              </ul>
            </li>
            <li><strong>自定义字体</strong>：选择「自定义字体」后，可输入系统中已安装的任意字体名称</li>
            <li><strong>注意事项</strong>：
              <ul>
                <li>不同操作系统支持的字体可能不同</li>
                <li>如果指定字体不存在，浏览器会自动回退到默认字体</li>
                <li>中文显示建议选择中文字体（如微软雅黑、宋体等）</li>
              </ul>
            </li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            🔄 取模方式（Scan Mode）
          </h3>
          <p><strong>作用</strong>：决定如何扫描点阵并转换为字节数据，直接影响生成的十六进制代码</p>
          
          <h4>➡️ 逐行式（Row Scan / Horizontal）</h4>
          <ul>
            <li><strong>扫描顺序</strong>：从左到右，从上到下</li>
            <li><strong>处理方式</strong>：
              <ol>
                <li>从第 1 行开始，每 8 个像素为一组（不足 8 个补 0）</li>
                <li>将这 8 个像素转换为 1 个字节（byte）</li>
                <li>处理完第 1 行后，继续处理第 2 行，依此类推</li>
              </ol>
            </li>
            <li><strong>示例</strong>（16×16 点阵）：
              <ul>
                <li>第 1 行：16 个像素 → 2 个字节</li>
                <li>第 2 行：16 个像素 → 2 个字节</li>
                <li>...</li>
                <li>总共：16 行 × 2 字节 = 32 字节</li>
              </ul>
            </li>
            <li><strong>适用场景</strong>：大多数 OLED/LCD 显示屏（如 SSD1306、ST7735）</li>
            <li><strong>优点</strong>：符合人类阅读习惯，数据处理直观</li>
          </ul>

          <h4>⬇️ 逐列式（Column Scan / Vertical）</h4>
          <ul>
            <li><strong>扫描顺序</strong>：从上到下，从左到右</li>
            <li><strong>处理方式</strong>：
              <ol>
                <li>从第 1 列开始，每 8 个像素为一组（不足 8 个补 0）</li>
                <li>将这 8 个像素转换为 1 个字节</li>
                <li>处理完第 1 列后，继续处理第 2 列，依此类推</li>
              </ol>
            </li>
            <li><strong>示例</strong>（16×16 点阵）：
              <ul>
                <li>第 1 列：16 个像素 → 2 个字节</li>
                <li>第 2 列：16 个像素 → 2 个字节</li>
                <li>...</li>
                <li>总共：16 列 × 2 字节 = 32 字节</li>
              </ul>
            </li>
            <li><strong>适用场景</strong>：某些特殊的 LCD 控制器（如 ILI9341 的部分模式）</li>
            <li><strong>优点</strong>：适合垂直刷新显示的硬件</li>
          </ul>

          <h4>💡 如何选择？</h4>
          <ul>
            <li>查看您的显示模块数据手册，确认支持的扫描方式</li>
            <li>如果不确定，优先尝试「逐行式」，这是最常见的模式</li>
            <li>如果显示的文字方向不对（旋转 90°），切换到另一种模式</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
            🔐 编码方式（Encoding Mode）
          </h3>
          <p><strong>作用</strong>：决定像素点亮灭状态对应的二进制值</p>

          <h4>⚫ 阴码（Negative Code）</h4>
          <ul>
            <li><strong>规则</strong>：1 = 点亮（黑色），0 = 熄灭（白色）</li>
            <li><strong>逻辑</strong>：「有内容」的地方为 1，「空白」的地方为 0</li>
            <li><strong>示例</strong>：字母 "A" 的顶部像素点亮 → 该位为 1</li>
            <li><strong>适用场景</strong>：大多数 OLED 显示屏（SSD1306 系列）</li>
            <li><strong>特点</strong>：符合直觉，「有」= 1，「无」= 0</li>
          </ul>

          <h4>⚪ 阳码（Positive Code）</h4>
          <ul>
            <li><strong>规则</strong>：0 = 点亮（黑色），1 = 熄灭（白色）</li>
            <li><strong>逻辑</strong>：「有内容」的地方为 0，「空白」的地方为 1</li>
            <li><strong>示例</strong>：字母 "A" 的顶部像素点亮 → 该位为 0</li>
            <li><strong>适用场景</strong>：某些 LCD 显示屏、反色显示需求</li>
            <li><strong>特点</strong>：与阴码相反，相当于对阴码数据取反</li>
          </ul>

          <h4>💡 如何选择？</h4>
          <ul>
            <li>优先尝试「阴码」，这是最常用的模式</li>
            <li>如果显示的文字是反色的（黑白颠倒），切换到「阳码」</li>
            <li>阴码和阳码可以互相转换：对所有字节执行按位取反（~操作）即可</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7V4h16v3"/>
              <path d="M9 20h6"/>
              <path d="M12 4v16"/>
            </svg>
            🔢 字节顺序（Byte Order）
          </h3>
          <p><strong>作用</strong>：决定一个字节内 8 个位的排列顺序</p>

          <h4>⬅️ MSB（Most Significant Bit - 高位在前）</h4>
          <ul>
            <li><strong>规则</strong>：从左到右扫描时，左边的像素对应高位（bit 7），右边的像素对应低位（bit 0）</li>
            <li><strong>示例</strong>：8 个像素 [1,0,1,1,0,0,1,0] → 二进制 10110010 → 十六进制 0xB2</li>
            <li><strong>计算</strong>：第 1 个像素 × 2⁷ + 第 2 个像素 × 2⁶ + ... + 第 8 个像素 × 2⁰</li>
            <li><strong>适用场景</strong>：大多数嵌入式系统和显示控制器</li>
          </ul>

          <h4>➡️ LSB（Least Significant Bit - 低位在前）</h4>
          <ul>
            <li><strong>规则</strong>：从左到右扫描时，左边的像素对应低位（bit 0），右边的像素对应高位（bit 7）</li>
            <li><strong>示例</strong>：8 个像素 [1,0,1,1,0,0,1,0] → 二进制 01001101 → 十六进制 0x4D</li>
            <li><strong>计算</strong>：第 1 个像素 × 2⁰ + 第 2 个像素 × 2¹ + ... + 第 8 个像素 × 2⁷</li>
            <li><strong>适用场景</strong>：少数特殊的显示控制器</li>
          </ul>

          <h4>💡 如何选择？</h4>
          <ul>
            <li>优先尝试「MSB」，这是最常用的模式</li>
            <li>如果显示的文字左右镜像翻转，切换到「LSB」</li>
            <li>MSB 和 LSB 可以通过位反转算法互相转换</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            🖼️ 图片取模详解
          </h3>

          <h4>📤 上传步骤</h4>
          <ol>
            <li>点击上传区域或拖拽图片到上传框</li>
            <li>支持的格式：PNG、JPG、JPEG、GIF、BMP、WebP</li>
            <li>图片会自动缩放到配置的点阵大小</li>
            <li>建议在上传前将图片调整为合适的尺寸，以获得最佳效果</li>
          </ol>

          <h4>🎯 单色取模（Monochrome）</h4>
          <ul>
            <li><strong>原理</strong>：将彩色图片转换为黑白二值图像</li>
            <li><strong>处理流程</strong>：
              <ol>
                <li>计算每个像素的灰度值：Gray = (R + G + B) / 3</li>
                <li>与阈值比较：Gray &lt; 阈值 → 点亮（黑色），Gray ≥ 阈值 → 熄灭（白色）</li>
                <li>按照配置的取模方式生成字节数据</li>
              </ol>
            </li>
            <li><strong>阈值调节</strong>：
              <ul>
                <li>阈值越小（如 64）：更多像素被判定为「点亮」，图像更暗</li>
                <li>阈值越大（如 192）：更少像素被判定为「点亮」，图像更亮</li>
                <li>默认值 128：平衡效果，适合大多数图片</li>
              </ul>
            </li>
            <li><strong>适用场景</strong>：单色 OLED/LCD 显示屏、图标、Logo</li>
            <li><strong>优点</strong>：数据量小，处理速度快，兼容性好</li>
          </ul>

          <h4>🌈 彩色取模（Color）</h4>
          <ul>
            <li><strong>原理</strong>：保留图片的颜色信息，每个像素用多个字节表示</li>
            <li><strong>色彩深度选项</strong>：
              <ul>
                <li><strong>8 位（256 色）</strong>：每个像素 1 字节，适合低端彩屏</li>
                <li><strong>16 位（65536 色）</strong>：每个像素 2 字节，RGB565 格式，最常用</li>
                <li><strong>24 位（真彩色）</strong>：每个像素 3 字节，RGB888 格式，高质量</li>
              </ul>
            </li>
            <li><strong>数据格式</strong>：
              <ul>
                <li>RGB565：R(5位) + G(6位) + B(5位) = 16 位</li>
                <li>RGB888：R(8位) + G(8位) + B(8位) = 24 位</li>
              </ul>
            </li>
            <li><strong>适用场景</strong>：彩色 TFT LCD、IPS 屏幕、需要显示照片的场景</li>
            <li><strong>注意</strong>：彩色取模数据量较大，16×16 的 16 位彩色需要 512 字节</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
            ✍️ 手绘取模详解
          </h3>
          <p><strong>作用</strong>：通过鼠标或触摸屏直接绘制字符，适合自定义图标、特殊符号、手写字体等场景</p>

          <h4>🎨 工具栏功能</h4>
          
          <h5>✏️ 画笔工具（Pen）</h5>
          <ul>
            <li><strong>功能</strong>：在画布上绘制黑色像素点</li>
            <li><strong>使用方式</strong>：
              <ol>
                <li>点击「画笔」按钮选择画笔工具</li>
                <li>在画布上按住鼠标左键并拖动即可绘制</li>
                <li>支持触摸屏操作（手机/平板）</li>
              </ol>
            </li>
            <li><strong>画笔大小调节</strong>：
              <ul>
                <li>范围：1px - 10px</li>
                <li>默认值：2px</li>
                <li>较大的画笔适合快速填充大面积区域</li>
                <li>较小的画笔适合精细绘制细节</li>
              </ul>
            </li>
          </ul>

          <h5>🧹 橡皮擦工具（Eraser）</h5>
          <ul>
            <li><strong>功能</strong>：擦除已绘制的像素点，恢复为白色背景</li>
            <li><strong>使用方式</strong>：
              <ol>
                <li>点击「橡皮擦」按钮选择橡皮擦工具</li>
                <li>在需要擦除的区域按住鼠标左键并拖动</li>
                <li>橡皮擦大小与画笔大小相同，可通过滑块调节</li>
              </ol>
            </li>
            <li><strong>应用场景</strong>：
              <ul>
                <li>修正绘制错误</li>
                <li>清理多余像素</li>
                <li>创建镂空效果</li>
              </ul>
            </li>
          </ul>

          <h5>↩️ 撤销功能（Undo）</h5>
          <ul>
            <li><strong>功能</strong>：撤销上一次的绘制操作</li>
            <li><strong>使用方式</strong>：点击「撤销」按钮，恢复到上一次操作前的状态</li>
            <li><strong>历史记录</strong>：
              <ul>
                <li>最多保存 20 步操作历史</li>
                <li>每次开始绘制前自动保存当前状态</li>
                <li>可以连续多次撤销</li>
              </ul>
            </li>
            <li><strong>注意</strong>：清空画布也会计入历史记录，可以撤销清空操作</li>
          </ul>

          <h5>🗑️ 清空画布（Clear）</h5>
          <ul>
            <li><strong>功能</strong>：清除画布上的所有内容，恢复为空白状态</li>
            <li><strong>使用方式</strong>：点击「清空」按钮</li>
            <li><strong>效果</strong>：
              <ul>
                <li>所有绘制的像素被清除</li>
                <li>画布恢复为纯白色背景</li>
                <li>如果开启了网格显示，网格会重新绘制</li>
              </ul>
            </li>
            <li><strong>提示</strong>：清空操作可以撤销，不用担心误操作</li>
          </ul>

          <h4>📐 画布与网格</h4>
          
          <h5>🖼️ 画布尺寸</h5>
          <ul>
            <li><strong>实际尺寸</strong>：由左侧配置的「点阵大小」决定（如 16×16、32×32）</li>
            <li><strong>显示尺寸</strong>：每个像素放大 20 倍显示，方便精确绘制</li>
            <li><strong>示例</strong>：
              <ul>
                <li>16×16 点阵 → 画布显示为 320×320 像素</li>
                <li>32×32 点阵 → 画布显示为 640×640 像素</li>
              </ul>
            </li>
            <li><strong>优势</strong>：放大显示便于精细控制每个像素的位置</li>
          </ul>

          <h5>🔲 网格显示</h5>
          <ul>
            <li><strong>功能</strong>：在画布上显示网格线，辅助对齐和定位</li>
            <li><strong>开关方式</strong>：点击「网格显示」旁边的开关按钮</li>
            <li><strong>网格样式</strong>：
              <ul>
                <li>浅灰色细线（#e0e0e0）</li>
                <li>线宽 0.5px，不干扰绘制</li>
                <li>每个网格单元对应一个点阵像素</li>
              </ul>
            </li>
            <li><strong>建议</strong>：
              <ul>
                <li>初学者建议开启网格，便于理解点阵结构</li>
                <li>熟练后可以关闭网格，获得更清晰的视觉效果</li>
              </ul>
            </li>
          </ul>

          <h4>🎯 绘制技巧</h4>
          
          <h5>💡 技巧 1：从简单形状开始</h5>
          <ul>
            <li>先绘制基本几何形状（圆形、方形、三角形）</li>
            <li>熟悉画笔的控制和像素的分布</li>
            <li>逐步过渡到复杂图形</li>
          </ul>

          <h5>💡 技巧 2：利用对称性</h5>
          <ul>
            <li>对于对称图形，可以先绘制一半</li>
            <li>观察整体效果后再补充另一半</li>
            <li>保持图形的平衡和美观</li>
          </ul>

          <h5>💡 技巧 3：善用撤销功能</h5>
          <ul>
            <li>不要害怕犯错，随时可以撤销</li>
            <li>大胆尝试不同的绘制方式</li>
            <li>通过撤销对比不同效果</li>
          </ul>

          <h5>💡 技巧 4：参考现有字库</h5>
          <ul>
            <li>先用「文本取模」生成标准字符</li>
            <li>观察点阵分布规律</li>
            <li>在手绘时参考这些规律</li>
          </ul>

          <h5>💡 技巧 5：分层绘制</h5>
          <ul>
            <li>先绘制轮廓框架</li>
            <li>再填充内部区域</li>
            <li>最后细化边缘和细节</li>
          </ul>

          <h4>⚙️ 生成点阵数据</h4>
          <ul>
            <li><strong>操作步骤</strong>：
              <ol>
                <li>完成绘制后，点击「生成点阵数据」按钮</li>
                <li>系统会自动提取画布上的像素信息</li>
                <li>根据配置的取模方式、编码方式、字节顺序生成数据</li>
                <li>结果显示在下方，支持三种格式查看</li>
              </ol>
            </li>
            <li><strong>数据处理流程</strong>：
              <ol>
                <li>将放大的画布缩小到实际点阵尺寸</li>
                <li>提取每个像素的灰度值</li>
                <li>根据阈值判断点亮/熄灭状态（灰度 &lt; 128 为点亮）</li>
                <li>按照配置的扫描方式转换为字节数据</li>
              </ol>
            </li>
            <li><strong>注意事项</strong>：
              <ul>
                <li>确保绘制的内容清晰可辨</li>
                <li>避免过于复杂的细节（点阵分辨率有限）</li>
                <li>黑色表示点亮，白色表示熄灭</li>
              </ul>
            </li>
          </ul>

          <h4>📤 导出与使用</h4>
          
          <h5>📋 复制数据</h5>
          <ul>
            <li><strong>操作</strong>：点击「复制」按钮</li>
            <li><strong>效果</strong>：当前选中的格式数据复制到剪贴板</li>
            <li><strong>用途</strong>：直接粘贴到代码编辑器中使用</li>
          </ul>

          <h5>📥 导出 C 文件</h5>
          <ul>
            <li><strong>操作</strong>：点击「导出C文件」按钮</li>
            <li><strong>文件名</strong>：自动生成，如 hand_drawn_16x16.c</li>
            <li><strong>文件内容</strong>：
              <pre>// 手绘字符点阵数据 (16x16)
const uint8_t hand_drawn_char[] = {
    0x00, 0x00, 0x18, 0x3C, ...
};</pre>
            </li>
            <li><strong>用途</strong>：直接嵌入嵌入式项目，无需额外处理</li>
          </ul>

          <h4>🎨 应用场景</h4>
          <ul>
            <li><strong>自定义图标</strong>：
              <ul>
                <li>设计独特的 UI 图标</li>
                <li>创建品牌 Logo 的点阵版本</li>
                <li>制作个性化的状态指示符</li>
              </ul>
            </li>
            <li><strong>特殊符号</strong>：
              <ul>
                <li>数学符号、箭头、标记等</li>
                <li>标准字库中不存在的字符</li>
                <li>行业专用符号</li>
              </ul>
            </li>
            <li><strong>手写字体</strong>：
              <ul>
                <li>模拟手写效果的个性化字体</li>
                <li>书法风格的汉字</li>
                <li>艺术字设计</li>
              </ul>
            </li>
            <li><strong>游戏素材</strong>：
              <ul>
                <li>复古游戏的角色 sprite</li>
                <li>道具图标、技能图标</li>
                <li>地图元素、装饰图案</li>
              </ul>
            </li>
            <li><strong>教学演示</strong>：
              <ul>
                <li>直观展示点阵原理</li>
                <li>学生练习字符设计</li>
                <li>理解像素与字节的对应关系</li>
              </ul>
            </li>
          </ul>

          <h4>⚠️ 注意事项</h4>
          <ul>
            <li><strong>分辨率限制</strong>：点阵尺寸较小（通常 8×8 到 32×32），不适合过于复杂的图形</li>
            <li><strong>颜色限制</strong>：仅支持黑白二值，不支持灰度和彩色</li>
            <li><strong>绘制精度</strong>：放大绘制可以提高精度，但最终效果受限于点阵分辨率</li>
            <li><strong>浏览器兼容</strong>：建议使用 Chrome、Edge、Firefox 等现代浏览器</li>
            <li><strong>触摸设备</strong>：支持手机/平板触摸操作，但精度可能不如鼠标</li>
            <li><strong>数据备份</strong>：重要的手绘作品请及时导出保存</li>
          </ul>

          <h4>💡 最佳实践</h4>
          <ul>
            <li>✅ 先在纸上草拟设计，明确要绘制的图形</li>
            <li>✅ 从小尺寸开始（如 16×16），熟悉后再尝试大尺寸</li>
            <li>✅ 定期使用「生成点阵数据」预览效果</li>
            <li>✅ 结合「文本取模」生成的标准字符作为参考</li>
            <li>✅ 善用撤销功能，大胆尝试不同设计</li>
            <li>✅ 完成后导出 C 文件，方便后续使用和修改</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            📋 输出格式说明
          </h3>

          <h4>🔢 十六进制（Hex）</h4>
          <ul>
            <li><strong>格式</strong>：0x00, 0xFF, 0xAA, 0x55...</li>
            <li><strong>特点</strong>：紧凑、直观，便于手动检查和调试</li>
            <li><strong>用途</strong>：直接嵌入 C/C++ 代码数组</li>
          </ul>

          <h4>0️⃣1️⃣ 二进制（Binary）</h4>
          <ul>
            <li><strong>格式</strong>：0b00000000, 0b11111111, 0b10101010...</li>
            <li><strong>特点</strong>：可直接看到每个像素的状态</li>
            <li><strong>用途</strong>：学习和理解取模原理，教学演示</li>
          </ul>

          <h4>💻 C 语言代码</h4>
          <ul>
            <li><strong>格式</strong>：完整的 C 数组定义，包含注释和 Unicode 信息</li>
            <li><strong>示例</strong>：
<pre>// 字符: 你 (Unicode: U+4F60)
const uint8_t font_4F60[] = {
    0x08, 0x30, 0x00, 0x00,
    0x08, 0x30, 0x00, 0x00,
    ...
};</pre>
            </li>
            <li><strong>特点</strong>：可直接复制到项目中编译使用</li>
            <li><strong>用途</strong>：嵌入式项目开发，字库集成</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            💾 导出功能
          </h3>

          <h4>📋 复制到剪贴板</h4>
          <ul>
            <li><strong>操作</strong>：点击「复制」按钮</li>
            <li><strong>效果</strong>：当前选中的格式数据会复制到系统剪贴板</li>
            <li><strong>提示</strong>：复制成功后会显示「✓ 已复制」提示</li>
            <li><strong>粘贴</strong>：可在任何文本编辑器中按 Ctrl+V 粘贴</li>
          </ul>

          <h4>📥 导出 C 文件</h4>
          <ul>
            <li><strong>操作</strong>：点击「导出C文件」按钮</li>
            <li><strong>效果</strong>：自动生成 .c 文件并下载到本地</li>
            <li><strong>文件内容</strong>：
              <ul>
                <li>文件头注释（生成时间、配置参数）</li>
                <li>所有字符的完整 C 代码</li>
                <li>可直接编译使用的数组定义</li>
              </ul>
            </li>
            <li><strong>文件名</strong>：自动生成，如 font_data_20240101_120000.c</li>
            <li><strong>用途</strong>：批量导出字库，方便项目管理</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            💻 嵌入式系统集成指南
          </h3>

          <h4>📦 步骤 1：准备字库文件</h4>
          <ol>
            <li>在本工具中生成所需字符的点阵数据</li>
            <li>点击「导出C文件」下载 .c 文件</li>
            <li>同时创建对应的 .h 头文件，声明外部数组</li>
          </ol>

          <h4>🔧 步骤 2：添加到项目</h4>
          <ol>
            <li>将 .c 和 .h 文件复制到您的嵌入式项目目录</li>
            <li>在需要使用字库的源文件中包含头文件：<code>#include "font_data.h"</code></li>
            <li>确保编译器支持 <code>uint8_t</code> 类型（需包含 <code>&lt;stdint.h&gt;</code>）</li>
          </ol>

          <h4>📝 步骤 3：编写显示函数</h4>
          <pre>void display_char(uint16_t x, uint16_t y, const uint8_t *font_data, 
                  uint8_t width, uint8_t height) {
    // 根据您的显示驱动实现
    // 这里以 SSD1306 OLED 为例
    for (uint8_t row = 0; row &lt; height; row++) {
        for (uint8_t col = 0; col &lt; width; col++) {
            uint8_t byte_index = (row * width + col) / 8;
            uint8_t bit_index = (row * width + col) % 8;
            uint8_t pixel = (font_data[byte_index] &gt;&gt; bit_index) &amp; 0x01;
            
            if (pixel) {
                OLED_DrawPixel(x + col, y + row, WHITE);
            } else {
                OLED_DrawPixel(x + col, y + row, BLACK);
            }
        }
    }
}</pre>

          <h4>🚀 步骤 4：调用显示</h4>
          <pre>// 显示单个字符
display_char(10, 10, font_4F60, 16, 16);  // 显示"你"

// 显示字符串
void display_string(uint16_t x, uint16_t y, const char *str) {
    uint16_t pos_x = x;
    while (*str) {
        // 查找字符对应的字库数据
        const uint8_t *font = find_font_data(*str);
        if (font) {
            display_char(pos_x, y, font, 16, 16);
            pos_x += 16;  // 移动到下一个字符位置
        }
        str++;
    }
}</pre>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            ❓ 常见问题（FAQ）
          </h3>

          <h4>Q1: 为什么显示的文字是乱码或方块？</h4>
          <ul>
            <li><strong>原因</strong>：取模方式、编码方式或字节顺序配置不正确</li>
            <li><strong>解决</strong>：
              <ol>
                <li>尝试切换「逐行式」↔「逐列式」</li>
                <li>尝试切换「阴码」↔「阳码」</li>
                <li>尝试切换「MSB」↔「LSB」</li>
                <li>查看显示模块的数据手册，确认正确的配置</li>
              </ol>
            </li>
          </ul>

          <h4>Q2: 为什么文字显示不完整或被裁剪？</h4>
          <ul>
            <li><strong>原因</strong>：字体大小超过点阵高度</li>
            <li><strong>解决</strong>：减小字体大小，或增大点阵尺寸</li>
            <li><strong>建议</strong>：字体大小设置为点阵高度的 70%-90%</li>
          </ul>

          <h4>Q3: 如何生成完整的 ASCII 字库（0-127）？</h4>
          <ul>
            <li><strong>方法</strong>：使用「批量取模」功能</li>
            <li><strong>步骤</strong>：
              <ol>
                <li>切换到「批量取模」标签</li>
                <li>在文本框中输入所有 ASCII 字符（可使用脚本生成）</li>
                <li>点击「批量生成」</li>
                <li>导出完整的 C 文件</li>
              </ol>
            </li>
          </ul>

          <h4>Q4: 点阵数据太大，如何优化存储空间？</h4>
          <ul>
            <li><strong>方法 1</strong>：减小点阵尺寸（如从 32×32 改为 16×16）</li>
            <li><strong>方法 2</strong>：只生成实际使用的字符，不要生成完整字库</li>
            <li><strong>方法 3</strong>：使用压缩算法（如 RLE 行程编码）</li>
            <li><strong>方法 4</strong>：对于重复字符，只存储一份数据，通过索引引用</li>
          </ul>

          <h4>Q5: 如何在 STM32/Arduino 上使用生成的字库？</h4>
          <ul>
            <li><strong>STM32</strong>：
              <ol>
                <li>将 .c/.h 文件添加到 Keil/IAR/STM32CubeIDE 项目</li>
                <li>在 main.c 中包含头文件</li>
                <li>调用您编写的显示函数</li>
              </ol>
            </li>
            <li><strong>Arduino</strong>：
              <ol>
                <li>将 .c 文件改名为 .cpp（或直接包含 .c 文件）</li>
                <li>在 .ino 文件中包含头文件</li>
                <li>使用 Adafruit_GFX 或其他图形库的 drawBitmap 函数显示</li>
              </ol>
            </li>
          </ul>

          <h4>Q6: 支持哪些编程语言和平台？</h4>
          <ul>
            <li><strong>支持的语言</strong>：C、C++、Python、JavaScript、Java 等</li>
            <li><strong>支持的平台</strong>：
              <ul>
                <li>嵌入式：STM32、Arduino、ESP32、51单片机、AVR、PIC</li>
                <li>桌面：Windows、Linux、macOS</li>
                <li>移动端：Android、iOS</li>
              </ul>
            </li>
            <li><strong>通用性</strong>：生成的十六进制数据是通用的，任何平台都可以使用</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            🎓 进阶技巧
          </h3>

          <h4>💡 技巧 1：预览验证</h4>
          <ul>
            <li>生成点阵后，仔细观察右侧的点阵预览图</li>
            <li>对比原始字符，确认点阵质量</li>
            <li>如果效果不佳，调整字体大小或更换字体类型</li>
          </ul>

          <h4>💡 技巧 2：批量处理</h4>
          <ul>
            <li>使用「批量取模」一次性生成多个字符</li>
            <li>适合生成常用汉字表、ASCII 全集、数字符号集</li>
            <li>导出的 C 文件可直接用于项目，无需逐个复制</li>
          </ul>

          <h4>💡 技巧 3：图片预处理</h4>
          <ul>
            <li>上传前使用图像处理软件（如 Photoshop、GIMP）优化图片</li>
            <li>调整为黑白二值，去除噪点和杂边</li>
            <li>确保图片比例为正方形，避免变形</li>
          </ul>

          <h4>💡 技巧 4：测试验证</h4>
          <ul>
            <li>先在模拟器或小屏幕上测试字库效果</li>
            <li>确认显示正常后再部署到正式项目</li>
            <li>保存多套配置，针对不同显示设备优化</li>
          </ul>

          <h4>💡 技巧 5：性能优化</h4>
          <ul>
            <li>将常用字库存储在 Flash 中，节省 RAM</li>
            <li>使用 DMA 传输提高显示速度</li>
            <li>对于频繁显示的字符，可以缓存到 RAM 中</li>
          </ul>

          <h4>💡 技巧 6：手绘设计</h4>
          <ul>
            <li>利用「手绘取模」功能创建自定义图标和特殊符号</li>
            <li>先在纸上草拟设计，再在画布上精确绘制</li>
            <li>善用撤销功能和网格辅助，提高绘制效率</li>
            <li>结合文本取模生成的标准字符作为参考</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            ⚠️ 注意事项
          </h3>
          <ul>
            <li><strong>浏览器兼容性</strong>：建议使用 Chrome、Edge、Firefox 等现代浏览器</li>
            <li><strong>字体依赖</strong>：自定义字体需要在系统中已安装，否则会自动回退</li>
            <li><strong>图片大小</strong>：过大的图片会导致处理缓慢，建议先缩小再上传</li>
            <li><strong>内存限制</strong>：批量生成大量字符时，注意浏览器内存使用情况</li>
            <li><strong>数据备份</strong>：重要的字库数据请及时导出保存，避免丢失</li>
            <li><strong>硬件差异</strong>：不同显示模块可能需要不同的配置，请以实际测试为准</li>
          </ul>

          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            🎉 总结
          </h3>
          <p>本工具提供了完整的点阵字库生成功能，适用于各种嵌入式显示设备。通过合理配置参数，您可以生成高质量的点阵数据，轻松集成到您的项目中。</p>
          <p><strong>核心要点</strong>：</p>
          <ul>
            <li>✅ 正确配置取模方式、编码方式和字节顺序是关键</li>
            <li>✅ 根据实际需求选择合适的点阵尺寸和字体</li>
            <li>✅ 善用批量处理和导出功能提高工作效率</li>
            <li>✅ 在实际硬件上测试验证，必要时调整参数</li>
          </ul>
          <p style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 100%); border-radius: 8px; text-align: center;">
            <strong>祝您使用愉快！如有问题，欢迎反馈。🚀</strong>
          </p>
        </div>
        <button class="close-btn" @click="showHelp = false">关闭</button>
      </div>
    </div>

    <!-- 历史记录弹窗 -->
    <div class="modal" v-if="showHistory" @click.self="exitHistoryView">
      <div class="modal-content history-modal">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          访问历史记录
        </h2>

        <!-- 密码验证界面 -->
        <div v-if="!isHistoryAuthenticated" class="password-section">
          <div class="password-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3>请输入密码查看历史记录</h3>
          <p class="password-hint">此功能仅供管理员使用，记录所有访客的访问信息</p>
          <div class="password-input-group">
            <input 
              type="password" 
              v-model="historyPassword"
              placeholder="输入密码..."
              @keyup.enter="verifyHistoryPassword"
              class="password-input"
            >
            <button class="primary-btn" @click="verifyHistoryPassword">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              验证
            </button>
          </div>
          <button class="close-btn" @click="exitHistoryView">取消</button>
        </div>

        <!-- 历史记录列表 -->
        <div v-else class="history-section">
          <div class="history-header">
            <div class="history-stats">
              <span class="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                共 {{ visitorRecords.length }} 条记录
              </span>
            </div>
            <div class="history-actions">
              <button class="small-btn danger-btn" @click="clearAllRecords">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                清除记录
              </button>
              <button class="close-btn" @click="exitHistoryView">关闭</button>
            </div>
          </div>

          <div class="history-list" v-if="visitorRecords.length > 0">
            <div v-for="(record, index) in visitorRecords.slice().reverse()" :key="record.id" class="history-item">
              <div class="history-index">{{ visitorRecords.length - index }}</div>
              <div class="history-info">
                <div class="history-ip">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <strong>IP:</strong> {{ record.ip }}
                </div>
                <div class="history-time">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <strong>时间:</strong> {{ record.visitTime }}
                </div>
                <div class="history-ua" v-if="record.userAgent">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  <strong>设备:</strong> {{ record.userAgent }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-history">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <p>暂无访问记录</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 动态水印 -->
    <div class="watermark-container">
      <div class="watermark-grid">
        <div v-for="i in 150" :key="i" class="watermark-text">esdkaiyuan.online</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, watch, computed } from 'vue'
import {
  getImageModuloBytesPerFrame,
  packImageDataByMode,
  renderModuloToRgba,
  imageModeLabel
} from './utils/imageModulo.js'
import {
  formatFrameArraysCode,
  formatAnimationStructCode,
  formatRawHexFrames,
  formatAnimationHeader
} from './utils/animationFormatters.js'
import { extractMediaFrames } from './utils/mediaExtractor.js'
import {
  inferMediaType,
  isSupportedForWorkflow,
  getWorkflowAccept,
  getWorkflowHint,
  getWorkflowLabel
} from './utils/mediaTypes.js'
import ModuloSettingsPanel from './components/ModuloSettingsPanel.vue'
import { useModuloConfig } from './composables/useModuloConfig.js'
import { useModuloResult } from './composables/useModuloResult.js'

// 状态
const currentTab = ref('text')
const showHelp = ref(false)
const showHistory = ref(false)
const historyPassword = ref('')
const isHistoryAuthenticated = ref(false)
const visitorRecords = reactive([])
const HISTORY_PASSWORD = 'esdkaiyuan-ip'

// 配置参数
const {
  presetOptions,
  presetId,
  width,
  height,
  scanMode,
  encodingMode,
  byteOrder,
  threshold,
  imageMode,
  colorDepth,
  colorFormat,
  outputFormat,
  rotation,
  flipX,
  flipY,
  resizeMode,
  applyPresetById,
  getModuloOptions: getSharedModuloOptions
} = useModuloConfig()
const { outputFormatLabels } = useModuloResult()
const fontSize = ref(14)
const fontFamily = ref('sans-serif')
const customFont = ref('')

// 文本取模
const inputText = ref('你好')
const textResult = reactive([])

// 图片取模
const uploadedImage = ref(null)
const imageResult = ref(null)
const imageActiveTab = ref('hex')
const imageCanvas = ref(null)

// 动画/视频取模
const mediaFile = ref(null)
const mediaUrl = ref('')
const mediaType = ref('')
const mediaExtractionMode = ref('fpsAndMax')
const mediaFps = ref(5)
const mediaMaxFrames = ref(64)
const mediaFrameDelay = ref(200)
const mediaUseCustomDelay = ref(false)
const mediaStatus = ref('idle')
const mediaProgress = ref(0)
const mediaError = ref('')
const mediaFrames = reactive([])
const mediaResult = ref(null)
const mediaActiveTab = ref('struct')
const mediaPreviewCanvas = ref(null)

const isMediaTab = computed(() => {
  return currentTab.value === 'animatedImage' || currentTab.value === 'video'
})

const currentMediaWorkflow = computed(() => {
  return currentTab.value === 'video' ? 'video' : 'animatedImage'
})

const currentMediaLabel = computed(() => getWorkflowLabel(currentMediaWorkflow.value))

const currentMediaUploadName = computed(() => {
  return currentMediaWorkflow.value === 'video' ? '视频' : '动图'
})

const currentMediaDescription = computed(() => {
  return currentMediaWorkflow.value === 'video'
    ? '上传 MP4、WebM、MOV 等视频，按帧率抽帧生成点阵动画数据'
    : '上传 GIF、APNG/PNG、WebP 等动图，抽帧生成点阵动画数据'
})

const currentMediaAccept = computed(() => getWorkflowAccept(currentMediaWorkflow.value))
const currentMediaHint = computed(() => getWorkflowHint(currentMediaWorkflow.value))

// 批量取模
const batchText = ref('你好世界\nABC123')
const batchResult = reactive([])

// 手绘取模
const drawCanvas = ref(null)
const drawTool = ref('pen') // 'pen' or 'eraser'
const brushSize = ref(2)
const showGrid = ref(true)
const canvasScale = 20 // Canvas 缩放比例，每个像素显示为 20x20
const isDrawing = ref(false)
const drawHistory = reactive([]) // 撤销历史
const drawResult = reactive([])
const drawActiveTab = ref('hex')

// 监听字体大小变化
watch([width, height], () => {
  fontSize.value = Math.min(fontSize.value, height.value)
})

const isMediaProcessing = computed(() => {
  return ['loading', 'writing', 'extracting', 'converting'].includes(mediaStatus.value)
})

const mediaBytesPerFrame = computed(() => {
  return getImageModuloBytesPerFrame(width.value, height.value, {
    imageMode: imageMode.value,
    colorDepth: colorDepth.value,
    scanMode: scanMode.value
  })
})

const mediaEstimatedBytes = computed(() => {
  return mediaBytesPerFrame.value * mediaMaxFrames.value
})

const mediaStatusText = computed(() => {
  const statusMap = {
    loading: '准备媒体解码',
    writing: '读取媒体文件',
    decoding: '解码媒体帧',
    extracting: '抽取媒体帧',
    converting: '转换点阵数据',
    complete: '处理完成',
    error: '处理失败'
  }
  return statusMap[mediaStatus.value] || '等待处理'
})

const applyMediaWorkflowDefaults = (workflow) => {
  if (workflow === 'video') {
    mediaExtractionMode.value = 'fpsAndMax'
    mediaFps.value = 5
    mediaMaxFrames.value = 64
    mediaUseCustomDelay.value = false
    mediaFrameDelay.value = Math.round(1000 / mediaFps.value)
  } else {
    mediaExtractionMode.value = 'max'
    mediaFps.value = 5
    mediaMaxFrames.value = 64
    mediaUseCustomDelay.value = true
    mediaFrameDelay.value = 200
  }
}

const switchMediaTab = (workflow) => {
  currentTab.value = workflow
  if (mediaFile.value && !isSupportedForWorkflow(mediaFile.value, workflow)) {
    resetMediaResult()
    if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value)
    mediaFile.value = null
    mediaUrl.value = ''
    mediaType.value = ''
  } else {
    resetMediaResult()
  }
  applyMediaWorkflowDefaults(workflow)
}

// ==================== 历史记录功能 ====================

// 获取访客 IP 地址
const getVisitorIP = async () => {
  try {
    // 使用公共 API 获取 IP
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error('获取 IP 失败:', error)
    // 如果获取失败，返回本地标识
    return '127.0.0.1 (本地)'
  }
}

// 记录访客访问
const recordVisitor = async () => {
  const ip = await getVisitorIP()
  const now = new Date()
  
  const record = {
    id: Date.now(),
    ip: ip,
    visitTime: now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }),
    timestamp: now.getTime(),
    userAgent: navigator.userAgent.substring(0, 100) // 截取前100个字符
  }
  
  // 从 localStorage 加载现有记录
  const existingRecords = JSON.parse(localStorage.getItem('visitorRecords') || '[]')
  existingRecords.push(record)
  
  // 只保留最近 100 条记录
  if (existingRecords.length > 100) {
    existingRecords.shift()
  }
  
  // 保存到 localStorage
  localStorage.setItem('visitorRecords', JSON.stringify(existingRecords))
  
  // 更新响应式数据
  visitorRecords.length = 0
  visitorRecords.push(...existingRecords)
}

// 验证密码
const verifyHistoryPassword = () => {
  if (historyPassword.value === HISTORY_PASSWORD) {
    isHistoryAuthenticated.value = true
    historyPassword.value = ''
    loadVisitorRecords()
  } else {
    alert('密码错误！')
    historyPassword.value = ''
  }
}

// 加载访客记录
const loadVisitorRecords = () => {
  const records = JSON.parse(localStorage.getItem('visitorRecords') || '[]')
  visitorRecords.length = 0
  visitorRecords.push(...records)
}

// 清除所有记录
const clearAllRecords = () => {
  if (confirm('确定要清除所有历史记录吗？此操作不可恢复！')) {
    localStorage.removeItem('visitorRecords')
    visitorRecords.length = 0
    alert('历史记录已清除')
  }
}

// 退出查看
const exitHistoryView = () => {
  showHistory.value = false
  isHistoryAuthenticated.value = false
  historyPassword.value = ''
}

// 页面加载时记录访问
recordVisitor()

// 文本取模
const generateTextModulo = async () => {
  if (!inputText.value) {
    alert('请输入文本')
    return
  }

  textResult.length = 0
  const chars = Array.from(inputText.value)

  for (const char of chars) {
    const data = await generateCharMatrix(char)
    if (data) {
      const result = {
        text: char,
        unicode: `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
        data: data,
        hexData: formatHexData(data),
        binData: formatBinData(data),
        cCode: formatCCode(char, data),
        activeTab: 'hex'
      }
      textResult.push(result)
    }
  }

  // 渲染canvas
  await nextTick()
  renderAllCanvas()
}

// 生成字符点阵
const generateCharMatrix = (char) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = width.value
  canvas.height = height.value

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, width.value, height.value)

  ctx.fillStyle = 'black'
  const font = fontFamily.value === 'custom' ? customFont.value : fontFamily.value
  ctx.font = `${fontSize.value}px ${font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, width.value / 2, height.value / 2)

  const imageData = ctx.getImageData(0, 0, width.value, height.value)
  return packImageDataByMode(imageData, width.value, height.value, {
    ...getModuloOptions(),
    imageMode: 'mono',
    colorFormat: 'MONO1'
  })
}
// 格式化数据
const formatHexData = (data) => {
  return data.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')
}

const formatBinData = (data) => {
  return data.map(b => b.toString(2).padStart(8, '0')).join('\n')
}

const formatCCode = (char, data) => {
  const unicode = char.charCodeAt(0)
  const hexData = formatHexData(data)
  return `// 字符: ${char} (Unicode: U+${unicode.toString(16).toUpperCase().padStart(4, '0')})
const uint8_t font_${unicode.toString(16).toUpperCase().padStart(4, '0')}[] = {
    ${hexData}
};`
}

const getModuloOptions = () => ({
  ...getSharedModuloOptions(),
  imageMode: imageMode.value,
  colorDepth: Number(colorDepth.value),
  colorFormat: colorFormat.value,
  scanMode: scanMode.value,
  encodingMode: encodingMode.value,
  byteOrder: byteOrder.value,
  threshold: threshold.value
})

const renderModuloPreviewCanvas = (canvas, data, options = getModuloOptions()) => {
  if (!canvas || !data) return
  const { data: rgba } = renderModuloToRgba(data, width.value, height.value, options)
  const ctx = canvas.getContext('2d')
  const scale = Math.max(2, Math.floor(128 / Math.max(width.value, height.value)))
  const pixelCanvas = document.createElement('canvas')
  const pixelCtx = pixelCanvas.getContext('2d')
  pixelCanvas.width = width.value
  pixelCanvas.height = height.value
  const previewImageData = pixelCtx.createImageData(width.value, height.value)
  previewImageData.data.set(rgba)
  pixelCtx.putImageData(previewImageData, 0, 0)

  canvas.width = width.value * scale
  canvas.height = height.value * scale
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(pixelCanvas, 0, 0, canvas.width, canvas.height)
}

// 渲染canvas
const renderAllCanvas = () => {
  textResult.forEach((item, index) => {
    const canvas = document.querySelectorAll('.char-item canvas')[index]
    if (canvas) {
      const ctx = canvas.getContext('2d')
      const size = Math.min(width.value, height.value)
      const pixelSize = size / Math.max(width.value, height.value)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 根据点阵数据绘制
      for (let i = 0; i < item.data.length; i++) {
        const byte = item.data[i]
        // 简化显示
        const byteIndex = i
        const x = (byteIndex % Math.ceil(width.value / 8)) * 8
        const y = Math.floor(byteIndex / Math.ceil(width.value / 8))

        for (let bit = 0; bit < 8; bit++) {
          const isOn = (byte >> (byteOrder.value === 'msb' ? (7 - bit) : bit)) & 1
          const px = scanMode.value === 'row' ? x + bit : y
          const py = scanMode.value === 'row' ? y : x + bit

          if (px < width.value && py < height.value) {
            ctx.fillStyle = isOn ? 'black' : 'white'
            ctx.fillRect(px * pixelSize, py * pixelSize, pixelSize, pixelSize)
          }
        }
      }
    }
  })
}

// 切换像素
const togglePixel = (index, event) => {
  // 实现像素编辑功能
}

// 图片处理
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const generateImageModulo = () => {
  if (!uploadedImage.value) return

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = width.value
    canvas.height = height.value

    // 绘制并缩放到目标大小
    ctx.drawImage(img, 0, 0, width.value, height.value)

    const imageData = ctx.getImageData(0, 0, width.value, height.value)
    const moduloOptions = getModuloOptions()
    const data = packImageDataByMode(imageData, width.value, height.value, moduloOptions)
    const modeText = imageModeLabel(imageMode.value, colorDepth.value)

    imageResult.value = {
      data: data,
      mode: imageMode.value,
      colorDepth: Number(colorDepth.value),
      modeLabel: modeText,
      bytesPerFrame: getImageModuloBytesPerFrame(width.value, height.value, moduloOptions),
      hexData: formatHexData(data),
      binData: formatBinData(data),
      cCode: `// 图片点阵数据 (${width.value}x${height.value}, ${modeText})
const uint8_t image_data[] = {
    ${formatHexData(data)}
};`
    }

    // 渲染预览
    nextTick(() => {
      renderModuloPreviewCanvas(imageCanvas.value, data, moduloOptions)
    })
  }
  img.src = uploadedImage.value
}

// 动画/视频处理
const resetMediaResult = () => {
  mediaFrames.forEach(frame => {
    if (frame.previewUrl) URL.revokeObjectURL(frame.previewUrl)
  })
  mediaFrames.length = 0
  mediaResult.value = null
  mediaError.value = ''
  mediaProgress.value = 0
  mediaStatus.value = 'idle'
}

const setMediaFile = (file) => {
  if (!file) return
  const workflow = currentMediaWorkflow.value
  if (!isSupportedForWorkflow(file, workflow)) {
    alert(`请选择${currentMediaHint.value}`)
    return
  }
  resetMediaResult()
  if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value)
  mediaFile.value = file
  mediaType.value = inferMediaType(file)
  mediaUrl.value = URL.createObjectURL(file)
  if (!mediaUseCustomDelay.value) {
    mediaFrameDelay.value = Math.round(1000 / mediaFps.value)
  }
}

const handleMediaUpload = (event) => {
  setMediaFile(event.target.files[0])
}

const handleMediaDrop = (event) => {
  setMediaFile(event.dataTransfer.files[0])
}

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) return '0 KB'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const blobToImage = (blob) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('帧图片解码失败'))
    }
    img.src = url
  })
}

const convertMediaFrame = async (frame) => {
  const img = await blobToImage(frame.blob)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = width.value
  canvas.height = height.value
  ctx.drawImage(img, 0, 0, width.value, height.value)
  const imageData = ctx.getImageData(0, 0, width.value, height.value)
  const moduloOptions = getModuloOptions()
  const data = packImageDataByMode(imageData, width.value, height.value, moduloOptions)

  return {
    ...frame,
    data,
    mode: imageMode.value,
    colorDepth: Number(colorDepth.value),
    moduloOptions,
    hexData: formatHexData(data),
    binData: formatBinData(data)
  }
}

const renderMediaPreviewFrame = (frame) => {
  renderModuloPreviewCanvas(mediaPreviewCanvas.value, frame?.data, frame?.moduloOptions || getModuloOptions())
}

let mediaPreviewTimer = null
const startMediaPreview = () => {
  if (mediaPreviewTimer) clearInterval(mediaPreviewTimer)
  if (!mediaResult.value || mediaFrames.length === 0) return
  let index = 0
  renderMediaPreviewFrame(mediaFrames[index])
  mediaPreviewTimer = setInterval(() => {
    index = (index + 1) % mediaFrames.length
    renderMediaPreviewFrame(mediaFrames[index])
  }, mediaResult.value.frameDelay)
}

const generateMediaModulo = async () => {
  if (!mediaFile.value) {
    alert(`请先上传${currentMediaUploadName.value}文件`)
    return
  }

  resetMediaResult()
  try {
    const frameDelay = mediaUseCustomDelay.value
      ? mediaFrameDelay.value
      : Math.round(1000 / mediaFps.value)
    mediaFrameDelay.value = frameDelay

    const extractedFrames = await extractMediaFrames(mediaFile.value, {
      mode: mediaExtractionMode.value,
      fps: mediaFps.value,
      maxFrames: mediaMaxFrames.value,
      onStatus: (status) => {
        mediaStatus.value = status
      },
      onProgress: (progress) => {
        mediaProgress.value = progress
      }
    })

    mediaStatus.value = 'converting'
    const convertedFrames = []
    for (let i = 0; i < extractedFrames.length; i++) {
      convertedFrames.push(await convertMediaFrame(extractedFrames[i]))
      mediaProgress.value = convertedFrames.length / extractedFrames.length
    }

    mediaFrames.push(...convertedFrames)
    const meta = {
      width: width.value,
      height: height.value,
      frameDelay,
      bytesPerFrame: mediaBytesPerFrame.value,
      mode: imageMode.value,
      colorDepth: Number(colorDepth.value),
      modeLabel: imageModeLabel(imageMode.value, colorDepth.value)
    }

    mediaResult.value = {
      ...meta,
      frameCount: mediaFrames.length,
      frames: mediaFrames,
      frameArraysCode: formatFrameArraysCode(mediaFrames),
      animationStructCode: formatAnimationStructCode(mediaFrames, meta),
      rawHexData: formatRawHexFrames(mediaFrames),
      headerCode: formatAnimationHeader(mediaFrames, meta)
    }
    mediaActiveTab.value = 'struct'
    mediaStatus.value = 'complete'
    mediaProgress.value = 1
    await nextTick()
    startMediaPreview()
  } catch (error) {
    mediaStatus.value = 'error'
    mediaError.value = error?.message || `${currentMediaLabel.value}失败`
    mediaResult.value = null
  }
}

const getMediaOutputText = () => {
  if (!mediaResult.value) return ''
  if (mediaActiveTab.value === 'arrays') return mediaResult.value.frameArraysCode
  if (mediaActiveTab.value === 'raw') return mediaResult.value.rawHexData
  return mediaResult.value.animationStructCode
}

const copyMediaResult = () => {
  const text = getMediaOutputText()
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板')
  }).catch(() => {
    alert('复制失败，请手动复制')
  })
}

const downloadTextFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const exportMediaCFile = () => {
  if (!mediaResult.value) return
  downloadTextFile(mediaResult.value.animationStructCode, 'animation_bitmap.c')
}

const exportMediaHeaderFile = () => {
  if (!mediaResult.value) return
  downloadTextFile(mediaResult.value.headerCode, 'animation_bitmap.h')
}

// 批量取模
const generateBatchModulo = async () => {
  if (!batchText.value) {
    alert('请输入字符集')
    return
  }

  batchResult.length = 0
  const lines = batchText.value.split('\n').filter(line => line.trim())

  for (const line of lines) {
    const chars = Array.from(line.trim())
    for (const char of chars) {
      const data = await generateCharMatrix(char)
      if (data) {
        batchResult.push({
          text: char,
          data: data
        })
      }
    }
  }

  await nextTick()
  renderBatchCanvas()
}

const renderBatchCanvas = () => {
  batchResult.forEach((item, index) => {
    const canvas = document.querySelectorAll('.batch-item canvas')[index]
    if (canvas) {
      const ctx = canvas.getContext('2d')
      const size = Math.min(width.value, height.value)
      const pixelSize = size / Math.max(width.value, height.value)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < item.data.length; i++) {
        const byte = item.data[i]
        const byteIndex = i
        const x = (byteIndex % Math.ceil(width.value / 8)) * 8
        const y = Math.floor(byteIndex / Math.ceil(width.value / 8))

        for (let bit = 0; bit < 8 && (x + bit) < width.value; bit++) {
          const isOn = (byte >> (7 - bit)) & 1
          ctx.fillStyle = isOn ? '#4A90E2' : 'white'
          ctx.fillRect((x + bit) * pixelSize, y * pixelSize, pixelSize, pixelSize)
        }
      }
    }
  })
}

// ==================== 手绘取模功能 ====================

// 初始化 Canvas
const initDrawCanvas = () => {
  if (!drawCanvas.value) return
  
  const canvas = drawCanvas.value
  const ctx = canvas.getContext('2d')
  
  // 清空画布
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制网格（如果需要）
  if (showGrid.value) {
    drawGrid(ctx)
  }
}

// 绘制网格
const drawGrid = (ctx) => {
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 0.5
  
  for (let x = 0; x <= width.value; x++) {
    ctx.beginPath()
    ctx.moveTo(x * canvasScale, 0)
    ctx.lineTo(x * canvasScale, height.value * canvasScale)
    ctx.stroke()
  }
  
  for (let y = 0; y <= height.value; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * canvasScale)
    ctx.lineTo(width.value * canvasScale, y * canvasScale)
    ctx.stroke()
  }
}

// 开始绘制
const startDrawing = (e) => {
  isDrawing.value = true
  saveDrawState() // 保存当前状态用于撤销
  draw(e)
}

// 绘制中
const draw = (e) => {
  if (!isDrawing.value || !drawCanvas.value) return
  
  const canvas = drawCanvas.value
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  
  const x = Math.floor((e.clientX - rect.left) / canvasScale)
  const y = Math.floor((e.clientY - rect.top) / canvasScale)
  
  // 确保坐标在范围内
  if (x < 0 || x >= width.value || y < 0 || y >= height.value) return
  
  ctx.fillStyle = drawTool.value === 'pen' ? 'black' : 'white'
  
  // 根据画笔大小绘制
  const radius = Math.floor(brushSize.value / 2)
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = x + dx
      const py = y + dy
      if (px >= 0 && px < width.value && py >= 0 && py < height.value) {
        ctx.fillRect(px * canvasScale, py * canvasScale, canvasScale, canvasScale)
      }
    }
  }
}

// 停止绘制
const stopDrawing = () => {
  isDrawing.value = false
}

// 触摸事件处理
const handleTouchStart = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  startDrawing(mouseEvent)
}

const handleTouchMove = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  draw(mouseEvent)
}

// 保存绘制状态（用于撤销）
const saveDrawState = () => {
  if (!drawCanvas.value) return
  
  const canvas = drawCanvas.value
  const imageData = canvas.toDataURL()
  drawHistory.push(imageData)
  
  // 限制历史记录数量
  if (drawHistory.length > 20) {
    drawHistory.shift()
  }
}

// 撤销
const undoDraw = () => {
  if (drawHistory.length === 0 || !drawCanvas.value) return
  
  const lastState = drawHistory.pop()
  const img = new Image()
  img.onload = () => {
    const canvas = drawCanvas.value
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
  }
  img.src = lastState
}

// 清空画布
const clearCanvas = () => {
  if (!drawCanvas.value) return
  
  saveDrawState()
  
  const canvas = drawCanvas.value
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  if (showGrid.value) {
    drawGrid(ctx)
  }
}

// 生成手绘点阵数据
const generateDrawModulo = async () => {
  if (!drawCanvas.value) {
    alert('请先绘制内容')
    return
  }
  
  drawResult.length = 0
  
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width.value
  tempCanvas.height = height.value
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.drawImage(drawCanvas.value, 0, 0, width.value, height.value)
  
  const imageData = tempCtx.getImageData(0, 0, width.value, height.value)
  const data = packImageDataByMode(imageData, width.value, height.value, {
    ...getModuloOptions(),
    imageMode: 'mono',
    colorFormat: 'MONO1'
  })
  drawResult.push(...data)
}
// 复制手绘结果
const copyDrawResult = (format) => {
  let text = ''
  
  if (format === 'hex') {
    text = formatHexData(drawResult)
  } else if (format === 'binary') {
    text = formatBinData(drawResult)
  } else if (format === 'c') {
    text = formatDrawCCode(drawResult)
  }
  
  navigator.clipboard.writeText(text).then(() => {
    alert('✓ 已复制到剪贴板')
  }).catch(() => {
    alert('复制失败，请手动复制')
  })
}

// 格式化手绘 C 代码
const formatDrawCCode = (data) => {
  const hexData = formatHexData(data)
  return `// 手绘字符点阵数据 (${width.value}x${height.value})
const uint8_t hand_drawn_char[] = {
    ${hexData}
};`
}

// 导出手绘 C 文件
const exportDrawCFile = () => {
  const cCode = formatDrawCCode(drawResult)
  const blob = new Blob([cCode], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hand_drawn_${width.value}x${height.value}.c`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 复制功能
const copyResult = (type) => {
  let text = ''
  if (currentTab.value === 'text' && textResult.length > 0) {
    textResult.forEach(item => {
      if (type === 'c') text += item.cCode + '\n\n'
      else if (type === 'bin') text += item.binData + '\n\n'
    })
  } else if (currentTab.value === 'image' && imageResult.value) {
    if (type === 'c') text = imageResult.value.cCode
    else if (type === 'bin') text = imageResult.value.binData
  }

  if (text) {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }
}

const copyBatchResult = (type) => {
  let text = ''
  batchResult.forEach(item => {
    if (type === 'c') {
      text += formatCCode(item.text, item.data) + '\n\n'
    }
  })

  if (text) {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }
}

// 导出C文件
const exportCFile = () => {
  let content = '// 字库数据\n// 由字库取模工具生成\n\n'

  if (currentTab.value === 'text' && textResult.length > 0) {
    textResult.forEach(item => {
      content += item.cCode + '\n\n'
    })
  } else if (currentTab.value === 'image' && imageResult.value) {
    content += imageResult.value.cCode + '\n'
  }

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'font_data.c'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const exportBatchCFile = () => {
  let content = '// 批量字库数据\n// 由字库取模工具生成\n\n'

  batchResult.forEach(item => {
    content += formatCCode(item.text, item.data) + '\n\n'
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'batch_font_data.c'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 50%, #FFF3E0 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  min-height: 100vh;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.logo {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-icon {
  background: none;
  color: #4A90E2;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #4A90E2;
  animation: borderColorShift 8s ease infinite;
}

@keyframes borderColorShift {
  0%, 100% {
    color: #4A90E2;
    border-color: #4A90E2;
  }
  50% {
    color: #66BB6A;
    border-color: #66BB6A;
  }
}

.logo-text h1 {
  font-size: 24px;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.logo-text p {
  font-size: 13px;
  color: #666;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.action-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 100%);
  color: #4A90E2;
  animation: actionBtnHoverShift 8s ease infinite;
}

@keyframes actionBtnHoverShift {
  0%, 100% {
    color: #4A90E2;
  }
  50% {
    color: #66BB6A;
  }
}

.main-content {
  display: flex;
  max-width: 1600px;
  margin: 0 auto;
  padding: 30px 40px;
  gap: 30px;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nav-menu {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.nav-menu:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.15);
}

.nav-item {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
}

.nav-item:hover {
  background: #f5f7fa;
}

.nav-item.active {
  background: linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 100%);
  color: #4A90E2;
  font-weight: 500;
  animation: navItemColorShift 8s ease infinite;
}

@keyframes navItemColorShift {
  0%, 100% {
    color: #4A90E2;
  }
  50% {
    color: #66BB6A;
  }
}

.config-panel {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.config-panel:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.15);
}

.config-panel h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #333;
}

.config-item {
  margin-bottom: 16px;
}

.config-item label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-inputs input {
  flex: 1;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.size-inputs span {
  color: #999;
}

.config-item select,
.config-item input[type="text"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

input[type="range"] {
  width: 100%;
  margin-bottom: 4px;
}

.range-value {
  font-size: 13px;
  color: #4A90E2;
  font-weight: 500;
  animation: rangeValueShift 8s ease infinite;
}

@keyframes rangeValueShift {
  0%, 100% {
    color: #4A90E2;
  }
  50% {
    color: #66BB6A;
  }
}

.content-area {
  flex: 1;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-section,
.result-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.input-section:hover,
.result-section:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.15);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 22px;
  color: #1a1a1a;
}

.section-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 15px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 500;
}

.form-group textarea,
.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
  font-family: inherit;
}

.form-group textarea:focus,
.form-group input:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  animation: inputFocusShift 8s ease infinite;
}

@keyframes inputFocusShift {
  0%, 100% {
    border-color: #4A90E2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }
  50% {
    border-color: #66BB6A;
    box-shadow: 0 0 0 3px rgba(102, 187, 106, 0.1);
  }
}

.form-group textarea {
  resize: vertical;
}

.primary-btn {
  width: 100%;
  padding: 14px;
  background: white;
  color: #4A90E2;
  border: 2px solid #4A90E2;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: primaryBtnShift 8s ease infinite;
}

@keyframes primaryBtnShift {
  0%, 100% {
    color: #4A90E2;
    border-color: #4A90E2;
  }
  50% {
    color: #66BB6A;
    border-color: #66BB6A;
  }
}

.primary-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  animation: none;
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
}

.upload-area:hover {
  border-color: #4A90E2;
  background: linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 100%);
  animation: uploadAreaHoverShift 8s ease infinite;
}

@keyframes uploadAreaHoverShift {
  0%, 100% {
    border-color: #4A90E2;
  }
  50% {
    border-color: #66BB6A;
  }
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #666;
}

.upload-content svg {
  color: #999;
  margin-bottom: 4px;
}

.upload-area p {
  color: #666;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: #999;
}

.image-options {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.option-group {
  margin-bottom: 16px;
}

.option-group:last-child {
  margin-bottom: 0;
}

.option-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: normal;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.small-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #4A90E2;
  border-radius: 6px;
  font-size: 14px;
  color: #4A90E2;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: smallBtnShift 8s ease infinite;
}

@keyframes smallBtnShift {
  0%, 100% {
    color: #4A90E2;
    border-color: #4A90E2;
  }
  50% {
    color: #66BB6A;
    border-color: #66BB6A;
  }
}

.small-btn:hover {
  background: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
  animation: none;
}

.char-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.char-item {
  background: rgba(249, 249, 249, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.char-item:hover {
  background: rgba(249, 249, 249, 0.95);
  box-shadow: 0 2px 12px rgba(74, 144, 226, 0.1);
  transform: translateY(-2px);
}

.char-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.char-preview {
  font-size: 32px;
  font-weight: bold;
  color: #1a1a1a;
}

.char-info {
  font-size: 13px;
  color: #666;
}

.matrix-preview {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.matrix-preview canvas {
  border: 1px solid #e0e0e0;
  background: white;
  image-rendering: pixelated;
  cursor: pointer;
  max-width: 100%;
}

.data-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tab-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: #4A90E2;
  color: #4A90E2;
  animation: tabBtnHoverShift 8s ease infinite;
}

@keyframes tabBtnHoverShift {
  0%, 100% {
    border-color: #4A90E2;
    color: #4A90E2;
  }
  50% {
    border-color: #66BB6A;
    color: #66BB6A;
  }
}

.tab-btn.active {
  background: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%);
  color: white;
  border-color: transparent;
  animation: none;
}

.data-content {
  background: white;
  border-radius: 6px;
  padding: 16px;
  border: 1px solid #e0e0e0;
}

.data-content pre {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.image-result {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.preview-area h4 {
  font-size: 15px;
  color: #333;
  margin-bottom: 12px;
}

.source-image {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.result-canvas {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  image-rendering: pixelated;
}

.media-file-info {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  color: #4a5568;
  font-size: 13px;
}

.media-file-info span {
  padding: 6px 10px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.media-delay-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.media-delay-row input[type="number"] {
  width: 100px;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.media-warning,
.media-error {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
}

.media-warning {
  color: #8a5a00;
  background: #fff7e6;
  border: 1px solid #f6d48a;
}

.media-error {
  margin: 14px 0;
  color: #b42318;
  background: #fff1f0;
  border: 1px solid #ffccc7;
}

.media-estimate {
  color: #64748b;
  font-size: 13px;
}

.media-progress {
  margin: 16px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: #4a5568;
  font-size: 13px;
}

.progress-track {
  height: 8px;
  overflow: hidden;
  background: #e5e7eb;
  border-radius: 999px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4A90E2, #34c759);
  transition: width 0.2s ease;
}

.media-result-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.media-frame-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  max-height: 260px;
  overflow: auto;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.media-frame-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  color: #64748b;
  font-size: 12px;
}

.media-frame-item img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  image-rendering: pixelated;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.data-output {
  background: rgba(249, 249, 249, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.data-output:hover {
  background: rgba(249, 249, 249, 0.95);
  box-shadow: 0 2px 12px rgba(74, 144, 226, 0.1);
}

.batch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.batch-item {
  background: rgba(249, 249, 249, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.batch-item:hover {
  background: rgba(249, 249, 249, 0.95);
  box-shadow: 0 2px 12px rgba(74, 144, 226, 0.1);
  transform: translateY(-2px);
}

.batch-char {
  font-size: 24px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.batch-item canvas {
  width: 80px;
  height: 80px;
  border: 1px solid #e0e0e0;
  background: white;
  image-rendering: pixelated;
  margin-bottom: 8px;
}

.batch-size {
  font-size: 12px;
  color: #666;
}

/* ==================== 手绘取模样式 ==================== */

.draw-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.draw-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  align-items: center;
}

.tool-btn {
  padding: 8px 16px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.tool-btn:hover:not(:disabled) {
  border-color: #4A90E2;
  color: #4A90E2;
  background: #f5f9ff;
}

.tool-btn.active {
  background: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%);
  color: white;
  border-color: transparent;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 5px;
}

.canvas-wrapper {
  position: relative;
  display: inline-block;
  margin: 20px auto;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  cursor: crosshair;
}

.canvas-wrapper canvas {
  display: block;
  position: relative;
  z-index: 2;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
  background-image: 
    linear-gradient(to right, #e0e0e0 1px, transparent 1px),
    linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
}

.draw-options {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
}

.option-row:last-child {
  margin-bottom: 0;
}

.option-row label {
  font-size: 14px;
  color: #333;
  min-width: 80px;
}

.option-row input[type="range"] {
  flex: 1;
  max-width: 200px;
}

.switch-label {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  cursor: pointer;
}

.switch-label input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e0e0e0;
  transition: .3s ease;
  border-radius: 26px;
  border: 2px solid #d0d0d0;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch-label:hover .switch-slider {
  background-color: #d0d0d0;
  border-color: #4A90E2;
}

.switch-label input:checked + .switch-slider {
  background: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%);
  border-color: transparent;
  animation: switchColorShift 8s ease infinite;
}

@keyframes switchColorShift {
  0%, 100% {
    background: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%);
  }
  50% {
    background: linear-gradient(135deg, #66BB6A 0%, #4A90E2 100%);
  }
}

.switch-label input:checked + .switch-slider:before {
  transform: translateX(24px);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 900px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
  font-size: 28px;
  margin-bottom: 30px;
  color: #1a1a1a;
  text-align: center;
  padding-bottom: 15px;
  border-bottom: 3px solid;
  border-image: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%) 1;
  animation: titleColorShift 8s ease infinite;
}

@keyframes titleColorShift {
  0%, 100% {
    border-image: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%) 1;
  }
  50% {
    border-image: linear-gradient(135deg, #66BB6A 0%, #4A90E2 100%) 1;
  }
}

.help-content h3 {
  font-size: 18px;
  color: #4A90E2;
  margin: 30px 0 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  background: linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 100%);
  border-radius: 8px;
  font-weight: 600;
  animation: sectionTitleShift 8s ease infinite;
}

@keyframes sectionTitleShift {
  0%, 100% {
    color: #4A90E2;
    background: linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 100%);
  }
  50% {
    color: #66BB6A;
    background: linear-gradient(135deg, #E8F5E9 0%, #E3F2FD 100%);
  }
}

.help-content h4 {
  font-size: 16px;
  color: #333;
  margin: 20px 0 10px;
  padding-left: 10px;
  border-left: 3px solid #4A90E2;
  font-weight: 600;
}

.help-content p {
  margin: 10px 0;
  line-height: 1.8;
  color: #555;
}

.help-content ul,
.help-content ol {
  padding-left: 25px;
  color: #666;
  margin: 10px 0;
}

.help-content li {
  margin-bottom: 10px;
  line-height: 1.8;
}

.help-content ul ul,
.help-content ol ol,
.help-content ul ol,
.help-content ol ul {
  margin-top: 8px;
  margin-bottom: 8px;
}

.help-content pre {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 15px 0;
  color: #333;
}

.help-content code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #4A90E2;
}

.close-btn {
  margin-top: 20px;
  padding: 10px 24px;
  background: white;
  color: #4A90E2;
  border: 2px solid #4A90E2;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: closeBtnShift 8s ease infinite;
}

@keyframes closeBtnShift {
  0%, 100% {
    color: #4A90E2;
    border-color: #4A90E2;
  }
  50% {
    color: #66BB6A;
    border-color: #66BB6A;
  }
}

.close-btn:hover {
  background: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%);
  color: white;
  border-color: transparent;
  animation: none;
}

/* ==================== 历史记录样式 ==================== */

.history-modal {
  max-width: 800px;
}

.password-section {
  text-align: center;
  padding: 40px 20px;
}

.password-icon {
  color: #4A90E2;
  margin-bottom: 20px;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.password-section h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 10px;
}

.password-hint {
  color: #666;
  font-size: 14px;
  margin-bottom: 30px;
}

.password-input-group {
  display: flex;
  gap: 10px;
  max-width: 400px;
  margin: 0 auto 20px;
}

.password-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.password-input:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.history-section {
  max-height: 60vh;
  overflow-y: auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.history-stats {
  display: flex;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.history-actions {
  display: flex;
  gap: 10px;
}

.danger-btn {
  border-color: #ff4757;
  color: #ff4757;
}

.danger-btn:hover {
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  border-color: transparent;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  gap: 15px;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.history-item:hover {
  background: #f0f0f0;
  border-left-color: #4A90E2;
  transform: translateX(5px);
}

.history-index {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4A90E2 0%, #66BB6A 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-ip,
.history-time,
.history-ua {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 13px;
}

.history-ip svg,
.history-time svg,
.history-ua svg {
  color: #4A90E2;
  flex-shrink: 0;
}

.history-ip strong,
.history-time strong,
.history-ua strong {
  color: #333;
  min-width: 50px;
}

.empty-history {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-history svg {
  margin-bottom: 20px;
  opacity: 0.3;
}

.empty-history p {
  font-size: 16px;
}

/* ==================== 动态水印样式 ==================== */

.watermark-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 9999;
}

.watermark-grid {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(10, 1fr);
  gap: 40px 30px;
  transform: rotate(-30deg);
  animation: watermarkFloat 30s linear infinite;
}

.watermark-text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(74, 144, 226, 0.06);
  letter-spacing: 1px;
  white-space: nowrap;
  text-shadow: 0 0 6px rgba(74, 144, 226, 0.04);
  user-select: none;
}

@keyframes watermarkFloat {
  0% {
    transform: rotate(-30deg) translate(0, 0);
  }
  100% {
    transform: rotate(-30deg) translate(-100px, -100px);
  }
}

@media (max-width: 1024px) {
  .app-header {
    padding: 16px 24px;
  }

  .main-content {
    padding: 24px;
    gap: 20px;
  }

  .sidebar {
    width: 240px;
  }

  .section-header {
    align-items: flex-start;
    gap: 12px;
  }

  .result-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .app-container {
    min-width: 0;
  }

  .app-header {
    position: sticky;
    top: 0;
    z-index: 20;
    padding: 12px 14px;
    gap: 12px;
    align-items: flex-start;
  }

  .logo {
    gap: 10px;
    min-width: 0;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    flex-shrink: 0;
  }

  .logo-text {
    min-width: 0;
  }

  .logo-text h1 {
    font-size: 18px;
    margin-bottom: 2px;
  }

  .logo-text p {
    font-size: 12px;
    line-height: 1.4;
  }

  .header-actions {
    gap: 6px;
    flex-shrink: 0;
  }

  .action-btn {
    padding: 7px 8px;
    font-size: 12px;
    white-space: nowrap;
  }

  .main-content {
    flex-direction: column;
    padding: 14px;
    gap: 14px;
  }

  .sidebar {
    width: 100%;
    gap: 14px;
  }

  .nav-menu {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 8px;
    border-radius: 8px;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }

  .nav-item {
    flex: 0 0 auto;
    margin-bottom: 0;
    padding: 10px 12px;
    font-size: 14px;
    white-space: nowrap;
  }

  .config-panel,
  .input-section,
  .result-section,
  .data-output,
  .char-item,
  .draw-container {
    border-radius: 8px;
    padding: 16px;
  }

  .config-panel {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .section-header h2 {
    font-size: 19px;
  }

  .section-desc {
    margin-bottom: 14px;
    line-height: 1.5;
  }

  .upload-area {
    padding: 24px 14px;
  }

  .radio-group,
  .media-delay-row,
  .option-row,
  .draw-toolbar,
  .history-header,
  .history-stats,
  .history-actions {
    flex-wrap: wrap;
  }

  .result-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .small-btn {
    flex: 1 1 132px;
    justify-content: center;
    min-height: 38px;
    padding: 8px 10px;
  }

  .primary-btn {
    min-height: 44px;
  }

  .image-result,
  .media-result-layout {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .source-image,
  .result-canvas {
    max-height: 56vh;
    object-fit: contain;
  }

  .media-frame-grid {
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
    max-height: 220px;
    padding: 8px;
  }

  .data-tabs {
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }

  .tab-btn {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .data-content {
    padding: 12px;
    overflow-x: auto;
  }

  .data-content pre,
  .output-content pre,
  .help-content pre {
    white-space: pre;
    word-break: normal;
    overflow-x: auto;
  }

  .char-header,
  .history-item,
  .password-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .char-preview {
    font-size: 28px;
  }

  .batch-grid {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  }

  .canvas-wrapper {
    max-width: 100%;
    overflow: auto;
  }

  .draw-toolbar {
    align-items: stretch;
  }

  .tool-btn {
    flex: 1 1 96px;
    justify-content: center;
  }

  .toolbar-divider {
    display: none;
  }

  .modal {
    align-items: stretch;
    justify-content: stretch;
    padding: 12px;
  }

  .modal-content {
    width: 100%;
    max-width: none;
    max-height: calc(100vh - 24px);
    padding: 22px 16px;
    border-radius: 10px;
  }

  .modal-content h2 {
    font-size: 22px;
    margin-bottom: 20px;
  }
}

@media (max-width: 480px) {
  .app-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }

  .main-content {
    padding: 10px;
  }

  .config-panel,
  .input-section,
  .result-section,
  .data-output,
  .char-item,
  .draw-container {
    padding: 14px;
  }

  .size-inputs {
    gap: 6px;
  }

  .small-btn {
    flex-basis: 100%;
  }

  .media-file-info span {
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .watermark-container {
    display: none;
  }
}
</style>
