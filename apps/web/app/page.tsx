export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">AMS Web</h1>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <a className="underline hover:no-underline" href="/design/tokens">
            Design Tokens (/design/tokens)
          </a>
        </li>
      </ul>
    </main>
  );
}
