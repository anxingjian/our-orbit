import CoverPage from '@/components/CoverPage';
import PhotoList from '@/components/PhotoList';
import photosData from '@/data/photos.json';
import type { Photo } from '@/components/PhotoList';

export default function Home() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <CoverPage />
      <PhotoList photos={photosData as Photo[]} />

      {/* 结尾页 */}
      <footer style={{ padding: '120px 16px 160px', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 400,
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.02em',
        }}>
          一切从这里开始。
        </p>
      </footer>
    </main>
  );
}
