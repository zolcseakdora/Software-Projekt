import { useRouter } from 'expo-router';

import { GalleryScreen } from '@/screens/gallery-screen';

export default function GalleryRoute() {
  const router = useRouter();

  return (
    <GalleryScreen
      selectedFolder={null}
      images={[]}
      onBack={() => router.back()}
      onRefresh={() => undefined}
      onSelectFolder={(folder) => router.push({ pathname: '/gallery/[folder]/index', params: { folder } })}
      onUploadImage={() => undefined}
      onSelectImage={() => undefined}
    />
  );
}
