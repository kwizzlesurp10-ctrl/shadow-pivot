import PivotCanvas from '@/components/PivotCanvas';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6 text-[#00ffcc]">Shadow Pivot: Panda-Lich Multiplication Empire</h1>
      <PivotCanvas />
    </main>
  );
}
