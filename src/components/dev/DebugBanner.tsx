import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function DebugBanner() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [fnOk, setFnOk] = useState<boolean | null>(null);
  const mode = import.meta.env.MODE;
  const hasEnv = true; // Environment is now hardcoded in supabase.ts

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setHasSession(!!session?.user);
        }
      } catch (error) {
        console.error('[Debug banner] session check failed:', error);
        if (isMounted) {
          setHasSession(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const visible = useMemo(
    () => mode !== 'production' || !hasEnv || hasSession === false || fnOk === false,
    [mode, hasEnv, hasSession, fnOk]
  );

  if (!visible) return null;

  return (
    <div
      style={{ position: 'fixed', bottom: 8, left: 8, right: 8, zIndex: 9999 }}
      className="rounded-md border bg-yellow-50 text-yellow-900 p-2 text-xs shadow"
    >
      <div><b>Debug</b> • mode: {mode}</div>
      <div>env: {hasEnv ? 'ok' : 'missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (set Preview envs & redeploy)'} </div>
      <div>session: {hasSession === null ? 'checking…' : hasSession ? 'ok' : 'no session (enable anonymous auth)'} </div>
      <button
        type="button"
        className="mt-1 underline"
        onClick={async () => {
          setFnOk(null);
          try {
            const { data, error } = await supabase.functions.invoke('task-generator', {
              body: { description: 'ping' },
            });
            if (error) throw error;
            setFnOk(Array.isArray(data?.subtasks));
          } catch (error) {
            console.error('[Debug banner] function self-test failed:', error);
            setFnOk(false);
          }
        }}
      >
        Test task-generator
      </button>
      {fnOk === null && <div>function: …</div>}
      {fnOk === false && <div>function: failed (check Supabase origins + OPENAI secret)</div>}
      {fnOk === true && <div>function: ok</div>}
    </div>
  );
}
