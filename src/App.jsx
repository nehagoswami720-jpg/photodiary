// Placeholder screen. The real one-screen UI is Phase 2 — for now this just
// confirms the app boots. The honest engine lives in src/lib and is proven
// headlessly via `npm run verify`.
export default function App() {
  return (
    <div className="min-h-screen grid place-items-center bg-stone-50 text-stone-500">
      <p className="text-sm">Photodiary — engine ready. UI comes in Phase 2.</p>
    </div>
  );
}
