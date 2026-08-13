'use client';

import { RouteError } from '@/components/RouteError';

export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="en"><body className="m-0 bg-[#f8fafd] font-sans text-[#202124]"><RouteError {...props}/></body></html>;
}
