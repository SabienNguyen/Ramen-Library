import { beforeEach, expect, test } from 'bun:test'

globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} } as unknown as Storage

const { useBowlStore } = await import('./bowl')

beforeEach(() => useBowlStore.getState().reset())

test('setAmount stores and clears a slot amount', () => {
  const s = useBowlStore.getState()
  s.setPart('broth', 'tonkotsu')
  s.setAmount('broth', 500)
  expect(useBowlStore.getState().bowl.brothMl).toBe(500)
  s.setAmount('broth', undefined)
  expect(useBowlStore.getState().bowl.brothMl).toBeUndefined()
})

test('swapping a part resets its amount', () => {
  const s = useBowlStore.getState()
  s.setPart('broth', 'tonkotsu')
  s.setAmount('broth', 500)
  s.setPart('broth', 'kombu')
  expect(useBowlStore.getState().bowl.brothMl).toBeUndefined()
})

test('setToppingQty sets qty on one placed topping', () => {
  const s = useBowlStore.getState()
  s.addTopping('chashu')
  s.addTopping('nori')
  const [a, b] = useBowlStore.getState().bowl.toppings
  s.setToppingQty(a.key, 3)
  const after = useBowlStore.getState().bowl.toppings
  expect(after[0].qty).toBe(3)
  expect(after[1].qty).toBeUndefined()
  expect(b.key).toBe(after[1].key)
})

test('load restores amounts from a saved bowl', () => {
  const s = useBowlStore.getState()
  s.setPart('broth', 'tonkotsu')
  s.setAmount('broth', 250)
  const saved = s.save('test')
  s.reset()
  s.load(saved.id)
  expect(useBowlStore.getState().bowl.brothMl).toBe(250)
})
