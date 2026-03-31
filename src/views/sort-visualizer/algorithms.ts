import type { SortStep, AlgorithmDef, PivotStrategy } from './types'

function ms(
  a: number[],
  comparing: number[],
  swapping: number[],
  sorted: Set<number> | number[],
  pivot: number | undefined,
  description: string,
  pseudoCodeLine: number,
  comparisons: number,
  swaps: number,
): SortStep {
  return {
    array: [...a],
    comparing,
    swapping,
    sorted: sorted instanceof Set ? Array.from(sorted) : sorted,
    pivot,
    description,
    pseudoCodeLine,
    comparisons,
    swaps,
  }
}

// ===== BUBBLE SORT =====
function* bubbleSortGen(arr: number[]): Generator<SortStep> {
  const a = [...arr]
  const n = a.length
  const sorted = new Set<number>()
  let cmp = 0,
    swp = 0

  for (let i = 0; i < n - 1; i++) {
    let swapped = false
    for (let j = 0; j < n - i - 1; j++) {
      cmp++
      yield ms(
        a,
        [j, j + 1],
        [],
        sorted,
        undefined,
        `So sánh a[${j}]=${a[j]} với a[${j + 1}]=${a[j + 1]}`,
        2,
        cmp,
        swp,
      )
      if ((a[j] ?? 0) > (a[j + 1] ?? 0)) {
        const [from, to] = [a[j], a[j + 1]]
        ;[a[j], a[j + 1]] = [a[j + 1]!, a[j]!]
        swp++
        swapped = true
        yield ms(
          a,
          [],
          [j, j + 1],
          sorted,
          undefined,
          `${from} > ${to} → hoán đổi a[${j}] và a[${j + 1}]`,
          4,
          cmp,
          swp,
        )
      }
    }
    sorted.add(n - 1 - i)
    if (!swapped) {
      for (let k = 0; k <= n - 2 - i; k++) sorted.add(k)
      yield ms(
        a,
        [],
        [],
        sorted,
        undefined,
        'Không có hoán đổi → mảng đã sắp xếp sớm!',
        6,
        cmp,
        swp,
      )
      break
    }
  }
  sorted.add(0)
  yield ms(
    a,
    [],
    [],
    new Set(Array.from({ length: n }, (_, i) => i)),
    undefined,
    '✅ Bubble Sort hoàn tất!',
    -1,
    cmp,
    swp,
  )
}

// ===== SELECTION SORT =====
function* selectionSortGen(arr: number[]): Generator<SortStep> {
  const a = [...arr]
  const n = a.length
  const sorted = new Set<number>()
  let cmp = 0,
    swp = 0

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    yield ms(
      a,
      [i],
      [],
      sorted,
      undefined,
      `Tìm phần tử nhỏ nhất trong đoạn [${i}..${n - 1}]`,
      1,
      cmp,
      swp,
    )
    for (let j = i + 1; j < n; j++) {
      cmp++
      yield ms(
        a,
        [j, minIdx],
        [],
        sorted,
        undefined,
        `So sánh a[${j}]=${a[j]} với min hiện tại a[${minIdx}]=${a[minIdx]}`,
        3,
        cmp,
        swp,
      )
      if ((a[j] ?? 0) < (a[minIdx] ?? 0)) {
        minIdx = j
        yield ms(
          a,
          [minIdx],
          [],
          sorted,
          undefined,
          `Tìm thấy min mới: ${a[minIdx]} tại vị trí ${minIdx}`,
          4,
          cmp,
          swp,
        )
      }
    }
    if (minIdx !== i) {
      const [from, to] = [a[i], a[minIdx]]
      ;[a[i], a[minIdx]] = [a[minIdx]!, a[i]!]
      swp++
      yield ms(
        a,
        [],
        [i, minIdx],
        sorted,
        undefined,
        `Hoán đổi a[${i}]=${from} với a[${minIdx}]=${to}`,
        6,
        cmp,
        swp,
      )
    } else {
      yield ms(a, [], [], sorted, undefined, `a[${i}]=${a[i]} đã ở đúng vị trí`, 6, cmp, swp)
    }
    sorted.add(i)
  }
  sorted.add(n - 1)
  yield ms(
    a,
    [],
    [],
    new Set(Array.from({ length: n }, (_, i) => i)),
    undefined,
    '✅ Selection Sort hoàn tất!',
    -1,
    cmp,
    swp,
  )
}

