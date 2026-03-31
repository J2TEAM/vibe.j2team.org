import { ref, onBeforeUnmount, triggerRef, type ShallowRef } from 'vue'
import { useScriptTag, useIntervalFn } from '@vueuse/core'
import { MQTT_TOPIC, MQTT_BROKER, SYNC_INTERVAL_MS } from '../constants/gridConfig'
import { encodeRLE, decodeRLE } from '../utils/compression'

interface MqttClient {
  connect?: boolean
  connected?: boolean
  publish: (topic: string, message: string) => void
  on: (event: string, cb: (...args: unknown[]) => void) => void
  subscribe: (topic: string) => void
  end?: () => void
}

export function useMqttSync(
  checkedSet: ShallowRef<Set<number>>,
  updateSpatialGrid: (index: number, isAdding: boolean) => void,
  scheduleDraw: () => void,
  pendingAdd: Set<number>,
  pendingDel: Set<number>,
  scheduleSave: () => void,
) {
  let mqttClient: MqttClient | null = null
  const isConnected = ref(false)
  const syncCount = ref(0)

  const ownClientId = Math.random().toString(36).substring(2, 15)

  useScriptTag('https://unpkg.com/mqtt@5.15.0/dist/mqtt.min.js', () => {
    // @ts-expect-error loading from cdn
    mqttClient = mqtt.connect(MQTT_BROKER, {
      keepalive: 30,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
    })

    mqttClient!.on('connect', () => {
      isConnected.value = true
      mqttClient!.subscribe(MQTT_TOPIC)
    })

    mqttClient!.on('message', (topic: unknown, message: unknown) => {
      try {
        const payload = JSON.parse((message as { toString: () => string }).toString())
        if (payload.client_id === ownClientId) return // Ignore own messages

        let hasChanges = false
        const currentSet = checkedSet.value

        // Process additions
        if (payload.add && payload.add.length > 0) {
          const addIndices = decodeRLE(payload.add)
          for (const idx of addIndices) {
            if (!currentSet.has(idx)) {
              currentSet.add(idx)
              updateSpatialGrid(idx, true)
              hasChanges = true
            }
          }
        }

        // Process deletions
        if (payload.del && payload.del.length > 0) {
          const delIndices = decodeRLE(payload.del)
          for (const idx of delIndices) {
            if (currentSet.has(idx)) {
              currentSet.delete(idx)
              updateSpatialGrid(idx, false)
              hasChanges = true
            }
          }
        }

        if (hasChanges) {
          triggerRef(checkedSet)
          scheduleSave()
          scheduleDraw()
          syncCount.value++

          // Reset sync counter after animation
          setTimeout(() => {
            if (syncCount.value > 0) syncCount.value--
          }, 2000)
        }
      } catch (e) {
        console.error('Failed to process MQTT message', e)
      }
    })

    mqttClient!.on('close', () => {
      isConnected.value = false
    })
    mqttClient!.on('error', () => {
      isConnected.value = false
    })
  })

  // Periodically flush pending changes to MQTT
  useIntervalFn(() => {
    if (!isConnected.value || !mqttClient) return
    if (pendingAdd.size === 0 && pendingDel.size === 0) return

    const payload = {
      client_id: ownClientId,
      add: encodeRLE(pendingAdd),
      del: encodeRLE(pendingDel),
    }

    try {
      mqttClient.publish(MQTT_TOPIC, JSON.stringify(payload))
      pendingAdd.clear()
      pendingDel.clear()
    } catch (e) {
      console.error('Failed to publish', e)
    }
  }, SYNC_INTERVAL_MS)

  onBeforeUnmount(() => {
    if (mqttClient?.end) {
      mqttClient.end()
    }
  })

  return {
    isConnected,
    syncCount,
  }
}
