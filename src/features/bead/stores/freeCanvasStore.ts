import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { CanvasObject } from '../canvasObjects';
import { createCanvasObject } from '../canvasObjects';

export const useFreeCanvasStore = defineStore('freeCanvas', () => {
  const objects = ref<CanvasObject[]>([]);
  const selectedId = ref<string | null>(null);
  const canvasWidth = ref(800);
  const canvasHeight = ref(600);
  const zoom = ref(1);
  const gridSnap = ref(true);
  const gridSize = ref(20);
  const nextZ = ref(1);

  const selected = computed(() => objects.value.find((o) => o.id === selectedId.value) ?? null);

  function addObject(partial: Partial<CanvasObject> & { type: CanvasObject['type'] }) {
    const obj = createCanvasObject({ ...partial, zIndex: nextZ.value++ });
    objects.value = [...objects.value, obj];
    selectedId.value = obj.id;
    return obj;
  }

  function removeObject(id: string) {
    objects.value = objects.value.filter((o) => o.id !== id);
    if (selectedId.value === id) selectedId.value = null;
  }

  function selectObject(id: string | null) {
    selectedId.value = id;
    objects.value = objects.value.map((o) => ({ ...o, selected: o.id === id }));
  }

  function updateObject(id: string, patch: Partial<CanvasObject>) {
    objects.value = objects.value.map((o) => o.id === id ? { ...o, ...patch } : o);
  }

  function moveObject(id: string, dx: number, dy: number) {
    objects.value = objects.value.map((o) => {
      if (o.id !== id) return o;
      let nx = o.x + dx;
      let ny = o.y + dy;
      if (gridSnap.value) {
        nx = Math.round(nx / gridSize.value) * gridSize.value;
        ny = Math.round(ny / gridSize.value) * gridSize.value;
      }
      return { ...o, x: nx, y: ny };
    });
  }

  function rotateObject(id: string, degrees: number) {
    objects.value = objects.value.map((o) =>
      o.id === id ? { ...o, rotation: (o.rotation + degrees + 360) % 360 } : o
    );
  }

  function scaleObject(id: string, factor: number) {
    objects.value = objects.value.map((o) =>
      o.id === id ? { ...o, scale: Math.max(0.1, Math.min(5, o.scale * factor)) } : o
    );
  }

  function bringForward(id: string) {
    const obj = objects.value.find((o) => o.id === id);
    if (!obj) return;
    const maxZ = Math.max(...objects.value.map((o) => o.zIndex));
    updateObject(id, { zIndex: maxZ + 1 });
  }

  function sendBackward(id: string) {
    const obj = objects.value.find((o) => o.id === id);
    if (!obj) return;
    const minZ = Math.min(...objects.value.map((o) => o.zIndex));
    updateObject(id, { zIndex: Math.max(0, minZ - 1) });
  }

  function clearAll() {
    objects.value = [];
    selectedId.value = null;
    nextZ.value = 1;
  }

  return {
    objects,
    selectedId,
    selected,
    canvasWidth,
    canvasHeight,
    zoom,
    gridSnap,
    gridSize,
    addObject,
    removeObject,
    selectObject,
    updateObject,
    moveObject,
    rotateObject,
    scaleObject,
    bringForward,
    sendBackward,
    clearAll
  };
});