// ===== INSERTION SORT =====
function* insertionSortGen(arr: number[]): Generator<SortStep> {
  const a = [...arr]
  const n = a.length
  const sorted = new Set<number>([0])
  let cmp = 0,
    swp = 0

  for (let i = 1; i < n; i++) {
    const key = a[i]!
    let j = i - 1
    yield ms(
      a,
      [i],
      [],
      sorted,
      undefined,
      `Chèn key=${key} vào vị trí đúng trong [0..${i}]`,
      1,
      cmp,
      swp,
    )
    while (j >= 0) {
      cmp++
      yield ms(
        a,
        [j, j + 1],
        [],
        sorted,
        undefined,
        `So sánh a[${j}]=${a[j]} với key=${key}`,
        3,
        cmp,
        swp,
      )
      if ((a[j] ?? 0) > key) {
        a[j + 1] = a[j]!
        swp++
        yield ms(
          a,
          [],
          [j, j + 1],
          sorted,
          undefined,
          `${a[j + 1]} > ${key} → dịch a[${j}] sang phải`,
          4,
          cmp,
          swp,
        )
        j--
      } else break
    }
    a[j + 1] = key as number
    sorted.add(i)
    yield ms(a, [], [], sorted, undefined, `Đặt key=${key} vào vị trí ${j + 1}`, 6, cmp, swp)
  }
  yield ms(
    a,
    [],
    [],
    new Set(Array.from({ length: n }, (_, i) => i)),
    undefined,
    '✅ Insertion Sort hoàn tất!',
    -1,
    cmp,
    swp,
  )
}

// ===== MERGE SORT (Bottom-up iterative) =====
function* mergeSortGen(arr: number[]): Generator<SortStep> {
  const a = [...arr]
  const n = a.length
  const sorted = new Set<number>()
  let cmp = 0,
    swp = 0

  for (let width = 1; width < n; width *= 2) {
    for (let lo = 0; lo < n; lo += 2 * width) {
      const mid = Math.min(lo + width - 1, n - 1)
      const hi = Math.min(lo + 2 * width - 1, n - 1)
      if (mid >= hi) continue

      yield ms(
        a,
        [],
        [],
        sorted,
        undefined,
        `Gộp đoạn [${lo}..${mid}] và [${mid + 1}..${hi}]`,
        1,
        cmp,
        swp,
      )

      const left = a.slice(lo, mid + 1)
      const right = a.slice(mid + 1, hi + 1)
      let i = 0,
        j = 0,
        k = lo

      while (i < left.length && j < right.length) {
        cmp++
        yield ms(
          a,
          [lo + i, mid + 1 + j],
          [],
          sorted,
          undefined,
          `So sánh ${left[i]} với ${right[j]}`,
          4,
          cmp,
          swp,
        )
        if ((left[i] ?? 0) <= (right[j] ?? 0)) {
          a[k] = left[i++]!
        } else {
          a[k] = right[j++]!
        }
        swp++
        yield ms(a, [], [k], sorted, undefined, `Đặt ${a[k]} vào vị trí ${k}`, 5, cmp, swp)
        k++
      }
      while (i < left.length) {
        a[k++] = left[i++]!
        swp++
      }
      while (j < right.length) {
        a[k++] = right[j++]!
        swp++
      }

      if (width * 2 >= n) {
        for (let x = lo; x <= hi; x++) sorted.add(x)
      }
    }
  }
  yield ms(
    a,
    [],
    [],
    new Set(Array.from({ length: n }, (_, i) => i)),
    undefined,
    '✅ Merge Sort hoàn tất!',
    -1,
    cmp,
    swp,
  )
}

