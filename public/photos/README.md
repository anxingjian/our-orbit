# 怎么加照片

## 简单步骤

1. 把照片放到这个文件夹：`public/photos/`
   - 建议文件名用日期，比如 `2024-09-15-beijing.jpg`
   - 支持 jpg、png、webp、heic

2. 打开 `src/data/photos.ts`，在数组里加一条：
```ts
{
  id: '唯一ID随便写',           // 比如 '2024-09-15'
  src: '/photos/文件名.jpg',    // 对应 public/photos/ 里的文件
  width: 4032,                  // 照片原始宽度（像素）
  height: 3024,                 // 照片原始高度（像素）
  date: '2024-09-15',           // 拍摄日期
  title: '可选的标题',           // 不想写就删掉这行
  dominantColor: '#c8d4d8',     // 可选，照片主色调（加载时占位用）
},
```

3. git push → Vercel 自动部署（几分钟后生效）

## 照片尺寸怎么看

Mac 上：右键照片 → 显示简介 → 尺寸

## 注意

- 照片会按 `date` 从新到旧排列，`date` 写准确就行
- 大多数照片不需要 title，只有特别想留下一句话的才写
- `dominantColor` 不写也没关系，会用默认的米色占位

## 批量加照片的快捷方式

如果有很多照片要加，可以告诉 Mako，让他帮你批量处理。
