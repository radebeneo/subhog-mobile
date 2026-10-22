import { useEffect, useMemo, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { findSubscriptionIcon } from "./subscription-icons";

interface NamedSubscription {
  name: string;
}

/** Display-only enrichment; records stay backend-independent and never wait for logos. */
export function useSubscriptionIcons(
  subscriptions: readonly NamedSubscription[],
  scope: string,
) {
  // A new session gets a new cache, including after sign-out and sign-in.
  const cache = useMemo(() => {
    const requests = new Map<string, Promise<ImageSourcePropType>>();
    return {
      scope,
      find(name: string) {
        let pending = requests.get(name);
        if (!pending) {
          pending = findSubscriptionIcon(name);
          requests.set(name, pending);
        }
        return pending;
      },
    };
  }, [scope]);
  const names = useMemo(
    () => [...new Set(subscriptions.map(subscription => subscription.name))],
    [subscriptions],
  );
  const [resolved, setResolved] = useState({
    cache,
    icons: new Map<string, ImageSourcePropType>(),
  });

  useEffect(() => {
    let active = true;
    for (const name of names) {
      const pending = cache.find(name);
      void pending.then(icon => {
        if (!active) return;
        setResolved(previous => {
          const previousIcons = previous.cache === cache ? previous.icons : new Map();
          if (previous.cache === cache && previousIcons.get(name) === icon) {
            return previous;
          }
          return { cache, icons: new Map(previousIcons).set(name, icon) };
        });
      });
    }
    return () => { active = false; };
  }, [cache, names]);

  // Never expose results from a previous session, even before effect cleanup.
  return resolved.cache === cache ? resolved.icons : undefined;
}