// ===== QUICK SORT (Lomuto, iterative with stack) =====
function* quickSortGen(arr: number[], pivotStrategy: PivotStrategy = 'last'): Generator<SortStep> {
  const a = [...arr]
  const n = a.length
  const sorted = new Set<number>()
  let cmp = 0,
    swp = 0

  const stack: [number, number][] = [[0, n - 1]]

  while (stack.length > 0) {
    const [lo, hi] = stack.pop()!
    if (lo >= hi) {
      if (lo === hi) sorted.add(lo)
      continue
    }

    let pivotIdx: number
    if (pivotStrategy === 'first') pivotIdx = lo
    else if (pivotStrategy === 'random') pivotIdx = lo + Math.floor(Math.random() * (hi - lo + 1))
    else if (pivotStrategy === 'median') {
      const mid = Math.floor((lo + hi) / 2)
      const vals = [lo, mid, hi].sort((x, y) => (a[x] ?? 0) - (a[y] ?? 0))
      pivotIdx = vals[1]!
    } else pivotIdx = hi

    if (pivotIdx !== hi) {
      ;[a[pivotIdx], a[hi]] = [a[hi]!, a[pivotIdx]!]
      swp++
      yield ms(
        a,
        [],
        [pivotIdx, hi],
        sorted,
        hi,
        `Di chuyển pivot ${a[hi]} về cuối đoạn`,
        2,
        cmp,
        swp,
      )
    }

    const pivot = a[hi]
    yield ms(a, [], [], sorted, hi, `Pivot = ${pivot}`, 3, cmp, swp)

    let i = lo - 1
    for (let j = lo; j < hi; j++) {
      cmp++
      yield ms(
        a,
        [j, hi],
        [],
        sorted,
        hi,
        `So sánh a[${j}]=${a[j]} với pivot=${pivot}`,
        5,
        cmp,
        swp,
      )
      if ((a[j] ?? 0) <= (pivot ?? 0)) {
        i++
        if (i !== j) {
          ;[a[i], a[j]] = [a[j]!, a[i]!]
          swp++
          yield ms(
            a,
            [],
            [i, j],
            sorted,
            hi,
            `a[${j}] ≤ pivot → hoán đổi a[${i}] và a[${j}]`,
            7,
            cmp,
            swp,
          )
        }
      }
    }

    ;[a[i + 1], a[hi]] = [a[hi]!, a[i + 1]!]
    swp++
    const p = i + 1
    sorted.add(p)
    yield ms(
      a,
      [],
      [p, hi],
      sorted,
      undefined,
      `Đặt pivot ${pivot} vào đúng vị trí: ${p}`,
      9,
      cmp,
      swp,
    )

    if (p - 1 > lo) stack.push([lo, p - 1])
    else if (p - 1 === lo) sorted.add(lo)
    if (p + 1 < hi) stack.push([p + 1, hi])
    else if (p + 1 === hi) sorted.add(hi)
  }

  yield ms(
    a,
    [],
    [],
    new Set(Array.from({ length: n }, (_, i) => i)),
    undefined,
    '✅ Quick Sort hoàn tất!',
    -1,
    cmp,
    swp,
  )
}

