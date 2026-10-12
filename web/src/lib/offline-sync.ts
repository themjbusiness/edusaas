import { get, set } from 'idb-keyval';

export interface QueuedAction {
  id: string;
  type: 'quiz_submission' | 'progress_update';
  payload: any;
  timestamp: number;
}

const QUEUE_KEY = 'offline-action-queue';

// Get all queued actions
export async function getQueue(): Promise<QueuedAction[]> {
  const queue = await get<QueuedAction[]>(QUEUE_KEY);
  return queue || [];
}

// Add an action to the queue
export async function enqueueAction(type: QueuedAction['type'], payload: any): Promise<void> {
  const queue = await getQueue();
  queue.push({
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
  });
  await set(QUEUE_KEY, queue);
}

// Remove an action from the queue
export async function dequeueAction(id: string): Promise<void> {
  let queue = await getQueue();
  queue = queue.filter(action => action.id !== id);
  await set(QUEUE_KEY, queue);
}

// Attempt to sync all queued actions with the backend
export async function syncQueue(): Promise<void> {
  if (!navigator.onLine) return;

  const queue = await getQueue();
  if (queue.length === 0) return;

  try {
    const response = await fetch('/api/sync/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ actions: queue }),
    });

    if (response.ok) {
      // Clear queue if sync successful
      await set(QUEUE_KEY, []);
    } else {
      console.error('Failed to sync offline actions');
    }
  } catch (err) {
    console.error('Error during sync', err);
  }
}

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncQueue);
}
