import {lookupConfig} from '../../config-node';
import {isSafePathSegment} from '../util';

/**
 * The profile the application is running under, or undefined when there is none. A comma delimited list is
 * reduced to its last entry, and a name that could walk out of the directory it is pasted into is refused.
 */
export function activeProfile(): string | undefined {
  const profile = lookupConfig('config.node.profiles.active');

  if (!profile) {
    return undefined;
  }

  const name = Array.isArray(profile) ? profile[profile.length - 1] : profile;

  return isSafePathSegment(name as string) ? name as string : undefined;
}