// ===== HEAP SORT =====
function* heapSortGen(arr: number[]): Generator<SortStep> {
  const a = [...arr]
  const n = a.length
  const sorted = new Set<number>()
  let cmp = 0,
    swp = 0

  function* heapify(size: number, root: number): Generator<SortStep> {
    let largest = root
    const l = 2 * root + 1
    const r = 2 * root + 2

    if (l < size) {
      cmp++
      yield ms(
        a,
        [l, largest],
        [],
        sorted,
        undefined,
        `So sánh con trái a[${l}]=${a[l]} với a[${largest}]=${a[largest]}`,
        3,
        cmp,
        swp,
      )
      if ((a[l] ?? 0) > (a[largest] ?? 0)) largest = l
    }
    if (r < size) {
      cmp++
      yield ms(
        a,
        [r, largest],
        [],
        sorted,
        undefined,
        `So sánh con phải a[${r}]=${a[r]} với a[${largest}]=${a[largest]}`,
        5,
        cmp,
        swp,
      )
      if ((a[r] ?? 0) > (a[largest] ?? 0)) largest = r
    }
    if (largest !== root) {
      ;[a[root], a[largest]] = [a[largest]!, a[root]!]
      swp++
      yield ms(
        a,
        [],
        [root, largest],
        sorted,
        undefined,
        `Hoán đổi a[${root}]=${a[largest]} ↔ a[${largest}]=${a[root]}`,
        8,
        cmp,
        swp,
      )
      yield* heapify(size, largest)
    }
  }

  yield ms(a, [], [], sorted, undefined, 'Xây dựng Max-Heap...', 1, cmp, swp)
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(n, i)
  }
  yield ms(
    a,
    [],
    [],
    sorted,
    undefined,
    'Max-Heap xong, bắt đầu trích xuất phần tử lớn nhất',
    10,
    cmp,
    swp,
  )

  for (let i = n - 1; i > 0; i--) {
    ;[a[0], a[i]] = [a[i]!, a[0]!]
    swp++
    sorted.add(i)
    yield ms(
      a,
      [],
      [0, i],
      sorted,
      undefined,
      `Đưa phần tử lớn nhất ${a[i]} về vị trí cuối: ${i}`,
      12,
      cmp,
      swp,
    )
    yield* heapify(i, 0)
  }
  sorted.add(0)
  yield ms(
    a,
    [],
    [],
    new Set(Array.from({ length: n }, (_, i) => i)),
    undefined,
    '✅ Heap Sort hoàn tất!',
    -1,
    cmp,
    swp,
  )
}

// ===== SHELL SORT =====
function* shellSortGen(arr: number[]): Generator<SortStep> {
  const a = [...arr]
  const n = a.length
  let cmp = 0,
    swp = 0
  const sorted = new Set<number>()

  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    yield ms(a, [], [], sorted, undefined, `Khoảng cách gap = ${gap}`, 1, cmp, swp)
    for (let i = gap; i < n; i++) {
      const temp = a[i]!
      let j = i
      yield ms(a, [i], [], sorted, undefined, `Chèn a[${i}]=${temp} với gap=${gap}`, 3, cmp, swp)
      while (j >= gap) {
        cmp++
        yield ms(
          a,
          [j - gap, j],
          [],
          sorted,
          undefined,
          `So sánh a[${j - gap}]=${a[j - gap]} với temp=${temp}`,
          5,
          cmp,
          swp,
        )
        if ((a[j - gap] ?? 0) > temp) {
          a[j] = a[j - gap]!
          swp++
          yield ms(
            a,
            [],
            [j, j - gap],
            sorted,
            undefined,
            `${a[j]} > ${temp} → dịch sang phải`,
            6,
            cmp,
            swp,
          )
          j -= gap
        } else break
      }
      a[j] = temp as number
      yield ms(a, [], [], sorted, undefined, `Đặt ${temp} vào vị trí ${j}`, 8, cmp, swp)
    }
  }
  yield ms(
    a,
    [],
    [],
    new Set(Array.from({ length: n }, (_, i) => i)),
    undefined,
    '✅ Shell Sort hoàn tất!',
    -1,
    cmp,
    swp,
  )
}

