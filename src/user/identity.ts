import { computed, ref } from 'vue';

/**
 * Reserved auth hook.
 *
 * When user registration / login lands, wire the auth store to
 * `setCurrentUserId(accountId)` after login and `setCurrentUserId(null)`
 * on logout — the watermark (and anything else reading `watermarkUserId`)
 * updates reactively. Nothing else needs to change.
 */
const currentUserId = ref<string | null>(null);

export function setCurrentUserId(id: string | null): void {
  currentUserId.value = id && id.trim() ? id.trim() : null;
}

export function getCurrentUserId(): string | null {
  return currentUserId.value;
}

/** Text shown as the second watermark block until a real account id is bound. */
export const WATERMARK_GUEST_ID = 'guest';

export const watermarkUserId = computed(() => currentUserId.value ?? WATERMARK_GUEST_ID);
