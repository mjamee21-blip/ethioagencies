export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:p-4 lg:bg-zinc-200/40">
          Recruitment Agency OS&nbsp;
          <code className="font-mono font-bold">v0.1.0</code>
        </p>
      </div>

      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          Recruitment Agency Operating System
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Multi-tenant platform for end-to-end recruitment management, worker tracking, client orders, visas, travel, and financial accounting.
        </p>
        <div className="flex gap-4">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Enter Dashboard
          </a>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-3 lg:text-left gap-6">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold mb-2">Multi-Tenant</h2>
          <p className="text-sm text-muted-foreground">
            Complete data isolation per agency with robust role-based access control (RBAC).
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold mb-2">Worker Lifecycle</h2>
          <p className="text-sm text-muted-foreground">
            Track candidates, documents, visas, travel records, and placements seamlessly.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold mb-2">Financials & AI</h2>
          <p className="text-sm text-muted-foreground">
            Manage invoices, payments, expenses, subscriptions, and AI-powered assistant chats.
          </p>
        </div>
      </div>
    </main>
  );
}