// ===== COUNTING SORT =====
function* countingSortGen(arr: number[]): Generator<SortStep> {
  const a = [...arr]
  const n = a.length
  const cmp = 0
  let swp = 0
  const sorted = new Set<number>()

  const max = Math.max(...a)
  const count = Array.from({ length: max + 1 }, () => 0)
  yield ms(a, [], [], sorted, undefined, `Tạo mảng đếm kích thước ${max + 1}`, 1, cmp, swp)

  for (let i = 0; i < n; i++) {
    count[a[i]!]!++
    yield ms(
      a,
      [i],
      [],
      sorted,
      undefined,
      `Đếm a[${i}]=${a[i]} → count[${a[i]}]=${count[a[i]!]}`,
      3,
      cmp,
      swp,
    )
  }

  for (let i = 1; i <= max; i++) {
    count[i]! += count[i - 1]!
    yield ms(a, [], [], sorted, undefined, `Tích lũy: count[${i}]=${count[i]}`, 6, cmp, swp)
  }

  const output = Array.from({ length: n }, () => 0)
  const temp = [...a]
  for (let i = n - 1; i >= 0; i--) {
    const pos = count[temp[i]!]! - 1
    output[pos] = temp[i]!
    count[temp[i]!]!--
    swp++
    const display = [...a]
    output.forEach((v, idx) => {
      if (v !== 0 || idx === pos) display[idx] = v
    })
    yield ms(output, [], [pos], sorted, undefined, `Đặt ${temp[i]} vào vị trí ${pos}`, 9, cmp, swp)
  }

  for (let i = 0; i < n; i++) {
    a[i] = output[i]!
    sorted.add(i)
  }
  yield ms(
    a,
    [],
    [],
    new Set(Array.from({ length: n }, (_, i) => i)),
    undefined,
    '✅ Counting Sort hoàn tất!',
    -1,
    cmp,
    swp,
  )
}

// ===== RADIX SORT (LSD) =====
function* radixSortGen(arr: number[]): Generator<SortStep> {
  const a = [...arr]
  const n = a.length
  let cmp = 0,
    swp = 0
  const sorted = new Set<number>()

  const max = Math.max(...a)
  const digitNames = ['đơn vị', 'chục', 'trăm', 'nghìn']
  let digitIdx = 0

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10, digitIdx++) {
    const digitName = digitNames[digitIdx] ?? `10^${digitIdx}`
    yield ms(
      a,
      [],
      [],
      sorted,
      undefined,
      `Sắp xếp theo hàng ${digitName} (exp=${exp})`,
      1,
      cmp,
      swp,
    )

    const count = Array.from({ length: 10 }, () => 0)
    for (let i = 0; i < n; i++) {
      const d = Math.floor((a[i] ?? 0) / exp) % 10
      count[d]!++
      cmp++
      yield ms(
        a,
        [i],
        [],
        sorted,
        undefined,
        `Chữ số hàng ${digitName} của ${a[i]} là ${d}`,
        3,
        cmp,
        swp,
      )
    }
    for (let i = 1; i < 10; i++) count[i]! += count[i - 1]!

    const output = Array.from({ length: n }, () => 0)
    for (let i = n - 1; i >= 0; i--) {
      const d = Math.floor((a[i] ?? 0) / exp) % 10
      output[count[d]! - 1] = a[i]!
      count[d]!--
      swp++
    }
    for (let i = 0; i < n; i++) a[i] = output[i]!
    yield ms(a, [], [], sorted, undefined, `Sau khi sắp xếp theo hàng ${digitName}`, 9, cmp, swp)
  }

  yield ms(
    a,
    [],
    [],
    new Set(Array.from({ length: n }, (_, i) => i)),
    undefined,
    '✅ Radix Sort hoàn tất!',
    -1,
    cmp,
    swp,
  )
}

// ===== BOGO SORT =====
function* bogoSortGen(arr: number[]): Generator<SortStep> {
  const a = arr.slice(0, Math.min(arr.length, 8))
  const n = a.length
  let cmp = 0,
    swp = 0
  const MAX = 5000

  function isSorted(): boolean {
    for (let i = 0; i < n - 1; i++) {
      cmp++
      if ((a[i] ?? 0) > (a[i + 1] ?? 0)) return false
    }
    return true
  }

  function shuffle() {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j]!, a[i]!]
      swp++
    }
  }

  let attempts = 0
  while (!isSorted() && attempts < MAX) {
    attempts++
    yield ms(
      a,
      [],
      [],
      [],
      undefined,
      `Lần ${attempts}: chưa đúng thứ tự 😅 → xáo trộn ngẫu nhiên...`,
      1,
      cmp,
      swp,
    )
    shuffle()
    yield ms(a, [], [], [], undefined, `Sau khi xáo lần ${attempts}...`, 2, cmp, swp)
  }

  if (isSorted()) {
    yield ms(
      a,
      [],
      [],
      Array.from({ length: n }, (_, i) => i),
      undefined,
      `✅ Bogo Sort hoàn tất sau ${attempts} lần xáo! Thật may mắn! 🎉`,
      -1,
      cmp,
      swp,
    )
  } else {
    yield ms(
      a,
      [],
      [],
      [],
      undefined,
      `⚠️ Đã thử ${MAX} lần mà chưa xong. Bogo Sort đầu hàng! 💀`,
      -1,
      cmp,
      swp,
    )
  }
}

