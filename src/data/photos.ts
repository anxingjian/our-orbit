import type { Photo } from '@/components/PhotoList';

/**
 * 照片数据
 *
 * 怎么加照片：
 * 1. 把照片放到 /public/photos/ 文件夹
 * 2. 在下面数组里加一条记录
 * 3. git push → 自动部署
 *
 * 字段说明：
 * - id: 唯一标识，随便写，不重复就行
 * - src: 照片路径，从 /photos/ 开始
 * - width / height: 照片的原始尺寸（像素）
 * - date: 拍摄日期，格式 YYYY-MM-DD
 * - title: 标题（可选，大多数照片不需要）
 * - dominantColor: 照片主色调（可选，加载时的占位颜色，十六进制）
 */
export const photos: Photo[] = [
  // 示例（删掉这些，换成真实照片）
  {
    id: 'demo-1',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    width: 1600,
    height: 1067,
    date: '2024-09-15',
    dominantColor: '#c8d8e8',
  },
  {
    id: 'demo-2',
    src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    width: 1600,
    height: 900,
    date: '2024-07-03',
    title: '那个下午',
    dominantColor: '#d4c8b4',
  },
  {
    id: 'demo-3',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    width: 1066,
    height: 1600,
    date: '2024-03-21',
    dominantColor: '#a8c4a0',
  },
  {
    id: 'demo-4',
    src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
    width: 1600,
    height: 1067,
    date: '2023-12-25',
    dominantColor: '#b8b4c4',
  },
  {
    id: 'demo-5',
    src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800',
    width: 1600,
    height: 1067,
    date: '2023-08-10',
    dominantColor: '#c4b8a8',
  },
  {
    id: 'demo-6',
    src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
    width: 1067,
    height: 1600,
    date: '2023-05-18',
    dominantColor: '#e4d4c0',
  },
  {
    id: 'demo-7',
    src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
    width: 1600,
    height: 900,
    date: '2022-10-07',
    dominantColor: '#b4c8b4',
  },
  {
    id: 'demo-8',
    src: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800',
    width: 1600,
    height: 1067,
    date: '2022-04-02',
    title: '阳台上的影子',
    dominantColor: '#d0c4b4',
  },
  {
    id: 'demo-9',
    src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    width: 1600,
    height: 1067,
    date: '2021-07-20',
    dominantColor: '#b4c0cc',
  },
  {
    id: 'demo-10',
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    width: 1600,
    height: 1067,
    date: '2020-01-12',
    dominantColor: '#c4c0b8',
  },
];
