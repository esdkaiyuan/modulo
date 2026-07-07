export const decodeBrowserImage = async (file) => {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  throw new Error('当前浏览器不支持图片解码')
}