// ===== ALGORITHM DEFINITIONS =====
export const algorithms: AlgorithmDef[] = [
  {
    id: 'bubble',
    name: 'Bubble Sort',
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: true,
    description:
      'Liên tục so sánh và hoán đổi các cặp phần tử kề nhau. Phần tử lớn nhất "nổi bọt" về cuối mảng sau mỗi lượt.',
    pseudoCode: [
      'for i = 0 to n−2:',
      '  swapped = false',
      '  for j = 0 to n−i−2:',
      '    if a[j] > a[j+1]:',
      '      swap(a[j], a[j+1])',
      '      swapped = true',
      '  if not swapped: break',
    ],
    generate: bubbleSortGen,
  },
  {
    id: 'selection',
    name: 'Selection Sort',
    timeComplexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: false,
    description:
      'Mỗi lượt tìm phần tử nhỏ nhất trong phần chưa sắp xếp và đưa về đầu. Tổng số hoán đổi rất ít.',
    pseudoCode: [
      'for i = 0 to n−2:',
      '  min_idx = i',
      '  for j = i+1 to n−1:',
      '    if a[j] < a[min_idx]:',
      '      min_idx = j',
      '  if min_idx ≠ i:',
      '    swap(a[i], a[min_idx])',
    ],
    generate: selectionSortGen,
  },
  {
    id: 'insertion',
    name: 'Insertion Sort',
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: true,
    description:
      'Như sắp xếp bài tú lơ khơ — lấy từng phần tử và chèn vào đúng vị trí trong phần đã sắp xếp.',
    pseudoCode: [
      'for i = 1 to n−1:',
      '  key = a[i]',
      '  j = i − 1',
      '  while j ≥ 0 and a[j] > key:',
      '    a[j+1] = a[j]',
      '    j−−',
      '  a[j+1] = key',
    ],
    generate: insertionSortGen,
  },
  {
    id: 'merge',
    name: 'Merge Sort',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    stable: true,
    description:
      'Chia mảng thành nửa, sắp xếp từng nửa rồi gộp lại. Hiệu quả và ổn định, dùng trong Java/Python.',
    pseudoCode: [
      'mergeSort(lo, hi):',
      '  if lo ≥ hi: return',
      '  mid = (lo + hi) / 2',
      '  mergeSort(lo, mid)',
      '  mergeSort(mid+1, hi)',
      '  merge(lo, mid, hi)',
      '  // so sánh và gộp hai nửa',
    ],
    generate: mergeSortGen,
  },
  {
    id: 'quick',
    name: 'Quick Sort',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
    spaceComplexity: 'O(log n)',
    stable: false,
    description:
      'Chọn pivot, phân hoạch mảng thành hai phần (nhỏ hơn và lớn hơn pivot), rồi đệ quy. Nhanh trong thực tế.',
    pseudoCode: [
      'quickSort(lo, hi):',
      '  pivot = a[hi]',
      '  i = lo − 1',
      '  for j = lo to hi−1:',
      '    if a[j] ≤ pivot:',
      '      i++',
      '      swap(a[i], a[j])',
      '  swap(a[i+1], a[hi])',
      '  p = i + 1 // vị trí pivot',
      '  quickSort(lo, p−1)',
      '  quickSort(p+1, hi)',
    ],
    generate: quickSortGen,
  },
  {
    id: 'heap',
    name: 'Heap Sort',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(1)',
    stable: false,
    description:
      'Xây dựng Max-Heap từ mảng, sau đó liên tục trích xuất phần tử lớn nhất. Đảm bảo O(n log n) mọi trường hợp.',
    pseudoCode: [
      '// Xây dựng Max-Heap',
      'for i = n/2−1 to 0:',
      '  heapify(n, i)',
      '// Trích xuất phần tử',
      'for i = n−1 to 1:',
      '  swap(a[0], a[i])',
      '  heapify(i, 0)',
      '// heapify: đưa root về đúng vị trí',
      'heapify(size, root):',
      '  largest = max(root, left, right)',
      '  if largest ≠ root: swap và heapify lại',
    ],
    generate: heapSortGen,
  },
  {
    id: 'shell',
    name: 'Shell Sort',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log²n)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: false,
    description:
      'Tổng quát hóa Insertion Sort — so sánh các phần tử cách nhau "gap" khoảng, giảm dần gap về 1.',
    pseudoCode: [
      'gap = n / 2',
      'while gap > 0:',
      '  for i = gap to n−1:',
      '    temp = a[i]; j = i',
      '    while j ≥ gap and a[j−gap] > temp:',
      '      a[j] = a[j−gap]',
      '      j −= gap',
      '    a[j] = temp',
      '  gap = gap / 2',
    ],
    generate: shellSortGen,
  },
  {
    id: 'counting',
    name: 'Counting Sort',
    timeComplexity: { best: 'O(n+k)', average: 'O(n+k)', worst: 'O(n+k)' },
    spaceComplexity: 'O(k)',
    stable: true,
    description:
      'Đếm số lần xuất hiện của từng giá trị, sau đó tái tạo mảng. Rất nhanh khi k (giá trị max) nhỏ.',
    pseudoCode: [
      'count[0..max] = 0',
      'for i = 0 to n−1:',
      '  count[a[i]]++',
      '// Tích lũy',
      'for i = 1 to max:',
      '  count[i] += count[i−1]',
      '// Tái tạo mảng',
      'for i = n−1 to 0:',
      '  output[count[a[i]]−1] = a[i]',
      '  count[a[i]]−−',
    ],
    generate: countingSortGen,
  },
  {
    id: 'radix',
    name: 'Radix Sort',
    timeComplexity: { best: 'O(d·n)', average: 'O(d·n)', worst: 'O(d·n)' },
    spaceComplexity: 'O(n+k)',
    stable: true,
    description:
      'Sắp xếp theo từng chữ số từ thấp đến cao (LSD). Mỗi bước dùng Counting Sort. Hiệu quả cho số nguyên.',
    pseudoCode: [
      'for exp = 1, 10, 100, ...:',
      '  // Counting Sort theo chữ số exp',
      '  count[0..9] = 0',
      '  for i = 0 to n−1:',
      '    d = (a[i] / exp) % 10',
      '    count[d]++',
      '  // Tích lũy và tái tạo',
      '  ...',
      '  copy output về a',
    ],
    generate: radixSortGen,
  },
  {
    id: 'bogo',
    name: 'Bogo Sort',
    timeComplexity: { best: 'O(n)', average: 'O((n+1)!)', worst: '∞' },
    spaceComplexity: 'O(1)',
    stable: false,
    description:
      'Xáo trộn ngẫu nhiên cho đến khi mảng được sắp xếp. Hoàn toàn vô dụng nhưng rất vui! (Giới hạn 8 phần tử)',
    pseudoCode: [
      'while not sorted(a):',
      '  shuffle(a)  // xáo ngẫu nhiên',
      '',
      '// Độ phức tạp trung bình: O((n+1)!)',
      '// Với n=8: ~362.880 lần thử',
      '// Không bao giờ dùng trong thực tế 😂',
    ],
    generate: bogoSortGen,
    maxSize: 8,
  },
]

export const algorithmMap = new Map(algorithms.map((a) => [a.id, a]))
